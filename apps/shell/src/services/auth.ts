import {
  DEMO_PASSWORD,
  mockUsers,
  SignInError,
  type MockUser,
} from '@npst/platform-mocks';
import type { PlatformUser } from '@npst/shared-contracts';
import { userService } from '@/services/adminService';
import { setSessionSource } from '@/services/storage';

/**
 * Sign-in for the portal (the only login; MFEs never log in themselves).
 * Mock for now: the users provisioned in Employee Management (the Admin
 * Portal's RBAC and Provisioning page) sign in with email and the one demo
 * password. Deactivating a user there blocks their sign-in; their role and
 * assigned applications decide what they see after their next sign-in.
 *
 * Real flow (docs/architecture.md, section 5): the backend authenticates the
 * user, creates a central session and sets a secure, browser-managed session
 * cookie; this file then only calls the backend's login/logout and reads the
 * current user. Only this file changes.
 *
 * Authentication only says WHO the user is. WHAT they may do is RBAC,
 * answered by `platform.permissions.can()`.
 */

/**
 * Mock only: the signed-in user's id in the browser's localStorage stands in
 * for the backend session cookie. Like that cookie, it is shared by every tab
 * of the portal, so the user signs in once for the portal and all its
 * applications. It never reaches MFEs; the real cookie is managed by the
 * browser (HttpOnly, invisible to scripts).
 */
export const SESSION_STORAGE_KEY = 'npst.session.userId';

function sessionStore(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null; // Storage blocked: the session lasts until the page reloads.
  }
}

/**
 * Checks the credentials and starts the central session. Throws `SignInError`
 * (with the message to show) when they are wrong or the account is inactive.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<PlatformUser> {
  const normalized = email.trim().toLowerCase();
  const user = directory().find((candidate) => candidate.email === normalized);
  if (!user || password !== (user.password ?? DEMO_PASSWORD))
    throw new SignInError();
  if (user.status !== 'active') {
    throw new SignInError(
      'This account is inactive. Contact your administrator.',
    );
  }
  try {
    sessionStore()?.setItem(SESSION_STORAGE_KEY, user.id);
  } catch {
    // Storage full or blocked: the session lasts until the page reloads.
  }
  return user;
}

export function signOut(): void {
  try {
    sessionStore()?.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Nothing stored.
  }
}

/** The signed-in user (after a reload, in a new tab), or `null`. */
export function restoreSession(): PlatformUser | null {
  try {
    const userId = sessionStore()?.getItem(SESSION_STORAGE_KEY);
    const user = userId
      ? directory().find((candidate) => candidate.id === userId)
      : undefined;
    return user && user.status === 'active' ? user : null;
  } catch {
    return null;
  }
}

/**
 * Calls `listener` when the session changes in another tab (sign-out, or
 * sign-in as someone else), so every open tab follows: one session for the
 * whole portal. Real system: the backend invalidates the session centrally;
 * the next API call returns 401 and the portal returns to its login page
 * (optionally all tabs are told at once, e.g. with a BroadcastChannel).
 */
export function onSessionChange(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    // `key` is null when the whole storage was cleared.
    if (event.key === SESSION_STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

/**
 * Mock RBAC and Provisioning: the users of User Management (and the Admin
 * Portal's demo accounts), as platform users. The first role is the portal role; seeded users keep their team in
 * the stand-in business apps as a second role (see `@npst/platform-mocks`).
 */
function directory(): MockUser[] {
  const provisioned: MockUser[] = userService.list().map((user) => {
    const seeded = mockUsers.find((candidate) => candidate.id === user.id);
    const teams = seeded
      ? seeded.roles.slice(1)
      : user.role === 'Employee'
        ? ['EMPLOYEE']
        : [];
    return {
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase(),
      roles: [user.role, ...teams],
      apps: user.apps,
      status: user.status,
    };
  });
  // The Admin Portal's demo accounts (maker, checker, employee) are not in
  // Employee Management; they sign in with their own passwords.
  const accounts = mockUsers.filter(
    (account) =>
      account.password !== undefined &&
      !provisioned.some((user) => user.email === account.email),
  );
  return [...provisioned, ...accounts];
}

// The Admin Portal's services read the signed-in user from the central session.
setSessionSource(restoreSession);
