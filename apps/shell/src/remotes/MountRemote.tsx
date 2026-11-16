import type { MfeProps, MountableMfe } from '@npst/shared-contracts';
import { useEffect, useRef, useState } from 'react';

interface MountRemoteProps extends MfeProps {
  appName: string;
  load: () => Promise<MountableMfe>;
}

/**
 * Hosts a non-React MFE through the mount contract: gives it a DOM element,
 * calls `mount(element, props)`, and `unmount(element)` when the route changes.
 * Errors are re-thrown during render so the surrounding error boundary shows
 * the same fallback as for React remotes.
 */
export function MountRemote({
  appName,
  load,
  user,
  basePath,
  platform,
}: MountRemoteProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  // mount/unmount are async: run them strictly one after another.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    let mfe: MountableMfe | undefined;
    queue.current = queue.current
      .then(load)
      .then(async (loaded) => {
        mfe = loaded;
        await loaded.mount(element, { user, basePath, platform });
        setStatus('ready');
      })
      .catch(setError);
    return () => {
      queue.current = queue.current.then(() => mfe?.unmount(element));
    };
  }, [load, user, basePath, platform]);

  if (error) {
    throw error;
  }
  return (
    <>
      {status === 'loading' && <p>Loading {appName}…</p>}
      <div ref={elementRef} />
    </>
  );
}
