import { readData } from '../store';
import type { AppId, Task, TaskStatus, Team } from '../types';
import { clone } from './common';

export interface TaskQuery {
  appId?: AppId;
  projectId?: string;
  opportunityId?: string;
  status?: TaskStatus | '';
  /** Only tasks in this team's queue. */
  team?: Team;
}

/** Portal path where a task is worked on. */
export function taskLink(task: Task): string {
  switch (task.appId) {
    case 'sales-hub':
      return task.opportunityId
        ? `/sales/opportunities/${task.opportunityId}`
        : '/sales/tasks';
    case 'projects':
      return `/projects/tasks?task=${task.id}`;
    case 'people-hr':
      return '/people';
  }
}

/** Simulated shared task service (read side): one place for every team's work items. */
export const workApi = {
  async list(query: TaskQuery = {}): Promise<Task[]> {
    return clone(
      readData().tasks.filter(
        (t) =>
          (!query.appId || t.appId === query.appId) &&
          (!query.projectId || t.projectId === query.projectId) &&
          (!query.opportunityId || t.opportunityId === query.opportunityId) &&
          (!query.status || t.status === query.status) &&
          (!query.team ||
            (t.assignee.kind === 'team' && t.assignee.team === query.team)),
      ),
    );
  },

  /** Open tasks in the queues of the user's teams (their roles), soonest due first. */
  async forUser(user: { roles: readonly string[] }): Promise<Task[]> {
    return clone(
      readData()
        .tasks.filter(
          (t) =>
            t.status !== 'Done' &&
            t.assignee.kind === 'team' &&
            user.roles.includes(t.assignee.team),
        )
        .sort((a, b) => a.due.localeCompare(b.due)),
    );
  },
};
