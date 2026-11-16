import type { MfeProps, MountableMfe, PortalApp } from '@npst/shared-contracts';
import { Suspense, type ComponentType } from 'react';
import { usePlatform } from '@/platform/PlatformContext';
import { MountRemote } from '@/remotes/MountRemote';
import { RemoteErrorBoundary } from '@/remotes/RemoteErrorBoundary';

type RemoteAppPageProps =
  | { app: PortalApp; Remote: ComponentType<MfeProps>; load?: never }
  | { app: PortalApp; load: () => Promise<MountableMfe>; Remote?: never };

/**
 * Renders a remote app (React component, or mount contract for other
 * frameworks) and passes it the host props (shell → MFE).
 * The remote talks back through `platform` (MFE → shell), e.g. toasts.
 */
export function RemoteAppPage({ app, Remote, load }: RemoteAppPageProps) {
  const platform = usePlatform();
  const props: MfeProps = {
    user: platform.user,
    basePath: app.path,
    platform,
  };

  return (
    <RemoteErrorBoundary appName={app.name}>
      {Remote ? (
        <Suspense fallback={<p>Loading {app.name}…</p>}>
          <Remote {...props} />
        </Suspense>
      ) : (
        <MountRemote appName={app.name} load={load} {...props} />
      )}
    </RemoteErrorBoundary>
  );
}
