import { createMockPlatform, mockAuth } from '@npst/platform-mocks';
import { createEventBus } from '@npst/shared-contracts';
import { useMemo } from 'react';
import { App } from '@/App';
import { APP_ID, APP_NAME } from '@/config';
import styles from './Standalone.module.css';

/** Least privilege: standalone mode starts as a normal user, never Admin. */
export const DEFAULT_USER_ID = 'u-1';

interface StandaloneProps {
  /** The page's query string; `?user=<id>` picks the mock user. */
  search: string;
}

/**
 * Development-only harness: runs React A without the shell, with the mock
 * platform for a chosen mock user, and the same access check as the shell
 * (`platform.permissions.can('access', APP_ID)`).
 */
export function Standalone({ search }: StandaloneProps) {
  const userId = new URLSearchParams(search).get('user') ?? DEFAULT_USER_ID;
  const user = mockAuth.findUser(userId);
  const platform = useMemo(
    () => (user ? createMockPlatform({ user }) : null),
    [user],
  );
  const bus = useMemo(() => createEventBus(), []);

  let content;
  if (!user || !platform) {
    content = <p role="alert">Unknown mock user “{userId}”.</p>;
  } else if (!platform.permissions.can('access', APP_ID)) {
    content = (
      <section className={styles.denied}>
        <h1 className={styles.deniedTitle}>Access denied</h1>
        <p>
          {user.name} ({user.roles.join(', ')}) does not have permission to open{' '}
          {APP_NAME}.
        </p>
      </section>
    );
  } else {
    content = <App user={user} basePath="/" bus={bus} platform={platform} />;
  }

  return (
    <>
      <div className={styles.banner} role="note">
        <strong>Standalone mode (development only).</strong> Mock user:
        <ul className={styles.users} aria-label="Switch mock user">
          {mockAuth.users.map((option) => (
            <li key={option.id}>
              <a
                href={`?user=${option.id}`}
                className={styles.user}
                aria-current={option.id === userId ? 'true' : undefined}
              >
                {option.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
      {content}
    </>
  );
}
