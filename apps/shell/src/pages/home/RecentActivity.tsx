import { Link } from 'react-router';
import type { Activity } from '@/services/business';
import { appVisual } from '@/ui/app-visuals';
import { Badge } from '@/ui/Badge';
import { Card } from '@/ui/Card';
import { timeAgo } from '@/ui/format';
import { Icon } from '@/ui/Icon';
import styles from './Home.module.css';

/** What changed recently in the apps the user can open. */
export function RecentActivity({
  activity,
}: {
  activity: readonly Activity[];
}) {
  return (
    <Card title="Recent activity">
      {activity.length === 0 ? (
        <p className={styles.empty}>No recent activity.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Activity</th>
                <th scope="col">Application</th>
                <th scope="col">By</th>
                <th scope="col">Time</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((entry) => {
                const visual = appVisual(entry.appId);
                return (
                  <tr key={entry.id}>
                    <td>
                      <span className={styles.activityText}>
                        <span className={styles[`text${visual.tone}`]}>
                          <Icon name={visual.icon} size={18} />
                        </span>
                        {entry.link ? (
                          <Link to={entry.link}>{entry.text}</Link>
                        ) : (
                          entry.text
                        )}
                      </span>
                    </td>
                    <td>
                      <Badge tone={visual.tone}>{visual.short}</Badge>
                    </td>
                    <td className={styles.muted}>{entry.actor}</td>
                    <td className={styles.muted}>{timeAgo(entry.at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
