import {
  activityService,
  hrApi,
  onDataChange,
  projectsApi,
  resetDemoData,
  salesApi,
  searchApi,
  taskLink,
  workApi,
  type Activity,
  type AppId,
  type HrSummary,
  type ProjectsSummary,
  type SalesSummary,
  type SearchResult,
  type Task,
} from '@npst/mock-backend';
import type { PlatformUser } from '@npst/shared-contracts';

/**
 * Business data shown on Portal Home (KPIs, pipeline, delivery, tasks,
 * activity). In the real system this is a portal aggregation API that reads
 * each application's backend; here it reads the simulated backends.
 * Only this file changes when the real API exists.
 */
export type {
  Activity,
  HrSummary,
  ProjectsSummary,
  SalesSummary,
  SearchResult,
  Task,
};

export const businessData = {
  salesSummary: (): Promise<SalesSummary> => salesApi.summary(),
  projectsSummary: (): Promise<ProjectsSummary> => projectsApi.summary(),
  hrSummary: (): Promise<HrSummary> => hrApi.summary(),

  /** Open tasks in the queues of the user's teams. */
  myTasks: (user: PlatformUser): Promise<Task[]> => workApi.forUser(user),

  /** Latest activity in the apps the user may open. */
  recentActivity: (appIds: readonly string[], limit = 6): Promise<Activity[]> =>
    activityService.recent({ appIds: appIds as AppId[], limit }),

  /** Portal path that opens a task in its app. */
  taskLink: (task: Task): string => taskLink(task),

  /** Portal search across the apps the user may open (the real service checks permissions too). */
  search: (query: string, appIds: readonly string[]): Promise<SearchResult[]> =>
    searchApi.search(query, appIds),

  /** Demo only: puts the sample data back to its starting state. */
  resetDemoData: (): void => resetDemoData(),

  /** Calls `listener` when any business data changes (simulated push). */
  subscribe: (listener: () => void): (() => void) => onDataChange(listener),
};
