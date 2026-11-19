import { auditService } from './auditService';
import { clearSession, readSession, writeSession } from './storage';
import type { Session } from '@/types';

/**
 * Mock authentication — the ONLY credential pair the prototype accepts.
 * The session lives in an httpOnly-cookie-shaped LocalStorage/sessionStorage record
 * so swapping to a real /api/auth backend later is a single-service change.
 */
const ACCOUNTS = [
  {
  email: 'admin@npst.com',
  password: 'Admin@123',
  name: 'Aarav Mehta',
  role: 'Super Admin' as const,
  },
  { email: 'maker@npst.com', password: 'Maker@123', name: 'Rajneesh Singh', role: 'Maker' as const },
  { email: 'checker@npst.com', password: 'Checker@123', name: 'Priya Nair', role: 'Checker' as const },
  { email: 'employee@npst.com', password: 'Employee@123', name: 'Arjun Rao', role: 'Employee' as const },
] as const;

export interface LoginResult {
  ok: boolean;
  error?: string;
  session?: Session;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const authService = {
  getSession: readSession,
  superAdminEmail: ACCOUNTS[0].email,

  async login(email: string, password: string, remember: boolean): Promise<LoginResult> {
    // Simulated network latency for the loading animation.
    await wait(900);
    const normalized = email.trim().toLowerCase();
    const account = ACCOUNTS.find((candidate) => candidate.email === normalized && candidate.password === password);
    if (!account) {
      auditService.log('Settings', `Failed sign-in attempt for ${normalized || '(empty)'}`, 'Portal', 'failed');
      return { ok: false, error: 'Invalid email or password. Please try again.' };
    }
    const session: Session = {
      email: account.email,
      name: account.name,
      role: account.role,
      loginAt: new Date().toISOString(),
      remember,
    };
    writeSession(session, remember);
    auditService.log('Settings', `${account.role} signed in to the portal`, 'Portal');
    return { ok: true, session };
  },

  logout(): void {
    auditService.log('Settings', 'User signed out of the portal', 'Portal');
    clearSession();
  },
};
