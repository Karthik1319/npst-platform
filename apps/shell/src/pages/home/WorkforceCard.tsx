import type { HrSummary } from '@/services/business';
import { Card } from '@/ui/Card';
import { formatNumber } from '@/ui/format';
import { ProgressBar } from '@/ui/ProgressBar';
import styles from './Home.module.css';

/** Attendance today and the largest departments. */
export function WorkforceCard({
  summary,
  showApprovals,
}: {
  summary: HrSummary;
  /** Only managers see the organisation-wide approval queue. */
  showApprovals: boolean;
}) {
  const presentShare =
    (summary.presentToday / Math.max(1, summary.totalEmployees)) * 100;
  const largest = summary.departments.slice(0, 4);
  const max = Math.max(...largest.map((d) => d.count), 1);
  return (
    <Card
      title="Workforce today"
      link={{ to: '/peopleos', label: 'Open PeopleOS' }}
    >
      <div className={styles.workforceTotals}>
        <div>
          <span className={styles.bigNumber}>
            {formatNumber(summary.presentToday)}
          </span>
          <span className={styles.smallLabel}>Present</span>
        </div>
        <div>
          <span className={styles.bigNumber}>{summary.onLeaveToday}</span>
          <span className={styles.smallLabel}>On leave</span>
        </div>
        {showApprovals ? (
          <div>
            <span className={styles.bigNumber}>{summary.pendingApprovals}</span>
            <span className={styles.smallLabel}>Leave requests pending</span>
          </div>
        ) : (
          <div>
            <span className={styles.bigNumber}>{summary.joinedLast30Days}</span>
            <span className={styles.smallLabel}>Joined this month</span>
          </div>
        )}
      </div>
      <ProgressBar
        value={presentShare}
        variant="good"
        label={`${Math.round(presentShare)}% of employees present`}
      />
      <ul className={styles.departments}>
        {largest.map((department) => (
          <li key={department.name}>
            <span>{department.name}</span>
            <ProgressBar
              value={(department.count / max) * 100}
              label={`${department.name}: ${department.count}`}
            />
            <span className={styles.legendValue}>{department.count}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
