import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SignInError } from '@npst/platform-mocks';
import { auditService } from '@/services/auditService';
import { useSession } from '@/session/SessionContext';
import type { Session } from '@/types';
import { toSession } from './session-shape';

/*
 * The Admin Portal's `useAuth()` (same API as the original), backed by the
 * portal's central session (`session/SessionContext.tsx`, `services/auth.ts`):
 * one sign-in for the portal and every application, shared by all tabs, and
 * sign-out ends it everywhere.
 */

export interface LoginResult {
  ok: boolean;
  error?: string;
  session?: Session;
}

interface AuthContextValue {
  user: Session | null;
  login: (
    email: string,
    password: string,
    remember: boolean,
  ) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Same short delay as the original, for its loading animation.
const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const queryClient = useQueryClient();

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session.user ? toSession(session.user) : null,
      login: async (email, password, remember) => {
        await wait(900);
        let signedIn;
        try {
          signedIn = await session.signIn(email, password);
        } catch (error) {
          const normalized = email.trim().toLowerCase();
          auditService.log(
            'Settings',
            `Failed sign-in attempt for ${normalized || '(empty)'}`,
            'Portal',
            'failed',
          );
          const message =
            error instanceof SignInError
              ? error.message
              : 'Sign-in failed. Please try again.';
          return { ok: false, error: message };
        }
        // Mock audit entry (the real Authentication service writes it on the server).
        auditService.log(
          'Settings',
          `${signedIn.email} signed in to the portal`,
          'Portal',
        );
        queryClient.clear();
        // `remember` is kept for the original form; the central session is
        // always shared by every tab (docs/single-session.md).
        return { ok: true, session: toSession(signedIn, remember) };
      },
      logout: () => {
        if (session.user)
          auditService.log(
            'Settings',
            `${session.user.email} signed out of the portal`,
            'Portal',
          );
        session.signOut();
        // Drop cached mock data so the next sign-in renders fresh state.
        queryClient.clear();
      },
    }),
    [session, queryClient],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
