import type { MfeProps } from '@npst/shared-contracts';
import { useState, version as reactVersion } from 'react';
import { APP_ID } from '@/config';
import styles from './App.module.css';

/** Where this code was loaded from (shows the remote's own server when inside the shell). */
const servedFrom = new URL(import.meta.url).origin;

/**
 * React A micro-frontend. Two-way communication with the shell:
 * - Shell → MFE: everything arrives as `MfeProps` (user, basePath, platform).
 * - MFE → Shell: calls on `platform`, e.g. `notify.toast()`, which the shell shows.
 * It never imports shell code or other MFEs.
 */
export function App({ user, basePath, platform }: MfeProps) {
  // A hook: if the shell and this remote had two different React copies,
  // React would throw "Invalid hook call" here.
  const [sent, setSent] = useState(0);
  // UI only: the backend must check this permission again.
  const canExport = platform.permissions.can('export', APP_ID);

  function notifyPortal() {
    const count = sent + 1;
    setSent(count);
    platform.notify.toast(`Hello from React A (#${count})`, {
      kind: 'success',
    });
  }

  return (
    <section className={styles.app}>
      <h1 className={styles.title}>React A</h1>
      <p className={styles.lead}>Demo React micro-frontend.</p>

      <h2 className={styles.heading}>From the portal</h2>
      <dl className={styles.facts}>
        <dt>Signed-in user</dt>
        <dd>
          {user.name} ({user.roles.join(', ')})
        </dd>
        <dt>Base path</dt>
        <dd>{basePath}</dd>
        <dt>React version</dt>
        <dd>{reactVersion}</dd>
        <dt>Served from</dt>
        <dd>{servedFrom}</dd>
      </dl>

      <h2 className={styles.heading}>To the portal</h2>
      <p className={styles.note}>
        Asks the portal to show a notification through the platform.
      </p>
      <button type="button" className={styles.button} onClick={notifyPortal}>
        Send a notification
      </button>

      <h2 className={styles.heading}>Reports</h2>
      {canExport ? (
        <button
          type="button"
          className={styles.button}
          onClick={() =>
            platform.notify.toast('Export started (demo).', { kind: 'info' })
          }
        >
          Export report
        </button>
      ) : (
        <p className={styles.note}>
          Export is hidden: your role does not have the{' '}
          <code>export:{APP_ID}</code> permission.
        </p>
      )}
    </section>
  );
}

export default App;
