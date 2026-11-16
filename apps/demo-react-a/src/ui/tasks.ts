import type { PlatformUser } from '@npst/shared-contracts';
import type { Task } from '@/services/sales';
import type { IconName } from '@/ui/Icon';

/** Icon for each kind of sales activity. */
export const ACTIVITY_ICON: Record<string, IconName> = {
  Call: 'phone',
  Meeting: 'meeting',
  Email: 'mail',
  Demo: 'demo',
  Document: 'file',
};

export function teamLabel(team: string): string {
  return (
    {
      SALES: 'Sales',
      SOLUTIONS: 'Solutions',
      ADMIN: 'Management',
      EMPLOYEE: 'All employees',
    }[team] ?? team
  );
}

/** Who a task is for: a named person, or a team's queue. */
export function assigneeName(task: Task): string {
  return task.assignee.kind === 'person'
    ? task.assignee.name
    : `${teamLabel(task.assignee.team)} team`;
}

/**
 * Whether this user works on the task: tasks of named sales staff, or the
 * queue of one of the user's own teams (e.g. Sales cannot complete a
 * Management approval). UI only; the backend checks again.
 */
export function canWorkOn(task: Task, user: PlatformUser): boolean {
  return (
    task.assignee.kind === 'person' || user.roles.includes(task.assignee.team)
  );
}
