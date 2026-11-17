import type { HrSummary } from '@/services/business';
import { Card } from '@/ui/Card';
import { dueInfo } from '@/ui/format';
import { Icon } from '@/ui/Icon';
import styles from './Home.module.css';

/** Upcoming birthdays and work anniversaries. */
export function CelebrationsCard({ summary }: { summary: HrSummary }) {
  return (
    <Card title="Celebrations" link={{ to: '/keka', label: 'Keka HR' }}>
      <ul className={styles.tasks}>
        {summary.celebrations.slice(0, 4).map((c) => (
          <li key={`${c.kind}-${c.employeeId}`}>
            <span
              className={`${styles.taskIcon} ${c.kind === 'Birthday' ? styles.text4 : styles.text1}`}
            >
              <Icon
                name={c.kind === 'Birthday' ? 'gift' : 'calendar'}
                size={18}
              />
            </span>
            <span className={styles.taskTitle}>
              {c.name}
              <span className={styles.celebrationKind}>
                {c.kind === 'Birthday'
                  ? 'Birthday'
                  : `${c.years} year${c.years === 1 ? '' : 's'} at NPST`}{' '}
                · {c.department}
              </span>
            </span>
            <span className={styles.due}>{dueInfo(c.date).label}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
