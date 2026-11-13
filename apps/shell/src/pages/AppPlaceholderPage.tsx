import type { PortalApp } from '@npst/shared-contracts';
import styles from './Page.module.css';

interface AppPlaceholderPageProps {
  app: PortalApp;
}

/** Stands in for a micro-frontend until it is loaded with Module Federation. */
export function AppPlaceholderPage({ app }: AppPlaceholderPageProps) {
  return (
    <section>
      <h1 className={styles.title}>{app.name}</h1>
      <p className={styles.intro}>
        Placeholder: this area will load the {app.name} micro-frontend.
      </p>
    </section>
  );
}
