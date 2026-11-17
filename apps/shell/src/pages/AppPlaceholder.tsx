import type { PortalApp } from '@npst/shared-contracts';
import { LayoutGrid } from '@/components/icons';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';

/** An application in the registry that has no frontend plugged into the portal yet. */
export function AppPlaceholder({ app }: { app: PortalApp }) {
  return (
    <>
      <PageHeader title={app.name} description={app.description} />
      <EmptyState
        icon={LayoutGrid}
        title={`${app.name} is not connected yet`}
        description="The application will open here once its frontend is plugged into the portal as a micro-frontend."
      />
    </>
  );
}
