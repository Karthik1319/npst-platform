import { NavLink } from 'react-router';
import { portalApps } from '@/config/apps';
import styles from './LeftNav.module.css';

function linkClass({ isActive }: { isActive: boolean }) {
  return isActive ? `${styles.link} ${styles.active}` : styles.link;
}

export function LeftNav() {
  return (
    <nav className={styles.nav} aria-label="Main">
      <ul className={styles.list}>
        <li>
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
        </li>
        {portalApps.map((app) => (
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
