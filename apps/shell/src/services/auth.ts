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
 * Mock only: the user's id in tab storage stands in for the backend session.
 * It never reaches MFEs; the real session cookie is managed by the browser.
 */
export const SESSION_STORAGE_KEY = 'npst.session.userId';

/** Users shown on the mock login page. */
export const loginOptions: readonly PlatformUser[] = mockAuth.users;

export async function signIn(userId: string): Promise<PlatformUser> {
  const user = await mockAuth.signIn(userId);
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, user.id);
  } catch {
    // Storage blocked: the session lasts until the page reloads.
  }
  return user;
}

export function signOut(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Nothing stored.
  }
}

/** Restores the signed-in user after a page reload. */
export function restoreSession(): PlatformUser | null {
  try {
    const userId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return userId ? (mockAuth.findUser(userId) ?? null) : null;
  } catch {
    return null;
  }
}
