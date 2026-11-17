import { Link, useLocation } from 'react-router';
import { ShieldAlert } from '@/components/icons';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';

function deniedAppName(state: unknown): string | null {
  if (typeof state === 'object' && state !== null && 'appName' in state) {
    const { appName } = state as { appName: unknown };
    return typeof appName === 'string' ? appName : null;
  }
  return null;
}

/** Shown when the user opens a page or application their role does not allow (RBAC, UI only). */
export function AccessDenied() {
  const appName = deniedAppName(useLocation().state);
  return (
    <EmptyState
      icon={ShieldAlert}
      title="Access denied"
      description={
        appName
          ? `You do not have permission to open ${appName}.`
          : 'You do not have permission to open this page.'
      }
      action={
        <Button variant="outline" render={<Link to="/" />}>
          Back to the portal
        </Button>
      }
    />
  );
}
