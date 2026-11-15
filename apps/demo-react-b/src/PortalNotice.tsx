import { APP_NAME, PORTAL_URL } from '@/config';
import styles from './PortalNotice.module.css';

/** Shown when the production build is opened directly instead of through the portal. */
export function PortalNotice() {
  return (
    <main className={styles.notice}>
      <h1 className={styles.title}>{APP_NAME}</h1>
      <p className={styles.text}>
        {APP_NAME} is part of the NPST Portal and opens only inside it.
      </p>
      <a className={styles.link} href={PORTAL_URL}>
        Open the NPST Portal
      </a>
    </main>
  );
}
