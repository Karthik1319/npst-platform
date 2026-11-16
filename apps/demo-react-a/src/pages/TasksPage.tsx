import { useState } from 'react';
import { usePortal } from '@/portal';
import { Link } from '@/routing/router';
import { salesService, type Task } from '@/services/sales';
import { useLoad } from '@/services/useLoad';
import { Badge } from '@/ui/Badge';
import controls from '@/ui/controls.module.css';
import { dueInfo, formatDate } from '@/ui/format';
import { Icon } from '@/ui/Icon';
import { Panel } from '@/ui/Panel';
import { PRIORITY } from '@/ui/status';
import { ACTIVITY_ICON, assigneeName, canWorkOn } from '@/ui/tasks';
import styles from './pages.module.css';

type Group = 'Overdue' | 'Due today' | 'Next 7 days' | 'Later';

function groupOf(task: Task): Group {
  const due = dueInfo(task.due);
  if (due.state === 'overdue') return 'Overdue';
  if (due.state === 'today') return 'Due today';
  const week = new Date();
  week.setDate(week.getDate() + 7);
  return new Date(`${task.due}T00:00:00`) <= week ? 'Next 7 days' : 'Later';
}

/** Follow-ups and team tasks: what is overdue, due today and coming up. */
export function TasksPage() {
  const { user, platform } = usePortal();
  const canEdit = platform.permissions.can('edit', 'opportunity');
  const [tasks, reload] = useLoad(salesService.tasks);
  const [assignee, setAssignee] = useState('');
  const [showDone, setShowDone] = useState(false);

  if (tasks.status === 'loading') return <p role="status">Loading tasks…</p>;
  if (tasks.status === 'error')
    return <p role="alert">Could not load tasks.</p>;

  const people = [...new Set(tasks.data.map(assigneeName))].sort();
  const open = tasks.data.filter((t) => t.status !== 'Done');
  const visible = (
    showDone ? tasks.data.filter((t) => t.status === 'Done') : open
  )
    .filter((t) => !assignee || assigneeName(t) === assignee)
    .sort((a, b) => a.due.localeCompare(b.due));
  const groups: Group[] = ['Overdue', 'Due today', 'Next 7 days', 'Later'];
  const count = (group: Group) =>
    open.filter((t) => groupOf(t) === group).length;

  async function complete(task: Task) {
    await salesService.setTaskStatus(task.id, 'Done', user);
    platform.notify.toast(`Follow-up done: ${task.title}`, { kind: 'success' });
    reload();
  }

  const table = (rows: Task[]) => (
    <div className={controls.tableWrap}>
      <table className={controls.table}>
        <thead>
          <tr>
            <th scope="col">Task</th>
            <th scope="col">Assigned to</th>
            <th scope="col">Priority</th>
            <th scope="col">Due</th>
            <th scope="col">
              <span className={controls.muted}>Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((task) => {
            const due = dueInfo(task.due);
            return (
              <tr key={task.id}>
                <td>
                  <span className={styles.activityIcon}>
                    <Icon
                      name={ACTIVITY_ICON[task.activity ?? ''] ?? 'tasks'}
                      size={14}
                    />
                  </span>
                  <span className={controls.primaryText}>{task.title}</span>
                  {task.opportunityId && (
                    <span className={controls.subText}>
                      <Link to={`/opportunities/${task.opportunityId}`}>
                        {task.opportunityId}
                      </Link>{' '}
                      · {task.activity ?? 'Task'}
                    </span>
                  )}
                </td>
                <td>{assigneeName(task)}</td>
                <td>
                  <Badge variant={PRIORITY[task.priority] ?? 'neutral'}>
                    {task.priority}
                  </Badge>
                </td>
                <td
                  className={
                    due.state === 'overdue' || due.state === 'today'
                      ? controls.urgent
                      : controls.muted
                  }
                >
                  {task.status === 'Done'
                    ? `Done ${task.completedAt ? formatDate(task.completedAt.slice(0, 10)) : ''}`
                    : due.label}
                </td>
                <td>
                  {task.status !== 'Done' &&
                    canEdit &&
                    canWorkOn(task, user) && (
                      <button
                        type="button"
                        className={controls.secondary}
                        onClick={() => void complete(task)}
                      >
                        <Icon name="check" size={16} /> Mark done
                      </button>
                    )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className={styles.summaryChips} aria-label="Task summary">
        <span className={`${styles.chip} ${styles.chipUrgent}`}>
          <strong>{count('Overdue')}</strong> overdue
        </span>
        <span className={`${styles.chip} ${styles.chipUrgent}`}>
          <strong>{count('Due today')}</strong> due today
        </span>
        <span className={styles.chip}>
          <strong>{count('Next 7 days')}</strong> in the next 7 days
        </span>
        <span className={styles.chip}>
          <strong>{tasks.data.length - open.length}</strong> completed
        </span>
      </div>

      <Panel title={showDone ? 'Completed tasks' : 'Open tasks and follow-ups'}>
        <div className={controls.toolbar}>
          <select
            className={controls.select}
            aria-label="Assigned to"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          >
            <option value="">Everyone</option>
            {people.map((person) => (
              <option key={person}>{person}</option>
            ))}
          </select>
          <label className={controls.muted}>
            <input
              type="checkbox"
              checked={showDone}
              onChange={(e) => setShowDone(e.target.checked)}
            />{' '}
            Show completed
          </label>
        </div>
        {visible.length === 0 && (
          <p className={controls.empty}>Nothing here.</p>
        )}
        {showDone
          ? visible.length > 0 && table(visible)
          : groups.map((group) => {
              const rows = visible.filter((t) => groupOf(t) === group);
              return (
                rows.length > 0 && (
                  <section
                    key={group}
                    aria-label={group}
                    className={styles.group}
                  >
                    <h3 className={styles.groupTitle}>
                      {group} ({rows.length})
                    </h3>
                    {table(rows)}
                  </section>
                )
              );
            })}
      </Panel>
    </>
  );
}
