import type { PortalApp } from '@npst/shared-contracts';
import { Link } from 'react-router';
import { appVisual } from '@/ui/app-visuals';
import { Icon } from '@/ui/Icon';
import styles from './Home.module.css';

/** One shortcut card per application the user may open. */
export function AppShortcuts({ apps }: { apps: readonly PortalApp[] }) {
  return (
    <section aria-labelledby="your-apps">
      <div className={styles.sectionHead}>
        <h2 id="your-apps" className={styles.sectionTitle}>
          Your applications
        </h2>
      </div>
      <ul className={styles.apps} aria-label="Applications">
        {apps.map((app) => {
          const visual = appVisual(app.id);
          return (
            <li key={app.id}>
              <Link
                to={app.path}
                className={`${styles.appCard} ${styles[`tint${visual.tone}`]}`}
              >
                <span
                  className={`${styles.appIcon} ${styles[`tone${visual.tone}`]}`}
                >
                  <Icon name={visual.icon} size={22} />
                </span>
                <span className={styles.appName}>{app.name}</span>
                <span className={styles.appDescription}>{app.description}</span>
                <Icon
                  name="chevronRight"
                  size={18}
                  className={styles.appChevron}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
