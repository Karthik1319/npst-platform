import { Link, useLocation } from 'react-router';
import styles from './Page.module.css';

function deniedAppName(state: unknown): string | null {
  if (typeof state === 'object' && state !== null && 'appName' in state) {
    const { appName } = state as { appName: unknown };
    return typeof appName === 'string' ? appName : null;
  }
  return null;
}

/** Shown when the user opens an app their permissions do not allow. */
export function AccessDeniedPage() {
  const appName = deniedAppName(useLocation().state);

  return (
    <section>
      <h1 className={styles.title}>Access denied</h1>
      <p className={styles.intro}>
        {appName
          ? `You do not have permission to open ${appName}.`
          : 'You do not have permission to open this page.'}
      </p>
      <p>
        <Link to="/">Back to Portal Home</Link>
      </p>
    </section>
  );
}
