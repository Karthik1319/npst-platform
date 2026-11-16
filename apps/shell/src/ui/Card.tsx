import { useId, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from '@/ui/Icon';
import styles from './Card.module.css';

interface CardProps {
  title: string;
  /** "View all"-style link in the card header. */
  link?: { to: string; label: string };
  /** Other controls for the header. */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** White content card with a titled header (a labelled region). */
export function Card({ title, link, actions, className, children }: CardProps) {
  const id = useId();
  return (
    <section
      className={`${styles.card} ${className ?? ''}`}
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
