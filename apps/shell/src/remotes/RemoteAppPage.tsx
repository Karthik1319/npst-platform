import type { PortalApp } from '@npst/shared-contracts';
import { Suspense, type ComponentType } from 'react';
import type { MfeProps } from '@npst/shared-contracts';
import { usePlatform } from '@/platform/PlatformContext';
import { RemoteErrorBoundary } from '@/remotes/RemoteErrorBoundary';

interface RemoteAppPageProps {
  app: PortalApp;
  Remote: ComponentType<MfeProps>;
}

/**
 * Renders a remote React app and passes it the host props (shell → MFE).
 * The remote talks back through `platform` (MFE → shell), e.g. toasts.
 */
export function RemoteAppPage({ app, Remote }: RemoteAppPageProps) {
  const platform = usePlatform();

  return (
    <RemoteErrorBoundary appName={app.name}>
      <Suspense fallback={<p>Loading {app.name}…</p>}>
        <Remote user={platform.user} basePath={app.path} platform={platform} />
      </Suspense>
    </RemoteErrorBoundary>
  );
}
