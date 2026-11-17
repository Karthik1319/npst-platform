import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService, type LoginResult } from '@/services/authService';
import type { Session } from '@/types';

interface AuthContextValue {
  user: Session | null;
  login: (email: string, password: string, remember: boolean) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Session is read synchronously from storage — no loading flicker on refresh.
  const [user, setUser] = useState<Session | null>(() => authService.getSession());
  const queryClient = useQueryClient();

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (email, password, remember) => {
        const result = await authService.login(email, password, remember);
        if (result.ok && result.session) setUser(result.session);
        return result;
      },
      logout: () => {
        authService.logout();
        setUser(null);
        // Drop cached mock data so the next login renders fresh state.
        queryClient.clear();
      },
    }),
    [user, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
