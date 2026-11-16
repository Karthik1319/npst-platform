import { useCallback } from 'react';
import { Link } from '@/routing/router';
import { projectsService } from '@/services/projects';
import { useLoad } from '@/services/useLoad';
import { Person } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import controls from '@/ui/controls.module.css';
import { dueInfo, formatDate } from '@/ui/format';
import { Kpi, kpiListClass } from '@/ui/Kpi';
import { Panel } from '@/ui/Panel';
import { ProgressBar } from '@/ui/ProgressBar';
import { MILESTONE_STATUS, PROJECT_STATUS, healthBar } from '@/ui/status';
import styles from './pages.module.css';

const PHASES = [
  'Initiation',
  'Design',
  'Build',
  'Testing',
  'UAT',
  'Go-live',
] as const;

/** Delivery overview: health, milestones, attention list and resource load. */
export function DashboardPage() {
  const [summary] = useLoad(projectsService.summary);
  const [projects] = useLoad(useCallback(() => projectsService.projects(), []));
  const s = summary.status === 'ready' ? summary.data : null;
  const active =
    projects.status === 'ready'
      ? projects.data.filter((p) => p.status !== 'Completed')
      : [];
  const attention = active
    .filter((p) => p.status === 'At risk' || p.status === 'Delayed')
    .sort((a, b) =>
      a.status === b.status
        ? a.targetDate.localeCompare(b.targetDate)
        : a.status === 'Delayed'
          ? -1
          : 1,
    );
  const people = s
    ? s.resources.filter(
        (r) => r.role !== 'Project manager' && r.role !== 'Solutions architect',
      )
    : [];
  const utilisation = people.length
    ? Math.round(
        people.reduce((sum, r) => sum + Math.min(100, r.allocation), 0) /
          people.length,
      )
    : 0;
  const overAllocated = s ? s.resources.filter((r) => r.allocation > 100) : [];
  const byPhase = PHASES.map((phase) => ({
    phase,
    count: active.filter((p) => p.phase === phase).length,
  }));
  const maxPhase = Math.max(1, ...byPhase.map((p) => p.count));

  return (
    <>
      {summary.status === 'error' && (
        <p role="alert">Could not load the delivery figures.</p>
      )}
      {s && (
        <ul className={kpiListClass} aria-label="Delivery figures">
          <Kpi
            label="Active projects"
            value={String(s.active)}
            icon="folder"
            tone={2}
            note={`${s.completed} completed this year`}
          />
          <Kpi
            label="On track"
            value={String(s.onTrack)}
            icon="checkCircle"
            tone={2}
            note={`${Math.round((s.onTrack / Math.max(1, s.active)) * 100)}% of active projects`}
          />
          <Kpi
            label="At risk"
            value={String(s.atRisk)}
            icon="alert"
            tone={4}
            note="Need a recovery plan"
          />
          <Kpi
            label="Delayed"
            value={String(s.delayed)}
            icon="clock"
            tone={4}
            note="Past a planned date"
          />
          <Kpi
            label="Upcoming milestones"
            value={String(s.upcomingMilestones.length)}
            icon="flag"
            tone={1}
            note={`${s.overdueMilestones} overdue`}
          />
          <Kpi
            label="Team utilisation"
            value={`${utilisation}%`}
            icon="gauge"
            tone={3}
            note={`${people.length} engineers on projects`}
          />
        </ul>
      )}

      <Panel
        title="Projects needing attention"
        link={{ to: '/list', label: 'All projects' }}
      >
        {projects.status === 'ready' && attention.length === 0 && (
          <p className={controls.empty}>All projects are on track.</p>
        )}
        {attention.length > 0 && (
          <div className={controls.tableWrap}>
            <table className={controls.table}>
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">Project manager</th>
                  <th scope="col">Status</th>
                  <th scope="col">Progress</th>
                  <th scope="col">Target</th>
                  <th scope="col">Top risk</th>
                </tr>
              </thead>
              <tbody>
                {attention.map((project) => {
                  const risk = project.risks.find((r) => r.status !== 'Closed');
                  return (
                    <tr key={project.id}>
                      <td>
                        <Link
                          to={`/${project.id}`}
                          className={controls.primaryText}
                        >
                          {project.name}
                        </Link>
                        <span className={controls.subText}>
                          {project.id} · {project.customerName}
                        </span>
                      </td>
                      <td>
                        <Person name={project.manager} />
                      </td>
                      <td>
                        <Badge
                          variant={PROJECT_STATUS[project.status] ?? 'neutral'}
                        >
                          {project.status}
                        </Badge>
                      </td>
                      <td className={styles.progressCell}>
                        <span className={controls.muted}>
                          {project.progress}%
                        </span>
                        <ProgressBar
                          value={project.progress}
                          variant={healthBar(project.status)}
                          label={`${project.progress}% complete`}
                        />
                      </td>
                      <td className={controls.muted}>
                        {formatDate(project.targetDate)}
                      </td>
                      <td>
                        {risk ? (
                          risk.title
                        ) : (
                          <span className={controls.muted}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className={styles.grid2}>
        <Panel title="Upcoming milestones">
          <ul className={styles.list}>
            {s?.upcomingMilestones.map((m) => {
              const due = dueInfo(m.due);
              return (
                <li key={m.id}>
                  <Badge variant={MILESTONE_STATUS[m.status] ?? 'neutral'}>
                    {m.status}
                  </Badge>
                  <span className={styles.listTitle}>
                    <span className={controls.primaryText}>{m.name}</span>
                    <span className={controls.subText}>
                      <Link to={`/${m.projectId}`}>{m.projectId}</Link> ·{' '}
                      {m.projectName} · {m.customerName}
                    </span>
                  </span>
                  <span
                    className={`${styles.due} ${due.state === 'today' ? styles.dueUrgent : ''}`}
                  >
                    {due.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Projects by phase">
          <ul className={styles.stageRows}>
            {byPhase.map((row) => (
              <li key={row.phase} className={styles.stageRow}>
                <span>{row.phase}</span>
                <ProgressBar
                  value={(row.count / maxPhase) * 100}
                  label={`${row.phase}: ${row.count} projects`}
                />
                <span className={styles.stageValue}>{row.count}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Resource allocation">
        {overAllocated.length > 0 && (
          <p className={styles.callout}>
            <strong>{overAllocated.length}</strong>{' '}
            {overAllocated.length === 1 ? 'person is' : 'people are'} allocated
            above 100%:{' '}
            {overAllocated
              .map((r) => `${r.name} (${r.allocation}%)`)
              .join(', ')}
            .
          </p>
        )}
        <div className={controls.tableWrap}>
          <table className={controls.table}>
            <thead>
              <tr>
                <th scope="col">Person</th>
                <th scope="col">Projects</th>
                <th scope="col">Allocation</th>
              </tr>
            </thead>
            <tbody>
              {s?.resources.slice(0, 10).map((r) => (
                <tr key={r.name}>
                  <td>
                    <Person name={r.name} detail={r.role} />
                  </td>
                  <td>{r.projects}</td>
                  <td className={styles.progressCell}>
                    <span
                      className={
                        r.allocation > 100 ? controls.urgent : controls.muted
                      }
                    >
                      {r.allocation}%
                    </span>
                    <ProgressBar
                      value={r.allocation}
                      variant={
                        r.allocation > 100
                          ? 'bad'
                          : r.allocation >= 90
                            ? 'watch'
                            : 'good'
                      }
                      label={`${r.name}: ${r.allocation}% allocated`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
