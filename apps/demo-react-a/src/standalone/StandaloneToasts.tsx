import type { ShellPlatformApi, Toast } from '@npst/shared-contracts';
import { useEffect, useState } from 'react';
import styles from './StandaloneToasts.module.css';

const TOAST_DURATION_MS = 4000;

/**
 * Development-only toast display for standalone mode. Inside the portal the
 * shell shows toasts; here there is no shell, so the harness shows them.
 */
export function StandaloneToasts({ platform }: { platform: ShellPlatformApi }) {
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
        <div key={toast.id} className={styles.toast}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
