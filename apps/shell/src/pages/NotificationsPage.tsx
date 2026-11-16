import { useState } from 'react';
import { NotificationItem } from '@/components/NotificationItem';
import { useInbox } from '@/platform/InboxContext';
import { formatDate } from '@/ui/format';
import { Icon } from '@/ui/Icon';
import styles from './Page.module.css';

/** Every notification and reminder for the signed-in user, from all applications. */
export function NotificationsPage() {
  const { items, reminders, unreadCount, markAllRead, status } = useInbox();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const shown = filter === 'all' ? items : items.filter((item) => !item.read);

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.intro}>
            Updates from every application, in one place.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={markAllRead}
          >
            <Icon name="check" size={16} /> Mark all as read
          </button>
        )}
      </div>

      <div className={styles.columns}>
        <div className={styles.panel}>
          <div
            className={styles.tabs}
            role="group"
            aria-label="Filter notifications"
          >
            <button
              type="button"
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              aria-pressed={filter === 'unread'}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
          </div>
          {status === 'ready' && shown.length === 0 ? (
            <p className={styles.empty}>No notifications here.</p>
          ) : (
            <ul className={styles.divided}>
              {shown.map((item) => (
                <li key={item.id}>
                  <NotificationItem item={item} detailed />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Reminders</h2>
          {reminders.length === 0 ? (
            <p className={styles.empty}>No reminders.</p>
          ) : (
            <ul className={styles.divided}>
              {reminders.map((reminder) => (
                <li key={reminder.id} className={styles.reminder}>
                  <Icon name="calendar" size={18} />
                  <span>{reminder.title}</span>
                  <span className={styles.muted}>
                    {formatDate(reminder.dueAt.slice(0, 10))},{' '}
                    {new Date(reminder.dueAt).toLocaleTimeString('en-IN', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
