import type { PortalApp } from '@npst/shared-contracts';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { usePlatform } from '@/platform/PlatformContext';

/**
 * Route guard for one app, using the platform RBAC check.
 * This is UX only: the app's backend APIs must check permissions again.
 */
export function RequireAppAccess({
  app,
  children,
}: {
  app: PortalApp;
  children: ReactNode;
}) {
  const platform = usePlatform();
  if (!platform.permissions.can('access', app.id)) {
    return (
      <Navigate to="/access-denied" replace state={{ appName: app.name }} />
    );
  }
  return children;
}
