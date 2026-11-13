import { mockAuth } from '@npst/platform-mocks';
import type { PlatformUser } from '@npst/shared-contracts';

/**
 * Sign-in for the portal. Mock for now: pick a predefined user, no password.
 * Real sign-in (identity provider) replaces this file only.
 *
 * Authentication only says WHO the user is. WHAT they may do is RBAC,
 * answered by `platform.permissions.can()`.
 */

/** Browser-tab session only; cleared when the tab closes. */
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
