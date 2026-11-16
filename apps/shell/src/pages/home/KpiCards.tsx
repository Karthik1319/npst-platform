import { Link } from 'react-router';
import type { Tone } from '@/ui/app-visuals';
import { Icon, type IconName } from '@/ui/Icon';
import styles from './Home.module.css';

export interface Kpi {
  id: string;
  label: string;
  value: string;
  icon: IconName;
  tone: Tone;
  link: string;
  /** Short comparison, e.g. "12% vs last quarter". */
  trend?: { direction: 'up' | 'down' | 'flat'; text: string; good: boolean };
}

/** Headline numbers (only for apps the user may open). */
export function KpiCards({ kpis }: { kpis: readonly Kpi[] }) {
  return (
    <ul className={styles.kpis} aria-label="Key figures">
      {kpis.map((kpi) => (
        <li key={kpi.id}>
          <Link to={kpi.link} className={styles.kpi}>
            <span className={styles.kpiTop}>
              <span
                className={`${styles.kpiIcon} ${styles[`tone${kpi.tone}`]}`}
              >
                <Icon name={kpi.icon} size={20} />
              </span>
              <span className={styles.kpiValue}>{kpi.value}</span>
            </span>
            <span className={styles.kpiLabel}>{kpi.label}</span>
            {kpi.trend && (
              <span
                className={`${styles.kpiTrend} ${
                  kpi.trend.direction === 'flat'
                    ? styles.flat
                    : kpi.trend.good
                      ? styles.good
                      : styles.bad
                }`}
              >
                <Icon
                  name={
                    kpi.trend.direction === 'up'
                      ? 'trendUp'
                      : kpi.trend.direction === 'down'
                        ? 'trendDown'
                        : 'minus'
                  }
                  size={14}
                />
                {kpi.trend.text}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
