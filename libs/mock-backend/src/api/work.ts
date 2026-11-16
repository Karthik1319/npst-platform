import { readData, updateData } from '../store';
import type { Actor, AppId, Task, TaskStatus, Team } from '../types';
import { clone, recordActivity } from './common';

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

  /**
   * Moves a task to another status. Completing a task records who did it, adds
   * it to Recent Activity and to the related opportunity's timeline.
   * (The real backend checks the caller's permission first.)
   */
  async updateStatus(
    id: string,
    status: TaskStatus,
    actor: Actor,
  ): Promise<Task> {
    return updateData((data) => {
      const task = data.tasks.find((t) => t.id === id);
      if (!task) throw new Error(`Task ${id} not found`);
      task.status = status;
      if (status !== 'Done') {
        delete task.completedBy;
        delete task.completedAt;
        return clone(task);
      }
      const now = new Date().toISOString();
      task.completedBy = actor.name;
      task.completedAt = now;
      recordActivity(data, {
        appId: task.appId,
        actor: actor.name,
        text: `Task “${task.title}” completed`,
        link: taskLink(task),
      });
      const opportunity = task.opportunityId
        ? data.opportunities.find((o) => o.id === task.opportunityId)
        : undefined;
      opportunity?.timeline.unshift({
        id: `${opportunity.id}-t${task.id}`,
        at: now,
        actor: actor.name,
        text: `Task completed: ${task.title}`,
        ...(task.appId !== 'sales-hub' ? { appId: task.appId } : {}),
      });
      return clone(task);
    });
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
