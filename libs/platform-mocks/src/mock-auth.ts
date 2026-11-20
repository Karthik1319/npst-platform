import type { PlatformUser } from '@npst/shared-contracts';
import { mockUsers, type MockUser } from './mock-data';

/**
 * Mock only: the seeded users sign in with this one demo password (the Admin
 * Portal's demo password); its demo accounts (maker, checker, employee) use
 * their own (`MockUser.password`). The real Authentication service checks
 * credentials on the server; no password ever lives in frontend code.
 */
export const DEMO_PASSWORD = 'Admin@123';

/** Why a sign-in failed (shown by the login page). */
export class SignInError extends Error {
  constructor(message = 'Invalid email or password. Please try again.') {
    super(message);
    this.name = 'SignInError';
  }
}

/**
 * Mock sign-in with email and password. Only identifies the user; what the
 * user may do is decided by RBAC (`permissions.can()` in the platform object).
 */
export const mockAuth = {
  users: mockUsers,

  findUser(userId: string): MockUser | undefined {
    return mockUsers.find((user) => user.id === userId);
  },

  async signIn(email: string, password: string): Promise<PlatformUser> {
    const normalized = email.trim().toLowerCase();
    const user = mockUsers.find((candidate) => candidate.email === normalized);
    if (!user || password !== (user.password ?? DEMO_PASSWORD))
      throw new SignInError();
    if (user.status !== 'active') {
      throw new SignInError(
        'This account is inactive. Contact your administrator.',
      );
    }
    return user;
  },
};
