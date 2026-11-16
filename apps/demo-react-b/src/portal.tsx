import type { PlatformApi, PlatformUser } from '@npst/shared-contracts';
import { createContext, useContext, type ReactNode } from 'react';

interface PortalValue {
  user: PlatformUser;
  platform: PlatformApi;
}

const PortalContext = createContext<PortalValue | null>(null);

/** Makes the props from the portal (user, platform) available to every page. */
export function PortalProvider({
  value,
  children,
}: {
  value: PortalValue;
  children: ReactNode;
}) {
  return <PortalContext value={value}>{children}</PortalContext>;
}

export function usePortal(): PortalValue {
  const value = useContext(PortalContext);
  if (!value)
    throw new Error('usePortal() must be used inside <PortalProvider>');
  return value;
}
