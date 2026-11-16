import type { PortalApp } from '@npst/shared-contracts';
import { useCallback, type ReactNode } from 'react';
import { usePlatform } from '@/platform/PlatformContext';
import type { AsyncData } from '@/platform/useAsyncData';
import { useLiveData } from '@/platform/useLiveData';
import { businessData } from '@/services/business';
import { formatInr, formatNumber } from '@/ui/format';
import { AppShortcuts } from './home/AppShortcuts';
import { CelebrationsCard } from './home/CelebrationsCard';
import { DeliveryCard } from './home/DeliveryCard';
import { Greeting } from './home/Greeting';
import styles from './home/Home.module.css';
import { KpiCards, type Kpi } from './home/KpiCards';
import { MyTasksCard, type ApprovalItem } from './home/MyTasksCard';
import { NotificationsCard } from './home/NotificationsCard';
import { PipelineCard } from './home/PipelineCard';
import { RecentActivity } from './home/RecentActivity';
import { WorkforceCard } from './home/WorkforceCard';

interface HomePageProps {
  apps: AsyncData<readonly PortalApp[]>;
}

const ready = <T,>(data: AsyncData<T>): T | null =>
  data.status === 'ready' ? data.data : null;

/**
 * Portal Home: one dashboard across all applications. Every section is
 * filtered by RBAC: a user only sees figures from apps they may open.
 */
export function HomePage({ apps }: HomePageProps) {
  const platform = usePlatform();
  const can = platform.permissions.can;
  const canSales = can('access', 'sales-hub');
  const canProjects = can('access', 'projects');
  const canPeople = can('access', 'people-hr');
  const canApprove = can('approve', 'leave');
  const allowedIds =
    apps.status === 'ready' ? apps.data.map((app) => app.id).join(',') : '';

  // Each summary is only requested for apps the user may open.
  const loadSales = useCallback(
    () => (canSales ? businessData.salesSummary() : Promise.resolve(null)),
    [canSales],
  );
  const loadProjects = useCallback(
    () =>
      canProjects ? businessData.projectsSummary() : Promise.resolve(null),
    [canProjects],
  );
  const loadHr = useCallback(
    () => (canPeople ? businessData.hrSummary() : Promise.resolve(null)),
    [canPeople],
  );
  const loadTasks = useCallback(
    () => businessData.myTasks(platform.user),
    [platform],
  );
  const loadActivity = useCallback(
    () => businessData.recentActivity(allowedIds ? allowedIds.split(',') : []),
    [allowedIds],
  );
  const sales = ready(useLiveData(loadSales));
  const projects = ready(useLiveData(loadProjects));
  const hr = ready(useLiveData(loadHr));
  const tasks = ready(useLiveData(loadTasks));
  const activity = ready(useLiveData(loadActivity));

  // At most two charts, in this order of importance.
  const charts: ReactNode[] = [];
  if (sales) charts.push(<PipelineCard key="pipeline" summary={sales} />);
  if (projects) charts.push(<DeliveryCard key="delivery" summary={projects} />);
  if (hr)
    charts.push(
      <WorkforceCard key="workforce" summary={hr} showApprovals={canApprove} />,
    );

  const approvals: ApprovalItem[] =
    canApprove && hr && hr.pendingApprovals > 0
      ? [
          {
            title: `Approve leave requests (${hr.pendingApprovals} pending)`,
            link: '/people/leave',
          },
        ]
      : [];

  return (
    <div className={styles.dashboard}>
      <div className={styles.main}>
        <Greeting name={platform.user.name} />
        {apps.status === 'loading' && (
          <p role="status">Loading your applications…</p>
        )}
        {apps.status === 'error' && (
          <p role="alert">Could not load your applications.</p>
        )}
        {apps.status === 'ready' && <AppShortcuts apps={apps.data} />}
        <KpiCards
          kpis={buildKpis({
            sales,
            projects,
            hr,
            canApprove,
            openTasks: tasks?.length ?? null,
          })}
        />
        {charts.length > 0 && (
          <div className={styles.charts}>{charts.slice(0, 2)}</div>
        )}
        {activity && <RecentActivity activity={activity} />}
      </div>
      <aside className={styles.side} aria-label="Your updates">
        <NotificationsCard />
        {tasks && <MyTasksCard tasks={tasks} approvals={approvals} />}
        {hr && <CelebrationsCard summary={hr} />}
      </aside>
    </div>
  );
}

