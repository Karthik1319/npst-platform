import { nextId, readData, updateData } from '../store';
import type { Actor, AppId, Task, TaskStatus, Team } from '../types';
import { clone, recordActivity, sendNotification } from './common';

/** Team that follows up work requested from each app. */
const SOURCE_TEAM: Partial<Record<AppId, Team>> = {
  'sales-hub': 'SALES',
  projects: 'SOLUTIONS',
  'people-hr': 'ADMIN',
};

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
   * Moves a task to another status (the real backend checks the caller's
   * permission first).
   * - Starting or completing a task requested from another app adds a line to
   *   the related opportunity's timeline.
   * - Completing it records who did it, adds it to Recent Activity and, when
   *   another team asked for it, sends that team a notification (server to
   *   server, through the Notification Service).
   */
  async updateStatus(
    id: string,
    status: TaskStatus,
    actor: Actor,
  ): Promise<Task> {
    return updateData((data) => {
      const task = data.tasks.find((t) => t.id === id);
      if (!task) throw new Error(`Task ${id} not found`);
      const previous = task.status;
      task.status = status;
      const now = new Date().toISOString();
      const opportunity = task.opportunityId
        ? data.opportunities.find((o) => o.id === task.opportunityId)
        : undefined;
      const requested =
        task.sourceAppId !== undefined && task.sourceAppId !== task.appId;
      const timeline = (text: string) =>
        opportunity?.timeline.unshift({
          id: nextId(data, 'TL', 1),
          at: now,
          actor: actor.name,
          text,
          ...(task.appId !== 'sales-hub' ? { appId: task.appId } : {}),
        });

      if (status !== 'Done') {
        delete task.completedBy;
        delete task.completedAt;
        if (requested && status === 'In progress' && previous === 'To do')
          timeline(`Work started: ${task.title}`);
        return clone(task);
      }

      task.completedBy = actor.name;
      task.completedAt = now;
      recordActivity(data, {
        appId: task.appId,
        actor: actor.name,
        text: `Task “${task.title}” completed`,
        link: taskLink(task),
      });
      timeline(`Task completed: ${task.title}`);
      const sourceTeam = task.sourceAppId
        ? SOURCE_TEAM[task.sourceAppId]
        : undefined;
      if (requested && sourceTeam) {
        sendNotification(data, {
          to: { team: sourceTeam },
          title: `Completed by ${actor.name}: ${task.title}`,
          description: opportunity
            ? `The work you requested for ${opportunity.customerName} (${opportunity.id}) is done. Open the opportunity to continue.`
            : 'The work you requested is done.',
          kind: 'success',
          appId: task.sourceAppId,
          link: opportunity ? `/sales/opportunities/${opportunity.id}` : '/',
        });
      }
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
