import { greeting } from '@/ui/format';
import styles from './Home.module.css';

/** Personal greeting banner at the top of Portal Home. */
export function Greeting({ name }: { name: string }) {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return (
    <section className={styles.greeting} aria-label="Greeting">
      <div>
        <p className={styles.greetingHello}>{greeting()},</p>
        <h1 className={styles.greetingName}>{name}</h1>
        <p className={styles.greetingText}>
          Here’s what’s happening across NPST today.
        </p>
        <p className={styles.greetingDate}>{today}</p>
      </div>
      {/* Decorative only: abstract shapes, no logo. */}
      <svg
        className={styles.greetingArt}
        viewBox="0 0 240 120"
        aria-hidden="true"
      >
        <circle cx="200" cy="20" r="70" />
        <circle cx="200" cy="20" r="46" />
        <circle cx="200" cy="20" r="22" />
        <rect x="40" y="70" width="14" height="40" rx="3" />
        <rect x="62" y="52" width="14" height="58" rx="3" />
        <rect x="84" y="62" width="14" height="48" rx="3" />
        <rect x="106" y="38" width="14" height="72" rx="3" />
      </svg>
    </section>
  );
}
