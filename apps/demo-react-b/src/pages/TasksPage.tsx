import { useCallback, useEffect, useRef, useState } from 'react';
import { usePortal } from '@/portal';
import { Link, useRouter } from '@/routing/router';
import {
  projectsService,
  type Task,
  type TaskStatus,
} from '@/services/projects';
import { useLoad } from '@/services/useLoad';
import { Badge } from '@/ui/Badge';
import controls from '@/ui/controls.module.css';
import { dueInfo } from '@/ui/format';
import { Icon } from '@/ui/Icon';
import { Panel } from '@/ui/Panel';
import { PRIORITY } from '@/ui/status';
import { APP_NAMES, assigneeName, canWorkOn } from '@/ui/tasks';
import styles from './pages.module.css';

const COLUMNS: TaskStatus[] = ['To do', 'In progress', 'In review', 'Done'];
const TEAM_QUEUE = 'Solutions team';
const CARDS_PER_COLUMN = 6;

/** Task board for delivery work: who does what, by when, and how far it is. */
export function TasksPage() {
  const { user, platform } = usePortal();
  const { search } = useRouter();
  const canUpdate = platform.permissions.can('update', 'project-task');
  const highlight = search.get('task');
  const [project, setProject] = useState(search.get('project') ?? '');
  const [assignee, setAssignee] = useState('');
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState<readonly TaskStatus[]>([]);
  const [tasks, reload] = useLoad(projectsService.tasks);
  const [projects] = useLoad(useCallback(() => projectsService.projects(), []));
  const highlighted = useRef<HTMLLIElement>(null);

  // Opened from a notification or My Tasks: bring that task into view.
  useEffect(() => {
    if (tasks.status === 'ready')
      highlighted.current?.scrollIntoView?.({
        block: 'center',
        behavior: 'smooth',
      });
  }, [tasks.status, highlight]);

  const projectName = (id?: string) =>
    (projects.status === 'ready' &&
      projects.data.find((p) => p.id === id)?.name) ||
    id ||
    '';
  const all = tasks.status === 'ready' ? tasks.data : [];
  const people = [...new Set(all.map(assigneeName))]
    .filter((name) => name !== TEAM_QUEUE)
    .sort();
  const visible = all.filter(
    (t) =>
      (!project || t.projectId === project) &&
      (!assignee || assigneeName(t) === assignee) &&
      (!text || t.title.toLowerCase().includes(text.toLowerCase())),
  );

  async function move(task: Task, status: TaskStatus) {
    await projectsService.setTaskStatus(task.id, status, user);
    platform.notify.toast(
      status === 'Done'
        ? `Task completed: ${task.title}`
        : `“${task.title}” moved to ${status}`,
      {
        kind: status === 'Done' ? 'success' : 'info',
      },
    );
    reload();
  }

  return (
    <Panel title="Task board">
      <div className={controls.toolbar} role="search">
        <label className={controls.searchBox}>
          <Icon name="search" size={16} />
          <input
            className={controls.input}
            type="search"
            placeholder="Search tasks"
            aria-label="Search tasks"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <select
          className={controls.select}
          aria-label="Project"
          value={project}
          onChange={(e) => setProject(e.target.value)}
        >
          <option value="">All projects</option>
          {projects.status === 'ready' &&
            projects.data
              .filter((p) => p.status !== 'Completed')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} · {p.name}
                </option>
              ))}
        </select>
        <select
          className={controls.select}
          aria-label="Assigned to"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
        >
          <option value="">Everyone</option>
          <option>{TEAM_QUEUE}</option>
          {people.map((person) => (
            <option key={person}>{person}</option>
          ))}
        </select>
      </div>

      {tasks.status === 'loading' && <p role="status">Loading tasks…</p>}
      {tasks.status === 'error' && <p role="alert">Could not load tasks.</p>}
      {tasks.status === 'ready' && (
        <div className={styles.board}>
          {COLUMNS.map((column) => {
            // Team-queue work first (it waits for someone to pick it up), then by date.
            const queueFirst = (t: Task) =>
              t.assignee.kind === 'team' ? 0 : 1;
            const cards = visible
              .filter((t) => t.status === column)
              .sort((a, b) =>
                column === 'Done'
                  ? (b.completedAt ?? b.due).localeCompare(
                      a.completedAt ?? a.due,
                    )
                  : queueFirst(a) - queueFirst(b) || a.due.localeCompare(b.due),
              );
            const showAll =
              expanded.includes(column) ||
              cards.some((t) => t.id === highlight);
            const shown = showAll ? cards : cards.slice(0, CARDS_PER_COLUMN);
            return (
              <section
                key={column}
                className={styles.boardColumn}
                aria-label={column}
              >
                <h3 className={styles.boardHead}>
                  {column} <Badge variant="neutral">{cards.length}</Badge>
                </h3>
                <ul className={styles.boardCards}>
                  {shown.map((task) => {
                    const due = dueInfo(task.due);
                    const late =
                      task.status !== 'Done' &&
                      (due.state === 'overdue' || due.state === 'today');
                    return (
                      <li
                        key={task.id}
                        ref={task.id === highlight ? highlighted : undefined}
                        className={`${styles.card} ${task.id === highlight ? styles.cardHighlight : ''}`}
                        aria-label={task.title}
                        aria-current={
                          task.id === highlight ? 'true' : undefined
                        }
                      >
                        {task.sourceAppId &&
                          task.sourceAppId !== 'projects' && (
                            <span className={styles.fromTeam}>
                              <Icon name="link" size={12} /> From{' '}
                              {APP_NAMES[task.sourceAppId] ?? task.sourceAppId}
                              {task.opportunityId
                                ? ` · ${task.opportunityId}`
                                : ''}
                            </span>
                          )}
                        <p className={styles.cardTitle}>{task.title}</p>
                        {task.description && (
                          <span className={controls.subText}>
                            {task.description}
                          </span>
                        )}
                        <span className={styles.cardMeta}>
                          {task.projectId && (
                            <Link to={`/${task.projectId}`}>
                              {task.projectId} · {projectName(task.projectId)}
                            </Link>
                          )}
                        </span>
                        <span className={styles.cardMeta}>
                          <Badge variant={PRIORITY[task.priority] ?? 'neutral'}>
                            {task.priority}
                          </Badge>
                          <span>{assigneeName(task)}</span>
                          <span className={late ? controls.urgent : undefined}>
                            {task.status === 'Done'
                              ? `Done${task.completedBy ? ` by ${task.completedBy}` : ''}`
                              : due.label}
                          </span>
                        </span>
                        {canUpdate && canWorkOn(task, user) && (
                          <span className={styles.cardFoot}>
                            <span className={controls.muted}>{task.id}</span>
                            <select
                              className={`${controls.select} ${styles.moveSelect}`}
                              aria-label={`Move “${task.title}”`}
                              value={task.status}
                              onChange={(e) =>
                                void move(task, e.target.value as TaskStatus)
                              }
                            >
                              {COLUMNS.map((status) => (
                                <option key={status} value={status}>
                                  {status === task.status
                                    ? status
                                    : `Move to ${status}`}
                                </option>
                              ))}
                            </select>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {cards.length > shown.length && (
                  <button
                    type="button"
                    className={controls.ghost}
                    onClick={() => setExpanded((list) => [...list, column])}
                  >
                    Show all {cards.length}
                  </button>
                )}
              </section>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
