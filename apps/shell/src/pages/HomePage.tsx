import { AppLauncher } from '@/components/AppLauncher';
import { portalApps } from '@/config/apps';
import styles from './Page.module.css';

export function HomePage() {
  return (
    <section>
      <h1 className={styles.title}>Portal Home</h1>
      <p className={styles.intro}>Open one of your applications.</p>
      <AppLauncher apps={portalApps} />
    </section>
  );
}
