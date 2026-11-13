import type { PortalApp } from '@npst/shared-contracts';
import { NavLink } from 'react-router';
import styles from './LeftNav.module.css';

interface LeftNavProps {
  apps: readonly PortalApp[];
}

function linkClass({ isActive }: { isActive: boolean }) {
  return isActive ? `${styles.link} ${styles.active}` : styles.link;
}

export function LeftNav({ apps }: LeftNavProps) {
  return (
    <nav className={styles.nav} aria-label="Main">
      <ul className={styles.list}>
        <li>
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
        </li>
        {apps.map((app) => (
          <li key={app.id}>
            <NavLink to={app.path} className={linkClass}>
              {app.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
