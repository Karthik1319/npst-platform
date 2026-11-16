import { useCallback, useEffect, useState } from 'react';

export type Loaded<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; error: Error };

/**
 * Runs `load` when its inputs change and tracks loading / ready / error.
 * `reload()` runs it again (e.g. after saving). `load` must be stable
 * (wrap it in `useCallback`).
 */
export function useLoad<T>(load: () => Promise<T>): [Loaded<T>, () => void] {
  const [state, setState] = useState<Loaded<T>>({ status: 'loading' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    load().then(
      (data) => {
        if (active) setState({ status: 'ready', data });
      },
      (error: unknown) => {
        if (active)
          setState({
            status: 'error',
            error: error instanceof Error ? error : new Error(String(error)),
          });
      },
    );
    return () => {
      active = false;
    };
  }, [load, version]);

  const reload = useCallback(() => setVersion((n) => n + 1), []);
  return [state, reload];
}
