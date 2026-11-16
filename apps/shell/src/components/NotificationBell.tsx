import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router';
import { NotificationItem } from '@/components/NotificationItem';
import { useInbox } from '@/platform/InboxContext';
import { formatDate } from '@/ui/format';
import { Icon } from '@/ui/Icon';
import { useDismiss } from '@/ui/useDismiss';
import styles from './NotificationBell.module.css';

const PANEL_ID = 'npst-notification-panel';

/**
 * The portal's global bell (Notification Service + Alerts and Reminders).
 * Shows notifications from every application in one place.
 */
export function NotificationBell() {
  const { items, reminders, unreadCount, markAllRead } = useInbox();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        type="button"
        className={styles.bell}
        aria-label={`Notifications, ${unreadCount} new`}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <Icon name="bell" size={22} />
        {unreadCount > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id={PANEL_ID}
          className={styles.panel}
          role="dialog"
          aria-label="Notifications"
        >
          <div className={styles.head}>
            <h2 className={styles.heading}>Notifications</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.textButton}
                onClick={markAllRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className={styles.empty}>You are all caught up.</p>
          ) : (
            <ul className={styles.list}>
              {items.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <NotificationItem item={item} onOpen={close} />
                </li>
              ))}
            </ul>
          )}

          {reminders.length > 0 && (
            <>
              <h2 className={`${styles.heading} ${styles.subheading}`}>
                Reminders
              </h2>
              <ul className={styles.reminders}>
                {reminders.slice(0, 3).map((reminder) => (
                  <li key={reminder.id}>
                    <Icon name="calendar" size={16} />
                    <span>{reminder.title}</span>
                    <span className={styles.due}>
                      {formatDate(reminder.dueAt.slice(0, 10))}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <Link to="/notifications" className={styles.viewAll} onClick={close}>
            View all notifications <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
