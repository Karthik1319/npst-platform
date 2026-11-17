import type { PlatformUser } from '@npst/shared-contracts';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as auth from '@/services/auth';

interface SessionValue {
  /** The signed-in user, or `null` when nobody is signed in. */
  user: PlatformUser | null;
  /** Throws when the credentials are wrong (see `services/auth.ts`). */
  signIn(email: string, password: string): Promise<PlatformUser>;
  signOut(): void;
}

const SessionContext = createContext<SessionValue | null>(null);

/** Holds who is signed in. Knows nothing about permissions. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PlatformUser | null>(() =>
    auth.restoreSession(),
  );

  // One session for every tab: follow sign-in/sign-out done in another tab.
  useEffect(
    () => auth.onSessionChange(() => setUser(auth.restoreSession())),
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const signedIn = await auth.signIn(email, password);
    setUser(signedIn);
    return signedIn;
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
