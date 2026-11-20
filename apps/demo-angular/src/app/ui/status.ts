/** CSS class of the badge for each status in PeopleOS. */
export const EMPLOYMENT_STATUS: Record<string, string> = {
  Active: 'hr-badge--success',
  Probation: 'hr-badge--info',
  'Notice period': 'hr-badge--warning',
};

export const LEAVE_STATUS: Record<string, string> = {
  Pending: 'hr-badge--warning',
  Approved: 'hr-badge--success',
  Rejected: 'hr-badge--error',
};

/** Badge class (with a neutral default). */
export function badge(map: Record<string, string>, value: string): string {
  return `hr-badge ${map[value] ?? 'hr-badge--neutral'}`;
}
