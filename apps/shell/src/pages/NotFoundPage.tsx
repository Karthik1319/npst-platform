import { Link } from 'react-router';
import styles from './Page.module.css';

export function NotFoundPage() {
  return (
    <section>
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.intro}>
        <Link to="/">Back to Portal Home</Link>
      </p>
    </section>
  );
}
