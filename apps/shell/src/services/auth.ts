import { mockAuth } from '@npst/platform-mocks';
import type { PlatformUser } from '@npst/shared-contracts';

/**
 * Sign-in for the portal (the only login; MFEs never log in themselves).
 * Mock for now: pick a predefined user, no password.
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

/** Users shown on the mock login page. */
export const loginOptions: readonly PlatformUser[] = mockAuth.users;

export async function signIn(userId: string): Promise<PlatformUser> {
  const user = await mockAuth.signIn(userId);
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
    return userId ? (mockAuth.findUser(userId) ?? null) : null;
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
