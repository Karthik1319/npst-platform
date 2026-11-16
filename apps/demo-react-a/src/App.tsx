import type { MfeProps } from '@npst/shared-contracts';
import { SalesLayout } from '@/layout/SalesLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { LeadsPage } from '@/pages/LeadsPage';
import { OpportunitiesPage } from '@/pages/OpportunitiesPage';
import { OpportunityDetailsPage } from '@/pages/OpportunityDetailsPage';
import { TasksPage } from '@/pages/TasksPage';
import { PortalProvider } from '@/portal';
import { Link, Router, useRouter } from '@/routing/router';
import controls from '@/ui/controls.module.css';

/**
 * Sales Hub micro-frontend (exposed as `./App` through Module Federation).
 * - Portal → Sales Hub: `MfeProps` (signed-in user, base path, platform).
 * - Sales Hub → portal: calls on `platform` (toasts, permission checks, audit).
 * - Its own pages live below `basePath` (e.g. `/sales/leads`).
 * Business data comes from the Sales Hub backend (see `services/sales.ts`).
 */
export function App({ user, basePath, platform }: MfeProps) {
  return (
    <PortalProvider value={{ user, platform }}>
      <Router basePath={basePath}>
        <SalesLayout>
          <Pages />
        </SalesLayout>
      </Router>
    </PortalProvider>
  );
}

function Pages() {
  const { path } = useRouter();
  const [section, id] = path.split('/').filter(Boolean);
  switch (section) {
    case undefined:
      return <DashboardPage />;
    case 'leads':
      return <LeadsPage />;
    case 'opportunities':
      return id ? (
        <OpportunityDetailsPage key={id} id={decodeURIComponent(id)} />
      ) : (
        <OpportunitiesPage />
      );
    case 'tasks':
      return <TasksPage />;
    default:
      return (
        <p className={controls.empty}>
          This page does not exist.{' '}
          <Link to="/">Go to the Sales Hub dashboard</Link>
        </p>
      );
  }
}

export default App;
