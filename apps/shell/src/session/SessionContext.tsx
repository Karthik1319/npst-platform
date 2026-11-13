import type { PlatformUser } from '@npst/shared-contracts';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as auth from '@/services/auth';

interface SessionValue {
  /** The signed-in user, or `null` when nobody is signed in. */
  user: PlatformUser | null;
  signIn(userId: string): Promise<void>;
  signOut(): void;
}

const SessionContext = createContext<SessionValue | null>(null);

/** Holds who is signed in. Knows nothing about permissions. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PlatformUser | null>(() =>
    auth.restoreSession(),
  );

  const signIn = useCallback(async (userId: string) => {
    setUser(await auth.signIn(userId));
  }, []);

  const signOut = useCallback(() => {
    auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, signIn, signOut }),
    [user, signIn, signOut],
  );
  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionValue {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error('useSession() must be used inside <SessionProvider>');
  }
  return session;
}