interface KpiSources {
  sales: Awaited<ReturnType<typeof businessData.salesSummary>> | null;
  projects: Awaited<ReturnType<typeof businessData.projectsSummary>> | null;
  hr: Awaited<ReturnType<typeof businessData.hrSummary>> | null;
  canApprove: boolean;
  openTasks: number | null;
}

/** Up to four headline figures, most important first, from the apps the user may open. */
function buildKpis({
  sales,
  projects,
  hr,
  canApprove,
  openTasks,
}: KpiSources): Kpi[] {
  const kpis: Kpi[] = [];
  if (sales) {
    const change = sales.pipelineChangePercent;
    kpis.push({
      id: 'pipeline',
      label: 'Sales pipeline',
      value: formatInr(sales.pipelineValue),
      icon: 'target',
      tone: 1,
      link: '/sales',
      trend: {
        direction: change >= 0 ? 'up' : 'down',
        text: `${Math.abs(change)}% vs last quarter`,
        good: change >= 0,
      },
    });
  }
  if (projects) {
    kpis.push({
      id: 'projects',
      label: 'Active projects',
      value: String(projects.active),
      icon: 'folder',
      tone: 2,
      link: '/projects',
      trend:
        projects.startedLast30Days > 0
          ? {
              direction: 'up',
              text: `${projects.startedLast30Days} started this month`,
              good: true,
            }
          : {
              direction: 'flat',
              text: 'No new projects this month',
              good: true,
            },
    });
  }
  if (hr) {
    kpis.push({
      id: 'employees',
      label: 'Total employees',
      value: formatNumber(hr.totalEmployees),
      icon: 'people',
      tone: 3,
      link: '/people/employees',
      trend:
        hr.joinedLast30Days > 0
          ? {
              direction: 'up',
              text: `${hr.joinedLast30Days} joined this month`,
              good: true,
            }
          : { direction: 'flat', text: 'No change', good: true },
    });
  }
  if (hr && canApprove) {
    kpis.push({
      id: 'approvals',
      label: 'Pending approvals',
      value: String(hr.pendingApprovals),
      icon: 'clock',
      tone: 4,
      link: '/people/leave',
      trend: { direction: 'flat', text: 'Leave requests', good: true },
    });
  }
  if (sales) {
    kpis.push({
      id: 'won',
      label: 'Won deals',
      value: formatInr(sales.wonValue),
      icon: 'checkCircle',
      tone: 2,
      link: '/sales/opportunities',
      trend: {
        direction: 'up',
        text: `${sales.wonDeals} deals closed`,
        good: true,
      },
    });
  }
  if (projects) {
    const attention = projects.atRisk + projects.delayed;
    kpis.push({
      id: 'attention',
      label: 'Projects needing attention',
      value: String(attention),
      icon: 'alert',
      tone: 4,
      link: '/projects/list',
      trend: {
        direction: 'flat',
        text: `${projects.delayed} delayed, ${projects.atRisk} at risk`,
        good: false,
      },
    });
  }
  if (hr) {
    kpis.push({
      id: 'on-leave',
      label: 'On leave today',
      value: String(hr.onLeaveToday),
      icon: 'calendar',
      tone: 3,
      link: '/people/leave',
    });
  }
  if (openTasks !== null) {
    kpis.push({
      id: 'my-tasks',
      label: 'My open tasks',
      value: String(openTasks),
      icon: 'tasks',
      tone: 5,
      link: '/my-tasks',
    });
  }
  return kpis.slice(0, 4);
}
