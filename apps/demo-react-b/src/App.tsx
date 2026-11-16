import type { MfeProps } from '@npst/shared-contracts';
import { ProjectsLayout } from '@/layout/ProjectsLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProjectDetailsPage } from '@/pages/ProjectDetailsPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { TasksPage } from '@/pages/TasksPage';
import { PortalProvider } from '@/portal';
import { Link, Router, useRouter } from '@/routing/router';
import controls from '@/ui/controls.module.css';

/**
 * Projects & Delivery micro-frontend (exposed as `./App` through Module
 * Federation): delivery of won deals.
 * - Portal → app: `MfeProps` (signed-in user, base path, platform).
 * - App → portal: calls on `platform` (toasts, permission checks).
 * - Its own pages live below `basePath` (e.g. `/projects/PRJ-221`).
 * Business data comes from the delivery backend (see `services/projects.ts`).
 */
export function App({ user, basePath, platform }: MfeProps) {
  const viewOnly = !platform.permissions.can('update', 'project-task');
  return (
    <PortalProvider value={{ user, platform }}>
      <Router basePath={basePath}>
        <ProjectsLayout viewOnly={viewOnly}>
          <Pages />
        </ProjectsLayout>
      </Router>
    </PortalProvider>
  );
}

function Pages() {
  const { path, search } = useRouter();
  const [section] = path.split('/').filter(Boolean);
  if (section === undefined) return <DashboardPage />;
  if (section === 'list') return <ProjectsPage />;
  // New query (e.g. a different highlighted task) = fresh board state.
  if (section === 'tasks') return <TasksPage key={search.toString()} />;
  if (section.startsWith('PRJ-'))
    return (
      <ProjectDetailsPage key={section} id={decodeURIComponent(section)} />
    );
  return (
    <p className={controls.empty}>
      This page does not exist. <Link to="/">Go to the Projects dashboard</Link>
    </p>
  );
}

export default App;
