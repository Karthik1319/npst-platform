import type { Tone } from '@/ui/Badge';
import { Icon, type IconName } from '@/ui/Icon';
import styles from './Kpi.module.css';

interface KpiProps {
  label: string;
  value: string;
  icon: IconName;
  tone: Tone;
  note?: string;
}

/** One headline figure. */
export function Kpi({ label, value, icon, tone, note }: KpiProps) {
  return (
    <li className={styles.kpi}>
      <span className={`${styles.icon} ${styles[`tone${tone}`]}`}>
        <Icon name={icon} size={20} />
      </span>
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
      {note && <span className={styles.note}>{note}</span>}
    </li>
  );
}

export const kpiListClass = styles.list;
