import { Clock } from '@/components/icons';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';

/** Temporary page during the integration: this Admin Portal page moves over in a later step. */
export function MovingSoon({ page, step }: { page: string; step: number }) {
  return (
    <>
      <PageHeader title={page} />
      <EmptyState
        icon={Clock}
        title={`${page} moves into the portal in Step ${step}`}
        description="The original page is integrated step by step."
      />
    </>
  );
}
