import { Link, useNavigate } from 'react-router';
import { NotificationBell } from '@/components/NotificationBell';
import { usePlatform } from '@/platform/PlatformContext';
import { useSession } from '@/session/SessionContext';
import styles from './Header.module.css';

export function Header() {
  const { user } = usePlatform();
  const { signOut } = useSession();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate('/login', { replace: true });
  }

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        NPST Portal
      </Link>
      <div className={styles.actions}>
        <NotificationBell />
        <span className={styles.user}>
          {user.name}
          <span className={styles.role}>{user.roles.join(', ')}</span>
        </span>
        <button
          type="button"
          className={styles.signOut}
          onClick={handleSignOut}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
