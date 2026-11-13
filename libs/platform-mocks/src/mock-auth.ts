import type { PlatformUser } from '@npst/shared-contracts';
import { mockUsers } from './mock-data';

/**
 * Mock sign-in: pick one of the predefined users, no password.
 * Only identifies the user; what the user may do is decided by RBAC
 * (`permissions.can()` in the platform object), not here.
 */
export const mockAuth = {
  users: mockUsers,

  findUser(userId: string): PlatformUser | undefined {
    return mockUsers.find((user) => user.id === userId);
  },

  async signIn(userId: string): Promise<PlatformUser> {
    const user = mockAuth.findUser(userId);
    if (!user) {
      throw new Error(`Unknown mock user: ${userId}`);
    }
    return user;
  },
};
