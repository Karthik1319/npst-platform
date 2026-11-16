import type { PlatformUser } from '@npst/shared-contracts';
import type { Task } from '@/services/projects';

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

/** Whether this user may move the task: delivery staff's tasks, or a queue of one of the user's teams. */
export function canWorkOn(task: Task, user: PlatformUser): boolean {
  return (
    task.assignee.kind === 'person' || user.roles.includes(task.assignee.team)
  );
}

export const APP_NAMES: Record<string, string> = {
  'sales-hub': 'Sales Hub',
  projects: 'Projects & Delivery',
  'people-hr': 'People & HR',
};
