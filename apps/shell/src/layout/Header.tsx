import { Link } from 'react-router';
import { NotificationBell } from '@/components/NotificationBell';
import { UserMenu } from '@/components/UserMenu';
import styles from './Header.module.css';

/** Top bar: portal name, notifications and the account menu. */
export function Header() {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        NPST Portal
      </Link>
      <div className={styles.actions}>
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
