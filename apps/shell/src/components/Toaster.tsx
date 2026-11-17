import type { Toast } from '@npst/shared-contracts';
import { useEffect, useState } from 'react';
import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from '@/components/icons';
import { subscribeToasts } from '@/lib/toast';
import styles from './Toaster.module.css';

const DURATION_MS = 4000;
const ICONS = {
  success: CircleCheckIcon,
  info: InfoIcon,
  warning: TriangleAlertIcon,
  error: OctagonXIcon,
};

/**
 * The portal's toaster, bottom right, in the Admin Portal's toast style (the
 * original used sonner with rich colours). Shows toasts from the portal's
 * pages and from MFEs (`platform.notify.toast()`).
 */
export function Toaster() {
  const [toasts, setToasts] = useState<readonly Toast[]>([]);

  useEffect(
    () =>
      subscribeToasts((toast) => {
        setToasts((current) => [toast, ...current].slice(0, 3));
        window.setTimeout(
          () =>
            setToasts((current) =>
              current.filter((item) => item.id !== toast.id),
            ),
          DURATION_MS,
        );
      }),
    [],
  );

  return (
    <section
      className={styles.region}
      aria-label="Notifications"
      aria-live="polite"
    >
      <ol className={styles.list}>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.kind];
          return (
            <li
              key={toast.id}
              className={styles.toast}
              data-type={toast.kind}
              role="status"
            >
              <Icon className={styles.icon} />
              <span className={styles.title}>{toast.message}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
