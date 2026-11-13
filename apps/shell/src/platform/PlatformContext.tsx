import type { ShellPlatformApi } from '@npst/shared-contracts';
import { createContext, useContext, type ReactNode } from 'react';

const PlatformContext = createContext<ShellPlatformApi | null>(null);

interface PlatformProviderProps {
  platform: ShellPlatformApi;
  children: ReactNode;
}

/** Makes the platform object available to every shell component. */
export function PlatformProvider({
  platform,
  children,
}: PlatformProviderProps) {
  return <PlatformContext value={platform}>{children}</PlatformContext>;
}

export function usePlatform(): ShellPlatformApi {
  const platform = useContext(PlatformContext);
  if (!platform) {
    throw new Error('usePlatform() must be used inside <PlatformProvider>');
  }
  return platform;
}
