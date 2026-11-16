import { Link } from 'react-router';
import { businessData, type Task } from '@/services/business';
import { appVisual } from '@/ui/app-visuals';
import { Card } from '@/ui/Card';
import { dueInfo } from '@/ui/format';
import { Icon } from '@/ui/Icon';
import styles from './Home.module.css';

export interface ApprovalItem {
  title: string;
  link: string;
}

interface MyTasksCardProps {
  tasks: readonly Task[];
  /** Pending approvals for users who may approve (shown first). */
  approvals: readonly ApprovalItem[];
}

/** Open work in the user's team queues, across applications. */
export function MyTasksCard({ tasks, approvals }: MyTasksCardProps) {
  const shown = tasks.slice(0, Math.max(0, 5 - approvals.length));
  return (
    <Card title="My tasks" link={{ to: '/my-tasks', label: 'View all' }}>
      {approvals.length + tasks.length === 0 ? (
        <p className={styles.empty}>Nothing assigned to your team.</p>
      ) : (
        <ul className={styles.tasks}>
          {approvals.map((approval) => (
            <li key={approval.link}>
              <span className={`${styles.taskIcon} ${styles.text3}`}>
                <Icon name="approvals" size={18} />
              </span>
              <Link to={approval.link} className={styles.taskTitle}>
                {approval.title}
              </Link>
              <span className={`${styles.due} ${styles.dueToday}`}>Today</span>
            </li>
          ))}
          {shown.map((task) => {
            const due = dueInfo(task.due);
            const visual = appVisual(task.appId);
            return (
              <li key={task.id}>
                <span
                  className={`${styles.taskIcon} ${styles[`text${visual.tone}`]}`}
                  title={visual.short}
                >
                  <Icon
                    name={task.status === 'In progress' ? 'clock' : visual.icon}
                    size={18}
                  />
                </span>
                <Link
                  to={businessData.taskLink(task)}
                  className={styles.taskTitle}
                >
                  {task.title}
                </Link>
                <span
                  className={`${styles.due} ${
                    due.state === 'overdue' || due.state === 'today'
                      ? styles.dueToday
                      : ''
                  }`}
                >
                  {due.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
