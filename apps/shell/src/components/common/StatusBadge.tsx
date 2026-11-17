import { cn } from '@/lib/utils';
import styles from './StatusBadge.module.css';

const TONES: Record<string, string> = {
  // success
  active: styles.active,
  published: styles.active,
  delivered: styles.active,
  completed: styles.active,
  integrated: styles.active,
  success: styles.active,
  configured: styles.active,
  // info
  'pending-approval': styles.pendingApproval,
  medium: styles.pendingApproval,
  info: styles.pendingApproval,
  // warning
  pending: styles.pending,
  draft: styles.pending,
  partial: styles.pending,
  high: styles.pending,
  warning: styles.pending,
  // destructive
  failed: styles.failed,
  overdue: styles.failed,
  critical: styles.failed,
  destructive: styles.failed,
  // neutral
  inactive: styles.inactive,
  'not-configured': styles.inactive,
  'not-integrated': styles.inactive,
  low: styles.inactive,
  neutral: styles.inactive,
  'one-time': styles.inactive,
};

export function statusTone(value: string): string {
  return TONES[value] ?? TONES.neutral;
}

interface StatusBadgeProps {
  value: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ value, label, className }: StatusBadgeProps) {
  const pretty =
    label ?? value.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span
      className={cn(styles.span, statusTone(value), className)}
      data-testid={`status-badge-${value}`}
    >
      <span className={`${styles.span2} npst-sized`} aria-hidden="true" />
      {pretty}
    </span>
  );
}
