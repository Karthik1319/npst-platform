import { useEffect, useState } from 'react';
import type { AsyncData } from '@/platform/useAsyncData';
import { businessData } from '@/services/business';

/**
 * Like `useAsyncData`, and loads again whenever the business data changes
 * (e.g. another app completed a task), so Portal Home stays current.
 * `load` must be stable (wrap it in `useCallback`).
 */
export function useLiveData<T>(load: () => Promise<T>): AsyncData<T> {
  const [state, setState] = useState<AsyncData<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    const run = () => {
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
    };
    run();
    const stop = businessData.subscribe(run);
    return () => {
      active = false;
      stop();
    };
  }, [load]);

  return state;
}
