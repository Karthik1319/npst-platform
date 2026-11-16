import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  /** 0–100. */
  value: number;
  label: string;
  variant?: 'primary' | 'good' | 'watch' | 'bad';
}

/** Thin progress bar (SVG, so its width needs no inline style). */
export function ProgressBar({
  value,
  label,
  variant = 'primary',
}: ProgressBarProps) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <svg
      className={styles.bar}
      viewBox="0 0 100 6"
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      <rect className={styles.track} width="100" height="6" rx="3" />
      <rect className={styles[variant]} width={width} height="6" rx="3" />
    </svg>
  );
}
