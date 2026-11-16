/*
 * Simulated business backends for the demo (Sales Hub, Projects & Delivery,
 * People & HR, the shared task service, and the server side of the
 * Notification Service).
 *
 * Apps call these only from their own `services/` folder, the same place they
 * would call their real backend. Replacing this library with real HTTP calls
 * changes only those service files.
 */
export { hrApi } from './api/hr';
export type { Celebration, EmployeeQuery, HrSummary } from './api/hr';
export { notificationService, activityService } from './api/platform';
export type { NotificationView, Viewer } from './api/platform';
export { projectsApi } from './api/projects';
export type {
  ProjectQuery,
  ProjectsSummary,
  ResourceLoad,
  UpcomingMilestone,
} from './api/projects';
export { OPEN_STAGES, salesApi } from './api/sales';
export type {
  FunnelStage,
  LeadQuery,
  OpportunityQuery,
  SalesSummary,
} from './api/sales';
export { taskLink, workApi } from './api/work';
export type { TaskQuery } from './api/work';
export type { Page } from './api/common';
export { generateDemoData, onDataChange, resetDemoData } from './store';
export type * from './types';
