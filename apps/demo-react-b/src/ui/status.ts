import type { BadgeVariant } from '@/ui/Badge';

/** Badge colour for each status used in Projects & Delivery. */
export const PROJECT_STATUS: Record<string, BadgeVariant> = {
  'On track': 'success',
  'At risk': 'warning',
  Delayed: 'error',
  'On hold': 'neutral',
  Completed: 'info',
};

export const MILESTONE_STATUS: Record<string, BadgeVariant> = {
  Done: 'success',
  'In progress': 'info',
  Upcoming: 'neutral',
  Overdue: 'error',
};

export const SEVERITY: Record<string, BadgeVariant> = {
  High: 'error',
  Medium: 'warning',
  Low: 'neutral',
};
export const PRIORITY = SEVERITY;

export const TASK_STATUS: Record<string, BadgeVariant> = {
  'To do': 'neutral',
  'In progress': 'info',
  'In review': 'accent',
  Done: 'success',
};

/** Progress bar colour for a project's health. */
export function healthBar(
  status: string,
): 'good' | 'watch' | 'bad' | 'primary' {
  if (status === 'Delayed') return 'bad';
  if (status === 'At risk') return 'watch';
  if (status === 'On track') return 'good';
  return 'primary';
}
