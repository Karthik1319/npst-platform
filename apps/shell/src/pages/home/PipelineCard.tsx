import type { SalesSummary } from '@/services/business';
import { Card } from '@/ui/Card';
import { formatInr, formatNumber } from '@/ui/format';
import styles from './Home.module.css';

const ROW = 30;
const WIDTH = 220;

/** Sales funnel: how many records reached each stage, lead to won. */
export function PipelineCard({ summary }: { summary: SalesSummary }) {
  const steps = summary.funnel;
  const max = Math.max(...steps.map((s) => s.count), 1);
  const widthOf = (count: number) => 40 + (WIDTH - 40) * Math.sqrt(count / max);
  const won = steps[steps.length - 1]?.count ?? 0;
  const conversion = ((won / max) * 100).toFixed(1);

  return (
    <Card
      title="Sales pipeline"
      link={{ to: '/sales', label: 'Open Sales Hub' }}
    >
      <div className={styles.chartRow}>
        <svg
          className={styles.funnel}
          viewBox={`0 0 ${WIDTH} ${steps.length * ROW}`}
          role="img"
          aria-label={`Sales funnel: ${steps.map((s) => `${s.stage} ${s.count}`).join(', ')}`}
        >
          {steps.map((step, index) => {
            const top = widthOf(step.count);
            const next = steps[index + 1];
            const bottom = next ? widthOf(next.count) : top * 0.85;
            const y = index * ROW;
            const c = WIDTH / 2;
            return (
              <polygon
                key={step.stage}
                className={styles[`funnel${index + 1}`]}
                points={`${c - top / 2},${y} ${c + top / 2},${y} ${c + bottom / 2},${y + ROW - 3} ${c - bottom / 2},${y + ROW - 3}`}
              />
            );
          })}
        </svg>
        <ul className={styles.legend}>
          {steps.map((step, index) => (
            <li key={step.stage}>
              <span
                className={`${styles.legendDot} ${styles[`funnel${index + 1}`]}`}
              />
              <span className={styles.legendLabel}>{step.stage}</span>
              <span className={styles.legendValue}>
                {formatNumber(step.count)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className={styles.chartFoot}>
        Open pipeline <strong>{formatInr(summary.pipelineValue)}</strong> ·
        Lead-to-won conversion <strong>{conversion}%</strong>
      </p>
    </Card>
  );
}
