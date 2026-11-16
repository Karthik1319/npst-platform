import {
  projectsApi,
  workApi,
  type Actor,
  type Customer,
  type Project,
  type ProjectQuery,
  type ProjectsSummary,
  type Task,
  type TaskStatus,
} from '@npst/mock-backend';
import type { PlatformUser } from '@npst/shared-contracts';

/**
 * Projects & Delivery backend calls. All data access of this app goes through
 * this file. In the POC it calls the simulated backend; in production it calls
 * the delivery API over HTTP with the portal's session cookie.
 */
export type {
  Customer,
  Project,
  ProjectQuery,
  ProjectsSummary,
  Task,
  TaskStatus,
};

/** Stand-in for the session the real backend reads; never sent by a real client. */
const actorOf = (user: PlatformUser): Actor => ({
  id: user.id,
  name: user.name,
  roles: user.roles,
});

export const projectsService = {
  summary: (): Promise<ProjectsSummary> => projectsApi.summary(),
  projects: (query: ProjectQuery = {}): Promise<Project[]> =>
    projectsApi.list(query),
  project: (
    id: string,
  ): Promise<{ project: Project; customer: Customer } | null> =>
    projectsApi.get(id),
  managers: (): Promise<string[]> => projectsApi.managers(),
  /** Delivery tasks, including work other teams put in the Solutions queue. */
  tasks: (): Promise<Task[]> => workApi.list({ appId: 'projects' }),
  tasksFor: (projectId: string): Promise<Task[]> => workApi.list({ projectId }),
  setTaskStatus: (
    taskId: string,
    status: TaskStatus,
    user: PlatformUser,
  ): Promise<Task> => workApi.updateStatus(taskId, status, actorOf(user)),
};
