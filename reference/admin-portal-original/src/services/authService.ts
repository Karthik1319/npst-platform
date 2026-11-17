import { auditService } from './auditService';
import { clearSession, readSession, writeSession } from './storage';
import type { Session } from '@/types';

/**
 * Mock authentication — the ONLY credential pair the prototype accepts.
 * The session lives in an httpOnly-cookie-shaped LocalStorage/sessionStorage record
 * so swapping to a real /api/auth backend later is a single-service change.
 */
const SUPER_ADMIN = {
  email: 'admin@npst.com',
  password: 'Admin@123',
  name: 'Aarav Mehta',
  role: 'Super Admin' as const,
};

export interface LoginResult {
  ok: boolean;
  error?: string;
  session?: Session;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const authService = {
  getSession: readSession,
  superAdminEmail: SUPER_ADMIN.email,

  async login(email: string, password: string, remember: boolean): Promise<LoginResult> {
    // Simulated network latency for the loading animation.
    await wait(900);
    const normalized = email.trim().toLowerCase();
    if (normalized !== SUPER_ADMIN.email || password !== SUPER_ADMIN.password) {
      auditService.log('Settings', `Failed sign-in attempt for ${normalized || '(empty)'}`, 'Portal', 'failed');
      return { ok: false, error: 'Invalid email or password. Please try again.' };
    }
    const session: Session = {
      email: SUPER_ADMIN.email,
      name: SUPER_ADMIN.name,
      role: SUPER_ADMIN.role,
      loginAt: new Date().toISOString(),
      remember,
    };
    writeSession(session, remember);
    auditService.log('Settings', 'Super Admin signed in to the portal', 'Portal');
    return { ok: true, session };
  },

  logout(): void {
    auditService.log('Settings', 'Super Admin signed out of the portal', 'Portal');
    clearSession();
  },
};
