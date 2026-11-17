import type { PlatformUser } from '@npst/shared-contracts';
import type { Session, UserRole } from '@/types';

const PORTAL_ROLES: readonly UserRole[] = [
  'Super Admin',
  'Admin',
  'Application Admin',
  'Employee',
];

/**
 * The central session's user in the shape the Admin Portal pages use
 * (`useAuth().user`). The portal role is the user's first portal role.
 */
export function toSession(user: PlatformUser, remember = true): Session {
  const role =
    user.roles.find((r): r is UserRole =>
      PORTAL_ROLES.includes(r as UserRole),
    ) ?? 'Employee';
  return {
    email: user.email,
    name: user.name,
    role,
    loginAt: signedInAt(user.id),
    remember,
  };
}

// Mock only: when this tab saw the user sign in (the real session knows it).
const signInTimes = new Map<string, string>();
function signedInAt(userId: string): string {
  let at = signInTimes.get(userId);
  if (!at) {
    at = new Date().toISOString();
    signInTimes.set(userId, at);
  }
  return at;
}
