import { Link } from 'react-router';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        NPST Portal
      </Link>
      {/* Placeholder: Step 3 connects the bell to notifications and reminders. */}
      <button type="button" className={styles.bell} aria-label="Notifications">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6V11a6 6 0 0 0-5-5.9V4a1 1 0 1 0-2 0v1.1A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z"
          />
        </svg>
      </button>
    </header>
  );
}
