import type { LucideIcon } from '@/components/icons';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import styles from './StatCard.module.css';

type StatTone = 'blue' | 'sky' | 'green' | 'amber' | 'red' | 'slate';

const TONE_CLASSES: Record<StatTone, string> = {
  blue: styles.blue,
  sky: styles.sky,
  green: styles.green,
  amber: styles.amber,
  red: styles.red,
  slate: styles.slate,
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: StatTone;
  foot?: ReactNode;
  testId?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'blue',
  foot,
  testId,
}: StatCardProps) {
  return (
    <div className={styles.div} data-testid={testId}>
      <div className={styles.div2}>
        <p className={styles.p}>{label}</p>
        <div className={cn(`${styles.div3} npst-sized`, TONE_CLASSES[tone])}>
          <Icon className={`${styles.icon} npst-sized`} />
        </div>
      </div>
      <p className={styles.p2}>{value}</p>
      {foot && <div className={styles.div4}>{foot}</div>}
    </div>
  );
}
