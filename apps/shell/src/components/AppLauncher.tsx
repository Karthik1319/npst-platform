import type { PortalApp } from '@npst/shared-contracts';
import { Link } from 'react-router';
import styles from './AppLauncher.module.css';

interface AppLauncherProps {
  apps: readonly PortalApp[];
}

/** Grid of tiles, one per application the user can open. */
export function AppLauncher({ apps }: AppLauncherProps) {
  return (
    <ul className={styles.grid} aria-label="Applications">
      {apps.map((app) => (
        <li key={app.id}>
          <Link to={app.path} className={styles.tile}>
            <span className={styles.name}>{app.name}</span>
            <span className={styles.description}>{app.description}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
