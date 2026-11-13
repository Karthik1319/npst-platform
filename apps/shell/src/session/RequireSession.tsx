import type { PlatformUser } from '@npst/shared-contracts';
import { useMemo, type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { PlatformProvider } from '@/platform/PlatformContext';
import { createPlatform } from '@/services/platform';
import { useSession } from '@/session/SessionContext';

/** Protects the portal: no session → login page. */
export function RequireSession({ children }: { children: ReactNode }) {
  const { user } = useSession();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <SignedInPlatform user={user}>{children}</SignedInPlatform>;
}

/** One platform object per signed-in user, given to the whole portal. */
function SignedInPlatform({
  user,
  children,
}: {
  user: PlatformUser;
  children: ReactNode;
}) {
  const platform = useMemo(() => createPlatform(user), [user]);
  return <PlatformProvider platform={platform}>{children}</PlatformProvider>;
}
