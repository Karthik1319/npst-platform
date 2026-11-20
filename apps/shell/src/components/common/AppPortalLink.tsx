import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { usePlatform } from '@/platform/PlatformContext';

interface AppPortalLinkProps {
  /** Registry id of the application, e.g. `app-keka`. */
  appId: string;
  appName: string;
  className?: string;
  children: ReactNode;
}

/**
 * Link from the application registry to the application itself. Users open
 * applications inside the portal (e.g. `/peopleos`), not at their deployed address,
 * so the link goes to the portal page. An application the portal does not
 * host shows its label as plain text.
 */
export function AppPortalLink({
  appId,
  appName,
  className,
  children,
}: AppPortalLinkProps) {
  const platform = usePlatform();
  const { data: catalogue = [] } = useQuery({
    queryKey: ['portal-catalogue'],
    queryFn: () => platform.apps.catalogue(),
  });
  const hosted = catalogue.find((app) => app.id === appId);
  if (!hosted) return <span className={className}>{children}</span>;
  return (
    <Link
      to={hosted.path}
      className={className}
      title={`Open ${appName} in the portal`}
    >
      {children}
    </Link>
  );
}
