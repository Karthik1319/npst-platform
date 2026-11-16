import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { usePlatform } from '@/platform/PlatformContext';
import { businessData } from '@/services/business';
import { useSession } from '@/session/SessionContext';
import { initials } from '@/ui/format';
import { Icon } from '@/ui/Icon';
import { useDismiss } from '@/ui/useDismiss';
import styles from './UserMenu.module.css';

const MENU_ID = 'npst-user-menu';

/** Signed-in user (name, role, initials) with the account menu and central sign-out. */
export function UserMenu() {
  const platform = usePlatform();
  const { user } = platform;
  // Administrative action (demo only): offered to users of the Admin Console.
  const canReset = platform.permissions.can('access', 'admin-console');
  const { signOut } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  function handleReset() {
    close();
    if (
      !window.confirm(
        'Reset all demo data to its starting state? Changes made during the demo are lost.',
      )
    )
      return;
    businessData.resetDemoData();
    navigate('/');
    platform.notify.toast('Demo data reset to its starting state', {
      kind: 'info',
    });
  }

  function handleSignOut() {
    signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={`Account menu, ${user.name}`}
        aria-expanded={open}
        aria-controls={MENU_ID}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span className={styles.who}>
          <span className={styles.name}>{user.name}</span>
          <span className={styles.role}>{user.roles.join(', ')}</span>
        </span>
        <span className={styles.avatar} aria-hidden="true">
          {initials(user.name)}
        </span>
        <Icon name="chevronDown" size={16} />
      </button>

      {open && (
        <div id={MENU_ID} className={styles.menu}>
          <div className={styles.profile}>
            <span className={styles.avatarLarge} aria-hidden="true">
              {initials(user.name)}
            </span>
            <span>
              <span className={styles.profileName}>{user.name}</span>
              <span className={styles.profileEmail}>{user.email}</span>
            </span>
          </div>
          <ul className={styles.items}>
            <li>
              <Link to="/my-tasks" className={styles.item} onClick={close}>
                <Icon name="tasks" size={18} /> My tasks
              </Link>
            </li>
            <li>
              <Link to="/notifications" className={styles.item} onClick={close}>
                <Icon name="bell" size={18} /> Notifications
              </Link>
            </li>
            {canReset && (
              <li>
                <button
                  type="button"
                  className={styles.item}
                  onClick={handleReset}
                >
                  <Icon name="refresh" size={18} /> Reset demo data
                </button>
              </li>
            )}
            <li>
              <button
                type="button"
                className={styles.item}
                onClick={handleSignOut}
              >
                <Icon name="logout" size={18} /> Sign out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
