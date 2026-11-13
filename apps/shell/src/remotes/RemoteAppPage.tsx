import type { PortalApp } from '@npst/shared-contracts';
import { Suspense, type ComponentType } from 'react';
import type { MfeProps } from '@npst/shared-contracts';
import { usePlatform } from '@/platform/PlatformContext';
import { RemoteErrorBoundary } from '@/remotes/RemoteErrorBoundary';
import { bus } from '@/services/bus';

interface RemoteAppPageProps {
  app: PortalApp;
  Remote: ComponentType<MfeProps>;
}

/** Renders a remote React app and passes it the host props (the host contract). */
export function RemoteAppPage({ app, Remote }: RemoteAppPageProps) {
  const platform = usePlatform();

  return (
    <RemoteErrorBoundary appName={app.name}>
      <Suspense fallback={<p>Loading {app.name}…</p>}>
        <Remote
          user={platform.user}
          basePath={app.path}
          bus={bus}
          platform={platform}
        />
      </Suspense>
    </RemoteErrorBoundary>
  );
}
