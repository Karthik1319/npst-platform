import type { ReactNode } from 'react';
import { Link, useRouter } from '@/routing/router';
import { Icon, type IconName } from '@/ui/Icon';
import styles from './ProjectsLayout.module.css';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/list', label: 'Projects', icon: 'folder' },
  { to: '/tasks', label: 'Tasks', icon: 'board' },
];

/** Project pages are `/PRJ-…`; they belong to the Projects tab. */
const isProjectPage = (path: string) => /^\/PRJ-/.test(path);

/** Projects & Delivery frame: app title and page tabs. */
export function ProjectsLayout({
  children,
  viewOnly,
}: {
  children: ReactNode;
  viewOnly: boolean;
}) {
  const { path } = useRouter();
  const current = (to: string) =>
    to === '/'
      ? path === '/'
      : path === to ||
        path.startsWith(`${to}/`) ||
        (to === '/list' && isProjectPage(path));

  return (
    <div className={styles.app}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Projects &amp; Delivery</p>
          <h1 className={styles.title}>
            {TABS.find((tab) => current(tab.to))?.label ??
              'Projects & Delivery'}
          </h1>
        </div>
        {viewOnly && (
          <span
            className={styles.viewOnly}
            title="Your role can view delivery status but not change tasks"
          >
            View only
          </span>
        )}
      </div>
      <nav className={styles.tabs} aria-label="Projects & Delivery">
        {TABS.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            className={
              current(tab.to) ? `${styles.tab} ${styles.active}` : styles.tab
            }
            aria-current={current(tab.to) ? 'page' : undefined}
          >
            <Icon name={tab.icon} size={18} />
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
