import type { InboxItem } from '@npst/shared-contracts';
import { useNavigate } from 'react-router';
import { useInbox } from '@/platform/InboxContext';
import { appVisual } from '@/ui/app-visuals';
import { timeAgo } from '@/ui/format';
import { Icon, type IconName } from '@/ui/Icon';
import styles from './NotificationItem.module.css';

const KIND_ICON: Record<string, IconName> = {
  success: 'checkCircle',
  warning: 'clock',
  error: 'alert',
};

interface NotificationItemProps {
  item: InboxItem;
  /** Show the description and app name (pages), or keep it compact (bell, cards). */
  detailed?: boolean;
  onOpen?: () => void;
}

/** One notification. Opening it marks it read and goes to the related record. */
export function NotificationItem({
  item,
  detailed = false,
  onOpen,
}: NotificationItemProps) {
  const { markRead } = useInbox();
  const navigate = useNavigate();
  const visual = appVisual(item.appId);
  const kind = item.kind ?? 'info';
  const icon = KIND_ICON[kind] ?? visual.icon;
  const iconClass = KIND_ICON[kind]
    ? styles[kind]
    : styles[`tone${visual.tone}`];

  function open() {
    if (!item.read) markRead(item.id);
    // Navigate before `onOpen` (which may close the bell and unmount this item).
    if (item.link) navigate(item.link);
    onOpen?.();
  }

  return (
    <button
      type="button"
      className={`${styles.item} ${item.read ? '' : styles.unread}`}
      onClick={open}
    >
      <span className={`${styles.icon} ${iconClass}`}>
        <Icon name={icon} size={18} />
      </span>
      <span className={styles.body}>
        <span className={styles.title}>{item.title}</span>
        {detailed && item.description && (
          <span className={styles.description}>{item.description}</span>
        )}
        {detailed && <span className={styles.app}>{visual.short}</span>}
      </span>
      <span className={styles.time}>{timeAgo(item.createdAt)}</span>
      {!item.read && <span className={styles.dot} aria-hidden="true" />}
    </button>
  );
}
