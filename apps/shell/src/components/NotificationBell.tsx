import { useState } from 'react';
import { usePlatform } from '@/platform/PlatformContext';
import { useAsyncData } from '@/platform/useAsyncData';
import styles from './NotificationBell.module.css';

const PANEL_ID = 'npst-notification-panel';

/** Bell with a count of unread notifications + reminders, and a panel listing them. */
export function NotificationBell() {
  const platform = usePlatform();
  const inbox = useAsyncData(platform.inbox.list);
  const reminders = useAsyncData(platform.reminders.list);
  const [open, setOpen] = useState(false);

  const unread =
    inbox.status === 'ready' ? inbox.data.filter((item) => !item.read) : [];
  const upcoming = reminders.status === 'ready' ? reminders.data : [];
  const count = unread.length + upcoming.length;

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.bell}
        aria-label={`Notifications, ${count} new`}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6V11a6 6 0 0 0-5-5.9V4a1 1 0 1 0-2 0v1.1A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z"
          />
        </svg>
        {count > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div id={PANEL_ID} className={styles.panel}>
          <h2 className={styles.heading}>Notifications</h2>
          {unread.length === 0 ? (
            <p className={styles.empty}>No new notifications</p>
          ) : (
            <ul className={styles.list}>
              {unread.map((item) => (
                <li key={item.id}>{item.title}</li>
              ))}
            </ul>
          )}

          <h2 className={styles.heading}>Reminders</h2>
          {upcoming.length === 0 ? (
            <p className={styles.empty}>No reminders</p>
          ) : (
            <ul className={styles.list}>
              {upcoming.map((reminder) => (
                <li key={reminder.id}>
                  {reminder.title}
                  <span className={styles.due}>
                    Due {new Date(reminder.dueAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
