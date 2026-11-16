import type { PortalApp } from '@npst/shared-contracts';
import { useCallback, useState } from 'react';
import { NavLink } from 'react-router';
import { useInbox } from '@/platform/InboxContext';
import { usePlatform } from '@/platform/PlatformContext';
import { useLiveData } from '@/platform/useLiveData';
import { businessData } from '@/services/business';
import { appVisual } from '@/ui/app-visuals';
import { Icon } from '@/ui/Icon';
import styles from './LeftNav.module.css';

interface LeftNavProps {
  apps: readonly PortalApp[];
}

function linkClass({ isActive }: { isActive: boolean }) {
  return isActive ? `${styles.link} ${styles.active}` : styles.link;
}

const ADMIN_APP_ID = 'admin-console';

/** Main navigation: Home, the user's applications, and the portal's own pages. */
export function LeftNav({ apps }: LeftNavProps) {
  const platform = usePlatform();
  const { unreadCount } = useInbox();
  const loadTasks = useCallback(
    () => businessData.myTasks(platform.user),
    [platform],
  );
  const tasks = useLiveData(loadTasks);
  const taskCount = tasks.status === 'ready' ? tasks.data.length : 0;
  const [appsOpen, setAppsOpen] = useState(true);

  const businessApps = apps.filter((app) => app.id !== ADMIN_APP_ID);
  const adminApp = apps.find((app) => app.id === ADMIN_APP_ID);

  return (
    <nav className={styles.nav} aria-label="Main">
      <div className={styles.inner}>
        <ul className={styles.list}>
          <li>
            <NavLink to="/" end className={linkClass}>
              <Icon name="home" /> <span className={styles.label}>Home</span>
            </NavLink>
          </li>
          {businessApps.length > 0 && (
            <li>
              <button
                type="button"
                className={styles.group}
                aria-expanded={appsOpen}
                onClick={() => setAppsOpen((isOpen) => !isOpen)}
              >
                <Icon name="grid" />{' '}
                <span className={styles.label}>Applications</span>
                <Icon
                  name="chevronDown"
                  size={16}
                  className={appsOpen ? styles.chevronOpen : styles.chevron}
                />
              </button>
              {appsOpen && (
                <ul className={styles.sublist} aria-label="Applications">
                  {businessApps.map((app) => (
                    <li key={app.id}>
                      <NavLink to={app.path} className={linkClass}>
                        <span
                          className={`${styles.appDot} ${styles[`tone${appVisual(app.id).tone}`]}`}
                          aria-hidden="true"
                        />
                        <span className={styles.label}>{app.name}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )}
          <li className={styles.separator} aria-hidden="true" />
          <li>
            <NavLink to="/notifications" className={linkClass}>
              <Icon name="bell" />{' '}
              <span className={styles.label}>Notifications</span>
              {unreadCount > 0 && (
                <span
                  className={styles.alertCount}
                  aria-label={`${unreadCount} unread`}
                >
                  {unreadCount}
                </span>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink to="/my-tasks" className={linkClass}>
              <Icon name="tasks" />{' '}
              <span className={styles.label}>My Tasks</span>
              {taskCount > 0 && (
                <span className={styles.count} aria-label={`${taskCount} open`}>
                  {taskCount}
                </span>
              )}
            </NavLink>
          </li>
          {adminApp && (
            <li>
              <NavLink to={adminApp.path} className={linkClass}>
                <Icon name="admin" />{' '}
                <span className={styles.label}>{adminApp.name}</span>
              </NavLink>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
