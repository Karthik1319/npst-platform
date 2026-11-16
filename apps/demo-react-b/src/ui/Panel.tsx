import { useId, type ReactNode } from 'react';
import { Link } from '@/routing/router';
import { Icon } from '@/ui/Icon';
import styles from './Panel.module.css';

interface PanelProps {
  title: string;
  /** "View all"-style link to a page inside this app. */
  link?: { to: string; label: string };
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** White content card with a titled header (a labelled region). */
export function Panel({
  title,
  link,
  actions,
  className,
  children,
}: PanelProps) {
  const id = useId();
  return (
    <section
      className={`${styles.panel} ${className ?? ''}`}
      aria-labelledby={id}
    >
      <div className={styles.head}>
        <h2 id={id} className={styles.title}>
          {title}
        </h2>
        {actions}
        {link && (
          <Link to={link.to} className={styles.link}>
            {link.label} <Icon name="arrowRight" size={16} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
