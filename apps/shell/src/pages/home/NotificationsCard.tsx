import { NotificationItem } from '@/components/NotificationItem';
import { useInbox } from '@/platform/InboxContext';
import { Card } from '@/ui/Card';
import styles from './Home.module.css';

/** Latest notifications (same inbox as the bell). */
export function NotificationsCard() {
  const { items, status } = useInbox();
  return (
    <Card
      title="Notifications"
      link={{ to: '/notifications', label: 'View all' }}
    >
      {status === 'ready' && items.length === 0 && (
        <p className={styles.empty}>You are all caught up.</p>
      )}
      <ul className={styles.stack}>
        {items.slice(0, 4).map((item) => (
          <li key={item.id}>
            <NotificationItem item={item} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
