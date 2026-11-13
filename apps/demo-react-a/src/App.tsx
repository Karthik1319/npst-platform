import type { MfeProps } from '@npst/shared-contracts';
import { useState, version as reactVersion } from 'react';
import styles from './App.module.css';

/** Where this code was loaded from (shows the remote's own server when inside the shell). */
const servedFrom = new URL(import.meta.url).origin;

/**
 * React A micro-frontend. Receives everything from the host through `MfeProps`;
 * it never imports shell code.
 */
export function App({ user, basePath }: MfeProps) {
  // A hook: if the shell and this remote had two different React copies,
  // React would throw "Invalid hook call" here.
  const [clicks, setClicks] = useState(0);

  return (
    <section className={styles.app}>
      <h1 className={styles.title}>React A</h1>
      <p className={styles.lead}>Demo React micro-frontend.</p>

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

      <button
        type="button"
        className={styles.button}
        onClick={() => setClicks((n) => n + 1)}
      >
        Clicked {clicks} {clicks === 1 ? 'time' : 'times'}
      </button>
    </section>
  );
}

export default App;
