import type { BadgeVariant } from '@/ui/Badge';

/** Badge colour for each status used in Deal Pulse. */
export const LEAD_STATUS: Record<string, BadgeVariant> = {
  New: 'info',
  Contacted: 'accent',
  Qualified: 'success',
  Unqualified: 'neutral',
  Converted: 'success',
};

export const STAGE: Record<string, BadgeVariant> = {
  Opportunity: 'info',
  Proposal: 'accent',
  Negotiation: 'warning',
  Won: 'success',
  Lost: 'error',
};

export const PRIORITY: Record<string, BadgeVariant> = {
  High: 'error',
  Medium: 'warning',
  Low: 'neutral',
};

export const TASK_STATUS: Record<string, BadgeVariant> = {
  'To do': 'neutral',
  'In progress': 'info',
  'In review': 'accent',
  Done: 'success',
};
