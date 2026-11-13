import type { PortalApp } from '@npst/shared-contracts';
import { AppLauncher } from '@/components/AppLauncher';
import type { AsyncData } from '@/platform/useAsyncData';
import styles from './Page.module.css';

interface HomePageProps {
  apps: AsyncData<readonly PortalApp[]>;
}

export function HomePage({ apps }: HomePageProps) {
  return (
    <section>
      <h1 className={styles.title}>Portal Home</h1>
      <p className={styles.intro}>Open one of your applications.</p>
      {apps.status === 'loading' && <p>Loading applications…</p>}
      {apps.status === 'error' && (
        <p role="alert">Could not load your applications.</p>
      )}
      {apps.status === 'ready' && <AppLauncher apps={apps.data} />}
    </section>
  );
}
