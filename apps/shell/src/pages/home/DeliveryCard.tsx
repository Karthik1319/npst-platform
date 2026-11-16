import type { ProjectsSummary } from '@/services/business';
import { Card } from '@/ui/Card';
import styles from './Home.module.css';

/** Project health: share of active projects on track, at risk and delayed. */
export function DeliveryCard({ summary }: { summary: ProjectsSummary }) {
  const total = summary.onTrack + summary.atRisk + summary.delayed;
  const parts = [
    { label: 'On track', count: summary.onTrack, className: styles.good },
    { label: 'At risk', count: summary.atRisk, className: styles.watch },
    { label: 'Delayed', count: summary.delayed, className: styles.bad },
  ];
  const percent = (count: number) =>
    total === 0 ? 0 : Math.round((count / total) * 100);
  let offset = 25; // start at 12 o'clock

  return (
    <Card
      title="Project delivery"
      link={{ to: '/projects', label: 'Open Projects' }}
    >
      <div className={styles.chartRow}>
        <svg
          className={styles.donut}
          viewBox="0 0 42 42"
          role="img"
          aria-label={`Project health: ${parts.map((p) => `${p.label} ${p.count}`).join(', ')}`}
        >
          <circle className={styles.donutTrack} cx="21" cy="21" r="15.915" />
          {parts.map((part) => {
            const share = total === 0 ? 0 : (part.count / total) * 100;
            const segment = (
              <circle
                key={part.label}
                className={`${styles.donutPart} ${part.className}`}
                cx="21"
                cy="21"
                r="15.915"
                strokeDasharray={`${share} ${100 - share}`}
                strokeDashoffset={offset}
              />
            );
            offset -= share;
            return segment;
          })}
          <text x="21" y="21" className={styles.donutValue}>
            {total}
          </text>
          <text x="21" y="27" className={styles.donutLabel}>
            Projects
          </text>
        </svg>
        <ul className={styles.legend}>
          {parts.map((part) => (
            <li key={part.label}>
              <span className={`${styles.legendDot} ${part.className}`} />
              <span className={styles.legendLabel}>{part.label}</span>
              <span className={styles.legendValue}>
                {part.count}{' '}
                <span className={styles.legendShare}>
                  ({percent(part.count)}%)
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className={styles.chartFoot}>
        <strong>{summary.overdueMilestones}</strong> overdue milestones ·{' '}
        <strong>{summary.upcomingMilestones.length}</strong> due in the coming
        weeks
      </p>
    </Card>
  );
}
