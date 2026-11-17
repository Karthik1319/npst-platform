import type { PortalApp } from '@npst/shared-contracts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import AppLayout from '@/components/layout/AppLayout';
import { useNavSections } from '@/components/layout/Sidebar';
import { AccessDenied } from '@/pages/AccessDenied';
import { AppPlaceholder } from '@/pages/AppPlaceholder';
import { MovingSoon } from '@/pages/MovingSoon';
import Dashboard from '@/pages/Dashboard';
import ApprovalQueue from '@/pages/applications/ApprovalQueue';
import Settings from '@/pages/settings/Settings';
import { connectToasts, showToast } from '@/lib/toast';
import { usePlatform } from '@/platform/PlatformContext';
import { RequireAppAccess } from '@/platform/RequireAppAccess';
import { RemoteAppPage } from '@/remotes/RemoteAppPage';
import { remotes } from '@/remotes/registry';
import { useNotifyMfeRouters } from '@/remotes/useNotifyMfeRouters';

/**
 * The signed-in portal: the Admin Portal's layout (sidebar, top bar), its
 * Shared Services pages (shown by role), and one guarded route per
 * application (MFE) the portal hosts.
 */
export function Portal() {
  const platform = usePlatform();
  // MFE routers re-read the URL after each portal navigation.
  useNotifyMfeRouters();
  // Every hosted app gets a route (so we can say "access denied");
  // only allowed apps appear in the navigation.
  const { data: catalogue, isPending } = useQuery({
    queryKey: ['portal-catalogue'],
    queryFn: () => platform.apps.catalogue(),
  });

  // Toasts from the pages and from MFEs go through the platform's
  // Notification Service; the portal's toaster shows them.
  useEffect(() => {
    connectToasts(platform.notify);
    const unsubscribe = platform.toasts.subscribe(showToast);
    return () => {
      unsubscribe();
      connectToasts(null);
    };
  }, [platform]);

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route
          path="dashboard"
          element={
            <Guard permission={['view', 'applications']}>
              <Dashboard />
            </Guard>
          }
        />
        <Route path="applications" element={<Navigate to="/" replace />} />
        <Route
          path="applications/approval-queue"
          element={
            <Guard permission={['view', 'applications']}>
              <ApprovalQueue />
            </Guard>
          }
        />
        <Route
          path="branding/*"
          element={
            <Guard permission={['manage', 'branding']}>
              <MovingSoon page="UI Branding" step={20} />
            </Guard>
          }
        />
        <Route
          path="notifications"
          element={<Navigate to="/notifications/templates" replace />}
        />
        <Route
          path="notifications/*"
          element={
            <Guard permission={['manage', 'notifications']}>
              <MovingSoon page="Notification Management" step={20} />
            </Guard>
          }
        />
        <Route
          path="reminders/*"
          element={
            <Guard permission={['manage', 'reminders']}>
              <MovingSoon page="Reminders" step={21} />
            </Guard>
          }
        />
        <Route
          path="users"
          element={
            <Guard permission={['manage', 'employees']}>
              <MovingSoon page="Employee Management" step={21} />
            </Guard>
          }
        />
        <Route
          path="audit-logs"
          element={
            <Guard permission={['view', 'audit-logs']}>
              <MovingSoon page="Audit Logs" step={21} />
            </Guard>
          }
        />
        <Route
          path="settings"
          element={
            <Guard permission={['manage', 'settings']}>
              <Settings />
            </Guard>
          }
        />
        {(catalogue ?? []).map((app) => (
          // `/*` lets each app own the sub-routes below its path.
          <Route
            key={app.id}
            path={`${app.path}/*`}
            element={
              <RequireAppAccess app={app}>
                <AppView app={app} />
              </RequireAppAccess>
            }
          />
        ))}
        <Route path="access-denied" element={<AccessDenied />} />
        <Route
          path="*"
          element={isPending ? null : <Navigate to="/" replace />}
        />
      </Route>
    </Routes>
  );
}

/** Start page: the Dashboard for administrators, otherwise the first page or application the user may open. */
function Home() {
  const platform = usePlatform();
  const sections = useNavSections();
  if (platform.permissions.can('view', 'applications')) return <Dashboard />;
  const first = sections[0]?.items[0];
  return first ? <Navigate to={first.path} replace /> : <AccessDenied />;
}

/** Shared Services page guard (RBAC). UI only: every API checks permissions again. */
function Guard({
  permission,
  children,
}: {
  permission: readonly [string, string];
  children: ReactNode;
}) {
  const platform = usePlatform();
  return platform.permissions.can(...permission) ? (
    children
  ) : (
    <Navigate to="/access-denied" replace />
  );
}

/** A loaded remote if one is registered for the app, otherwise a placeholder. */
function AppView({ app }: { app: PortalApp }) {
  const remote = remotes[app.id];
  return remote ? (
    // Keyed by app: switching apps never reuses another app's loading state.
    <RemoteAppPage key={app.id} app={app} remote={remote} />
  ) : (
    <AppPlaceholder app={app} />
  );
}
