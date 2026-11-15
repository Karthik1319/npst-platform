import type { MfeProps } from '@npst/shared-contracts';
import { useState, version as reactVersion } from 'react';
import styles from './App.module.css';

/** Where this code was loaded from (shows the remote's own server when inside the shell). */
const servedFrom = new URL(import.meta.url).origin;

/**
 * React B micro-frontend: a second, independent remote. Same two-way contract
 * as every MFE:
 * - Shell → MFE: `MfeProps` (user, basePath, platform).
 * - MFE → Shell: calls on `platform`, e.g. `notify.toast()`.
 * It never imports React A or shell code.
 */
export function App({ user, basePath, platform }: MfeProps) {
  // A hook: proves this remote uses the shell's single React copy.
  const [sent, setSent] = useState(0);

  function notifyPortal() {
    const count = sent + 1;
    setSent(count);
    platform.notify.toast(`Hello from React B (#${count})`, {
      kind: 'success',
    });
  }

  return (
    <section className={styles.app}>
      <h1 className={styles.title}>React B</h1>
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
    </section>
  );
}

export default App;
