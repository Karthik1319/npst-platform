import type { LucideIcon } from '@/components/icons';
import styles from './EmptyState.module.css';
import type { ReactNode } from 'react';
import { Inbox } from '@/components/icons';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: EmptyStateProps) {
  return (
    <div className={styles.div}>
      <div className={`${styles.div2} npst-sized`}>
        <Icon className={`${styles.icon} npst-sized`} />
      </div>
      <p className={styles.p}>{title}</p>
      {description && <p className={styles.p2}>{description}</p>}
      {action && <div className={styles.div3}>{action}</div>}
    </div>
  );
}
