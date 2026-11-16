import type { PortalApp } from '@npst/shared-contracts';
import { Icon, type IconName } from '@/ui/Icon';
import styles from './Page.module.css';

interface AppPlaceholderPageProps {
  app: PortalApp;
}

const PLANNED: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'people',
    title: 'Users and roles',
    text: 'Provision users and assign roles (RBAC module).',
  },
  {
    icon: 'grid',
    title: 'Applications',
    text: 'Register applications and control who may open them.',
  },
  {
    icon: 'admin',
    title: 'Branding',
    text: 'Publish the portal theme to the brand server.',
  },
  {
    icon: 'clock',
    title: 'Audit log',
    text: 'Search change history across applications.',
  },
];

/** Shown for a catalogue app that has no micro-frontend yet (e.g. Admin Console). */
export function AppPlaceholderPage({ app }: AppPlaceholderPageProps) {
  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{app.name}</h1>
          <p className={styles.intro}>
            {app.description}. This application is planned and not part of this
            preview.
          </p>
        </div>
      </div>
      <ul className={styles.planned}>
        {PLANNED.map((item) => (
          <li key={item.title} className={styles.panel}>
            <Icon name={item.icon} size={22} />
            <h2 className={styles.panelTitle}>{item.title}</h2>
            <p className={styles.muted}>{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
