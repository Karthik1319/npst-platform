import type { ReactNode } from 'react';
import { Link, useRouter } from '@/routing/router';
import { Icon, type IconName } from '@/ui/Icon';
import styles from './SalesLayout.module.css';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/leads', label: 'Leads', icon: 'leads' },
  { to: '/opportunities', label: 'Opportunities', icon: 'opportunity' },
  { to: '/tasks', label: 'Tasks & follow-ups', icon: 'tasks' },
];

/** Deal Pulse frame: app title and the page tabs. Pages render below. */
export function SalesLayout({ children }: { children: ReactNode }) {
  const { path } = useRouter();
  const current = (to: string) =>
    to === '/' ? path === '/' : path === to || path.startsWith(`${to}/`);

  return (
    <div className={styles.app}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Deal Pulse</p>
          <h1 className={styles.title}>
            {TABS.find((tab) => current(tab.to))?.label ?? 'Deal Pulse'}
          </h1>
        </div>
      </div>
      <nav className={styles.tabs} aria-label="Deal Pulse">
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
