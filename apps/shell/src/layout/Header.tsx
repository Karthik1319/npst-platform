import type { PortalApp } from '@npst/shared-contracts';
import { Link } from 'react-router';
import { HeaderSearch } from '@/components/HeaderSearch';
import { NotificationBell } from '@/components/NotificationBell';
import { UserMenu } from '@/components/UserMenu';
import styles from './Header.module.css';

/** Top bar: portal name, search, notifications and the account menu. */
export function Header({ apps }: { apps: readonly PortalApp[] }) {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        NPST Portal
      </Link>
      <HeaderSearch apps={apps} />
      <div className={styles.actions}>
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
