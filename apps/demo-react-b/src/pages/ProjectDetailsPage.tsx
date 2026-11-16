import { useCallback, useState } from 'react';
import { Link } from '@/routing/router';
import { projectsService, type Project } from '@/services/projects';
import { useLoad } from '@/services/useLoad';
import { Person } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import controls from '@/ui/controls.module.css';
import { formatDate, formatInr, timeAgo } from '@/ui/format';
import { Icon } from '@/ui/Icon';
import { Panel } from '@/ui/Panel';
import { ProgressBar } from '@/ui/ProgressBar';
import {
  MILESTONE_STATUS,
  PRIORITY,
  PROJECT_STATUS,
  SEVERITY,
  TASK_STATUS,
  healthBar,
} from '@/ui/status';
import { assigneeName } from '@/ui/tasks';
import styles from './pages.module.css';

const TASK_STATES = ['To do', 'In progress', 'In review', 'Done'] as const;

/** One project: overview, customer, team, milestones, tasks, timeline, risks and updates. */
export function ProjectDetailsPage({ id }: { id: string }) {
  const [found] = useLoad(useCallback(() => projectsService.project(id), [id]));
  const [tasks] = useLoad(
    useCallback(() => projectsService.tasksFor(id), [id]),
  );

  if (found.status === 'loading') return <p role="status">Loading project…</p>;
  if (found.status === 'error')
    return <p role="alert">Could not load this project.</p>;
  if (found.data === null) {
    return (
      <div className={styles.notFound}>
        <h2>Project {id} was not found</h2>
        <Link to="/list" className={styles.back}>
          <Icon name="arrowLeft" size={16} /> Back to projects
        </Link>
      </div>
    );
  }

  const { project, customer } = found.data;
  const taskList = tasks.status === 'ready' ? tasks.data : [];
  const doneCount = taskList.filter((t) => t.status === 'Done').length;

  return (
    <>
      <Link to="/list" className={styles.back}>
        <Icon name="arrowLeft" size={16} /> Projects
      </Link>

      <div className={styles.hero}>
        <div>
          <div className={styles.heroMeta}>
            <span>{project.id}</span>
            <Badge variant={PROJECT_STATUS[project.status] ?? 'neutral'}>
              {project.status}
            </Badge>
            <Badge variant="neutral">{project.phase}</Badge>
          </div>
          <h2 className={styles.heroTitle}>{project.name}</h2>
          <div className={styles.heroMeta}>
            <Icon name="building" size={16} /> {project.customerName}
          </div>
        </div>
        <dl className={styles.heroFacts}>
          <div>
            <dt>Progress</dt>
            <dd>{project.progress}%</dd>
          </div>
          <div>
            <dt>Start</dt>
            <dd>{formatDate(project.startDate)}</dd>
          </div>
          <div>
            <dt>Target</dt>
            <dd>{formatDate(project.targetDate)}</dd>
          </div>
          <div>
            <dt>Project manager</dt>
            <dd>{project.manager}</dd>
          </div>
        </dl>
      </div>

      <Panel title="Timeline">
        <Timeline project={project} />
      </Panel>

      <div className={styles.detailGrid}>
        <div className={styles.column}>
          <Panel title="Project overview">
            <p className={styles.summary}>{project.description}</p>
            <dl className={styles.facts}>
              <dt>Contract value</dt>
              <dd>{formatInr(project.contractValue)}</dd>
              <dt>Phase</dt>
              <dd>{project.phase}</dd>
              {project.opportunityId && (
                <>
                  <dt>Won in Sales Hub</dt>
                  <dd>{project.opportunityId}</dd>
                </>
              )}
            </dl>
            <div className={styles.spaced}>
              <ProgressBar
                value={project.progress}
                variant={healthBar(project.status)}
                label={`${project.progress}% complete`}
              />
            </div>
          </Panel>

          <Panel title="Milestones">
            <ul className={styles.list}>
              {project.milestones.map((m) => (
                <li key={m.id}>
                  <Badge variant={MILESTONE_STATUS[m.status] ?? 'neutral'}>
                    {m.status}
                  </Badge>
                  <span className={styles.listTitle}>{m.name}</span>
                  <span className={controls.muted}>{formatDate(m.due)}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="Task progress"
            link={{ to: `/tasks?project=${project.id}`, label: 'Open board' }}
          >
            <div className={styles.taskStats}>
              {TASK_STATES.map((state) => (
                <div key={state}>
                  <strong>
                    {taskList.filter((t) => t.status === state).length}
                  </strong>
                  <span>{state}</span>
                </div>
              ))}
            </div>
            <ProgressBar
              value={taskList.length ? (doneCount / taskList.length) * 100 : 0}
              variant="good"
              label={`${doneCount} of ${taskList.length} tasks done`}
            />
            <ul className={styles.list}>
              {taskList.map((task) => (
                <li key={task.id}>
                  <Badge variant={TASK_STATUS[task.status] ?? 'neutral'}>
                    {task.status}
                  </Badge>
                  <span className={styles.listTitle}>
                    {task.title}
                    <span className={controls.subText}>
                      {assigneeName(task)} ·{' '}
                      <Badge variant={PRIORITY[task.priority] ?? 'neutral'}>
                        {task.priority}
                      </Badge>
                    </span>
                  </span>
                  <span className={controls.muted}>{formatDate(task.due)}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Recent updates">
            <ul className={styles.timeline}>
              {project.updates.map((update) => (
                <li key={update.id}>
                  <span className={styles.timelineText}>{update.text}</span>
                  <span className={styles.timelineMeta}>
                    {update.author} · {timeAgo(update.at)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className={styles.column}>
          <Panel title="Customer">
            <dl className={styles.facts}>
              <dt>Name</dt>
              <dd>{customer.name}</dd>
              <dt>Type</dt>
              <dd>{customer.industry}</dd>
              <dt>Location</dt>
              <dd>{customer.city}</dd>
              <dt>Customer since</dt>
              <dd>{customer.customerSince ?? '—'}</dd>
              <dt>Contact</dt>
              <dd>
                {customer.contactName}
                <span className={controls.subText}>
                  {customer.contactTitle}
                </span>
              </dd>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${customer.email}`}>{customer.email}</a>
              </dd>
            </dl>
          </Panel>

          <Panel title="Assigned team">
            <ul className={styles.list}>
              {project.team.map((member) => (
                <li key={member.name}>
                  <Person name={member.name} detail={member.role} />
                  <span />
                  <span className={controls.muted}>{member.allocation}%</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Risks and blockers">
            {project.risks.length === 0 && (
              <p className={controls.empty}>No open risks.</p>
            )}
            <ul className={styles.list}>
              {project.risks.map((risk) => (
                <li key={risk.id}>
                  <Badge variant={SEVERITY[risk.severity] ?? 'neutral'}>
                    {risk.severity}
                  </Badge>
                  <span className={styles.listTitle}>
                    {risk.title}
                    <span className={controls.subText}>
                      {risk.owner} · {risk.status}
                    </span>
                  </span>
                  <span />
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}

/** Start-to-target bar with milestones and today (SVG; no chart library). */
function Timeline({ project }: { project: Project }) {
  const start = new Date(`${project.startDate}T00:00:00`).getTime();
  const end = new Date(`${project.targetDate}T00:00:00`).getTime();
  // Read once when shown, so rendering stays repeatable.
  const [today] = useState(() => Date.now());
  const last = Math.max(
    end,
    today,
    ...project.milestones.map((m) => new Date(`${m.due}T00:00:00`).getTime()),
  );
  const x = (time: number) =>
    20 + ((time - start) / Math.max(1, last - start)) * 960;
  const done = x(start + ((end - start) * project.progress) / 100);
  const todayX = x(today);
  return (
    <svg
      className={styles.gantt}
      viewBox="0 0 1000 64"
      role="img"
      aria-label={`Timeline from ${formatDate(project.startDate)} to ${formatDate(project.targetDate)}, ${project.progress}% complete`}
    >
      <rect
        className={styles.ganttTrack}
        x="20"
        y="24"
        width={x(end) - 20}
        height="10"
        rx="5"
      />
      <rect
        className={styles.ganttDone}
        x="20"
        y="24"
        width={Math.max(0, done - 20)}
        height="10"
        rx="5"
      />
      {project.milestones.map((m) => {
        const cx = x(new Date(`${m.due}T00:00:00`).getTime());
        const className =
          m.status === 'Done'
            ? styles.ganttMilestoneDone
            : m.status === 'Overdue'
              ? styles.ganttMilestoneLate
              : styles.ganttMilestone;
        return (
          <rect
            key={m.id}
            className={className}
            x={cx - 6}
            y="23"
            width="12"
            height="12"
            transform={`rotate(45 ${cx} 29)`}
          >
            <title>{`${m.name}: ${formatDate(m.due)} (${m.status})`}</title>
          </rect>
        );
      })}
      <line
        className={styles.ganttToday}
        x1={todayX}
        x2={todayX}
        y1="12"
        y2="44"
      />
      <text className={styles.ganttLabel} x="20" y="58">
        Start {formatDate(project.startDate)}
      </text>
      <text className={styles.ganttLabel} x={todayX} y="9" textAnchor="middle">
        Today
      </text>
      <text className={styles.ganttLabel} x={x(end)} y="58" textAnchor="end">
        Target {formatDate(project.targetDate)}
      </text>
    </svg>
  );
}
