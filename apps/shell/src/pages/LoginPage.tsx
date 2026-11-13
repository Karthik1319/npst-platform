import type { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { loginOptions } from '@/services/auth';
import { useSession } from '@/session/SessionContext';
import styles from './LoginPage.module.css';

/* Icons are line drawings in `currentColor`, so their colour comes from CSS. */
function Icon({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const FEATURES: readonly { label: string; icon: ReactNode }[] = [
  {
    label: 'Access Applications',
    icon: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
      </>
    ),
  },
  {
    label: 'Stay Informed',
    icon: (
      <>
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a2 2 0 0 0 3.4 0" />
      </>
    ),
  },
  {
    label: 'Role-based Access',
    icon: (
      <>
        <circle cx="9" cy="7" r="4" />
        <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
        <path d="M16 3.1a4 4 0 0 1 0 7.8" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
      </>
    ),
  },
];

/** "Admin User" → "AU", "User 1" → "U1". */
function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Mock login: choose one of the predefined users, no password.
 * Every colour, gradient, wave, font size and shadow comes from theme
 * variables, so a runtime theme.css can restyle this page without a rebuild.
 * Intentionally no logo.
 */
export function LoginPage() {
  const { user, signIn } = useSession();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSignIn(userId: string) {
    await signIn(userId);
    navigate('/', { replace: true });
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-label="About the NPST Platform">
        <svg
          className={styles.waveTop}
          viewBox="0 0 800 400"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className={styles.waveLine}
            d="M374 280 C 520 200, 660 160, 800 158"
          />
        </svg>

        <div className={styles.heroContent}>
          <p className={styles.heroTitle}>NPST Platform</p>
          <span className={styles.accentBar} aria-hidden="true" />
          <p className={styles.heroText}>
            Your unified gateway to access <br />
            and manage NPST business applications.
          </p>

          <ul className={styles.features}>
            {FEATURES.map((feature) => (
              <li key={feature.label} className={styles.feature}>
                <span className={styles.featureTile}>
                  <Icon className={styles.featureIcon}>{feature.icon}</Icon>
                </span>
                <span className={styles.featureLabel}>{feature.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <svg
          className={styles.waveBottom}
          viewBox="0 0 800 220"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className={styles.waveBack}
            d="M0 120 C 160 95, 300 150, 440 140 C 590 128, 650 40, 800 30 V220 H0 Z"
          />
          <path
            className={styles.waveFront}
            d="M0 168 C 180 150, 330 212, 480 182 C 620 154, 690 72, 800 64 V220 H0 Z"
          />
          <path
            className={styles.waveHighlight}
            d="M0 118 C 160 93, 300 148, 440 138 C 590 126, 650 38, 800 28"
          />
        </svg>
      </section>

      <main className={styles.panel}>
        <div className={styles.content}>
          <h1 className={styles.title}>Sign in</h1>
          <p className={styles.subtitle}>Choose a demo user to continue.</p>

          <ul className={styles.users} aria-label="Demo users">
            {loginOptions.map((option) => (
              <li key={option.id} className={styles.userItem}>
                <button
                  type="button"
                  className={styles.user}
                  aria-label={`Sign in as ${option.name} (${option.roles.join(', ')})`}
                  onClick={() => void handleSignIn(option.id)}
                >
                  <span className={styles.avatar} aria-hidden="true">
                    {initials(option.name)}
                  </span>
                  <span className={styles.userText}>
                    <span className={styles.userName}>{option.name}</span>
                    <span className={styles.userEmail}>{option.email}</span>
                  </span>
                  <span className={styles.role}>{option.roles.join(', ')}</span>
                  <Icon className={styles.chevron}>
                    <path d="m9 6 6 6-6 6" />
                  </Icon>
                </button>
              </li>
            ))}
          </ul>

          <p className={styles.footnote}>
            <Icon className={styles.infoIcon}>
              <circle cx="12" cy="12" r="9.5" />
              <path d="M12 11v6" />
              <path d="M12 7.5h.01" />
            </Icon>
            Proof of concept: mock sign-in, no password. The real sign-in will
            replace this list.
          </p>
        </div>
      </main>
    </div>
  );
}
