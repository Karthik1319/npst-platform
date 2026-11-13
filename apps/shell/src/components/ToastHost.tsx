import type { Toast } from '@npst/shared-contracts';
import { useEffect, useState } from 'react';
import { usePlatform } from '@/platform/PlatformContext';
import styles from './ToastHost.module.css';

const TOAST_DURATION_MS = 4000;

/** Shows toasts requested through `platform.notify.toast()`, by the shell or any MFE. */
export function ToastHost() {
  const platform = usePlatform();
  const [toasts, setToasts] = useState<readonly Toast[]>([]);

  useEffect(
    () =>
      platform.toasts.subscribe((toast) => {
        setToasts((current) => [...current, toast]);
        window.setTimeout(() => {
          setToasts((current) =>
            current.filter((item) => item.id !== toast.id),
          );
        }, TOAST_DURATION_MS);
      }),
    [platform],
  );

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.kind]}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
