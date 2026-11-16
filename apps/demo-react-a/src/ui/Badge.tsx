import type { ReactNode } from 'react';
/** Theme accent tone (1–5). */
export type Tone = 1 | 2 | 3 | 4 | 5;
import styles from './Badge.module.css';

export type BadgeVariant =
  'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent';

interface BadgeProps {
  /** A status colour, or an app tone (1–5). */
  variant?: BadgeVariant;
  tone?: Tone;
  children: ReactNode;
}

/** Small coloured label for statuses and app names. */
export function Badge({ variant = 'neutral', tone, children }: BadgeProps) {
  const colour = tone ? styles[`tone${tone}`] : styles[variant];
  return <span className={`${styles.badge} ${colour}`}>{children}</span>;
}
