import { useEffect, useState } from 'react';

export type AsyncData<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; error: Error };

/** Runs an async platform call once and tracks loading / ready / error. */
export function useAsyncData<T>(load: () => Promise<T>): AsyncData<T> {
  const [state, setState] = useState<AsyncData<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    load().then(
      (data) => {
        if (active) setState({ status: 'ready', data });
      },
      (error: unknown) => {
        if (active) {
          setState({
            status: 'error',
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [load]);

  return state;
}
