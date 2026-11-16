import { useCallback } from 'react';
import { Link } from 'react-router';
import { usePlatform } from '@/platform/PlatformContext';
import { useLiveData } from '@/platform/useLiveData';
import { businessData } from '@/services/business';
import { appVisual } from '@/ui/app-visuals';
import { Badge, type BadgeVariant } from '@/ui/Badge';
import { dueInfo } from '@/ui/format';
import styles from './Page.module.css';

const PRIORITY: Record<string, BadgeVariant> = {
  High: 'error',
  Medium: 'warning',
  Low: 'neutral',
};
const STATUS: Record<string, BadgeVariant> = {
  'To do': 'neutral',
  'In progress': 'info',
  'In review': 'accent',
  Done: 'success',
};

/** Open tasks in the queues of the user's teams, across applications. */
export function MyTasksPage() {
  const platform = usePlatform();
  const tasks = useLiveData(
    useCallback(() => businessData.myTasks(platform.user), [platform]),
  );
  const teams = platform.user.roles.join(', ');

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My tasks</h1>
          <p className={styles.intro}>
            Open work for your team ({teams}) in every application. Open a task
            to work on it in its application.
          </p>
        </div>
      </div>
      <div className={styles.panel}>
        {tasks.status === 'loading' && <p role="status">Loading tasks…</p>}
        {tasks.status === 'error' && (
          <p role="alert">Could not load your tasks.</p>
        )}
        {tasks.status === 'ready' && tasks.data.length === 0 && (
          <p className={styles.empty}>Nothing assigned to your team.</p>
        )}
        {tasks.status === 'ready' && tasks.data.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Task</th>
                  <th scope="col">Application</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Status</th>
                  <th scope="col">Due</th>
                </tr>
              </thead>
              <tbody>
                {tasks.data.map((task) => {
                  const visual = appVisual(task.appId);
                  const due = dueInfo(task.due);
                  return (
                    <tr key={task.id}>
                      <td>
                        <Link
                          to={businessData.taskLink(task)}
                          className={styles.rowLink}
                        >
                          {task.title}
                        </Link>
                        <span className={styles.subtext}>
                          {task.id} · created by {task.createdBy}
                        </span>
                      </td>
                      <td>
                        <Badge tone={visual.tone}>{visual.short}</Badge>
                      </td>
                      <td>
                        <Badge variant={PRIORITY[task.priority] ?? 'neutral'}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={STATUS[task.status] ?? 'neutral'}>
                          {task.status}
                        </Badge>
                      </td>
                      <td
                        className={
                          due.state === 'overdue' || due.state === 'today'
                            ? styles.urgent
                            : styles.muted
                        }
                      >
                        {due.label}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
