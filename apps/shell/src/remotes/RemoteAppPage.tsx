import type { MfeProps, MountableMfe, PortalApp } from '@npst/shared-contracts';
import { Suspense, use, useState, type ComponentType } from 'react';
import { usePlatform } from '@/platform/PlatformContext';
import { loadWithRetry } from '@/remotes/load-with-retry';
import { MountRemote } from '@/remotes/MountRemote';
import { RemoteErrorBoundary } from '@/remotes/RemoteErrorBoundary';
import type { RemoteDefinition } from '@/remotes/registry';

interface RemoteAppPageProps {
  app: PortalApp;
  remote: RemoteDefinition;
}

type Started =
  | {
      kind: 'react';
      module: Promise<{ default: ComponentType<MfeProps> }>;
    }
  | { kind: 'mount'; load: () => Promise<MountableMfe> };

/** Starts loading a remote, with its time limit and one automatic retry. */
function start(remote: RemoteDefinition, appName: string): Started {
  const onRetry = (error: unknown) =>
    console.warn(`[shell] ${appName} failed to load, retrying once`, error);
  return remote.kind === 'react'
    ? { kind: 'react', module: loadWithRetry(remote.load, { onRetry }) }
    : { kind: 'mount', load: () => loadWithRetry(remote.load, { onRetry }) };
}

/**
 * Renders a remote app (React component, or mount contract for other
 * frameworks) and passes it the host props (shell → MFE). The remote talks
 * back through `platform` (MFE → shell), e.g. toasts.
 *
 * Failure handling: each load has a time limit and one automatic retry; if it
 * still fails (or the remote crashes), only this area shows a fallback with
 * "Try again", which starts a fresh load (no page reload needed). The rest of
 * the portal keeps working.
 */
export function RemoteAppPage({ app, remote }: RemoteAppPageProps) {
  const platform = usePlatform();
  // Kept here (outside the Suspense boundary) so the load survives suspending.
  const [started, setStarted] = useState(() => start(remote, app.name));
  const [attempt, setAttempt] = useState(0);
  const props: MfeProps = {
    user: platform.user,
    basePath: app.path,
    platform,
  };

  function retry() {
    setStarted(start(remote, app.name));
    setAttempt((n) => n + 1);
  }

  return (
    // A new key on "Try again" resets the boundary and everything below it.
    <RemoteErrorBoundary key={attempt} appName={app.name} onRetry={retry}>
      {started.kind === 'react' ? (
        <Suspense fallback={<p role="status">Loading {app.name}…</p>}>
          <ReactRemote module={started.module} {...props} />
        </Suspense>
      ) : (
        <MountRemote appName={app.name} load={started.load} {...props} />
      )}
    </RemoteErrorBoundary>
  );
}

function ReactRemote({
  module,
  ...props
}: MfeProps & { module: Promise<{ default: ComponentType<MfeProps> }> }) {
  const { default: Remote } = use(module);
  return <Remote {...props} />;
}
