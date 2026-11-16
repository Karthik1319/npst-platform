import { initials } from '@/ui/format';
import styles from './Avatar.module.css';

/** Initials in a circle, followed by the name. */
export function Person({ name, detail }: { name: string; detail?: string }) {
  return (
    <span className={styles.person}>
      <span className={styles.avatar} aria-hidden="true">
        {initials(name)}
      </span>
      <span className={styles.text}>
        <span className={styles.name}>{name}</span>
        {detail && <span className={styles.detail}>{detail}</span>}
      </span>
    </span>
  );
}
