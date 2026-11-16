import { useCallback, useState } from 'react';
import { Link } from '@/routing/router';
import { projectsService, type ProjectQuery } from '@/services/projects';
import { useLoad } from '@/services/useLoad';
import { Person } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import controls from '@/ui/controls.module.css';
import { formatDate } from '@/ui/format';
import { Icon } from '@/ui/Icon';
import { Panel } from '@/ui/Panel';
import { ProgressBar } from '@/ui/ProgressBar';
import { PROJECT_STATUS, healthBar } from '@/ui/status';
import styles from './pages.module.css';

const STATUSES = ['On track', 'At risk', 'Delayed', 'Completed'] as const;

/** Every project with search and filters. */
export function ProjectsPage() {
  const [query, setQuery] = useState<ProjectQuery>({
    search: '',
    status: '',
    manager: '',
  });
  const [projects] = useLoad(
    useCallback(() => projectsService.projects(query), [query]),
  );
  const [managers] = useLoad(projectsService.managers);

  return (
    <Panel title="All projects">
      <div className={controls.toolbar} role="search">
        <label className={controls.searchBox}>
          <Icon name="search" size={16} />
          <input
            className={controls.input}
            type="search"
            placeholder="Search project, customer or ID"
            aria-label="Search projects"
            value={query.search}
            onChange={(e) =>
              setQuery((q) => ({ ...q, search: e.target.value }))
            }
          />
        </label>
        <select
          className={controls.select}
          aria-label="Status"
          value={query.status}
          onChange={(e) =>
            setQuery((q) => ({
              ...q,
              status: e.target.value as ProjectQuery['status'],
            }))
          }
        >
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <select
          className={controls.select}
          aria-label="Project manager"
          value={query.manager}
          onChange={(e) => setQuery((q) => ({ ...q, manager: e.target.value }))}
        >
          <option value="">All project managers</option>
          {managers.status === 'ready' &&
            managers.data.map((m) => <option key={m}>{m}</option>)}
        </select>
        <span className={controls.spacer} />
        {projects.status === 'ready' && (
          <span className={controls.muted}>
            {projects.data.length} projects
          </span>
        )}
      </div>

      {projects.status === 'loading' && <p role="status">Loading projects…</p>}
      {projects.status === 'error' && (
        <p role="alert">Could not load projects.</p>
      )}
      {projects.status === 'ready' && (
        <div className={controls.tableWrap}>
          <table className={controls.table}>
            <thead>
              <tr>
                <th scope="col">Project ID</th>
                <th scope="col">Project</th>
                <th scope="col">Customer</th>
                <th scope="col">Project manager</th>
                <th scope="col">Start</th>
                <th scope="col">Target completion</th>
                <th scope="col">Status</th>
                <th scope="col">Progress</th>
              </tr>
            </thead>
            <tbody>
              {projects.data.map((project) => (
                <tr key={project.id}>
                  <td className={controls.muted}>{project.id}</td>
                  <td>
                    <Link
                      to={`/${project.id}`}
                      className={controls.primaryText}
                    >
                      {project.name}
                    </Link>
                    <span className={controls.subText}>{project.phase}</span>
                  </td>
                  <td>{project.customerName}</td>
                  <td>
                    <Person name={project.manager} />
                  </td>
                  <td className={controls.muted}>
                    {formatDate(project.startDate)}
                  </td>
                  <td className={controls.muted}>
                    {formatDate(project.targetDate)}
                  </td>
                  <td>
                    <Badge
                      variant={PROJECT_STATUS[project.status] ?? 'neutral'}
                    >
                      {project.status}
                    </Badge>
                  </td>
                  <td className={styles.progressCell}>
                    <span className={controls.muted}>{project.progress}%</span>
                    <ProgressBar
                      value={project.progress}
                      variant={healthBar(project.status)}
                      label={`${project.progress}% complete`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {projects.data.length === 0 && (
            <p className={controls.empty}>No projects match these filters.</p>
          )}
        </div>
      )}
    </Panel>
  );
}
