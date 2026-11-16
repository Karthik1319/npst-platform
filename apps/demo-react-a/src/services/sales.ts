import {
  salesApi,
  workApi,
  type Actor,
  type Customer,
  type Lead,
  type LeadQuery,
  type NewLead,
  type Note,
  type Opportunity,
  type OpportunityQuery,
  type Page,
  type SalesActivity,
  type SalesSummary,
  type Task,
  type TaskStatus,
} from '@npst/mock-backend';
import type { PlatformUser } from '@npst/shared-contracts';

/**
 * Sales Hub backend calls. All data access of this app goes through this file.
 * In the POC it calls the simulated backend; in production it calls the
 * Sales Hub API over HTTP (the browser sends the portal's session cookie, so
 * no user or token is passed by the app).
 */
export type {
  Customer,
  Lead,
  LeadQuery,
  NewLead,
  Note,
  Opportunity,
  OpportunityQuery,
  Page,
  SalesActivity,
  SalesSummary,
  Task,
  TaskStatus,
};

/** Stand-in for the session the real backend reads; never sent by a real client. */
const actorOf = (user: PlatformUser): Actor => ({
  id: user.id,
  name: user.name,
  roles: user.roles,
});

export const salesService = {
  summary: (): Promise<SalesSummary> => salesApi.summary(),
  recentActivity: (limit?: number): Promise<SalesActivity[]> =>
    salesApi.recentActivity(limit),
  owners: (): Promise<string[]> => salesApi.owners(),
  leads: (query: LeadQuery): Promise<Page<Lead>> => salesApi.listLeads(query),
  opportunities: (query: OpportunityQuery = {}): Promise<Opportunity[]> =>
    salesApi.listOpportunities(query),
  opportunity: (
    id: string,
  ): Promise<{ opportunity: Opportunity; customer: Customer } | null> =>
    salesApi.getOpportunity(id),
  /** Every Sales Hub task: follow-ups of named people and the Sales team queue. */
  tasks: (): Promise<Task[]> => workApi.list({ appId: 'sales-hub' }),
  /** Tasks of any team linked to one opportunity (e.g. work requested from Solutions). */
  tasksFor: (opportunityId: string): Promise<Task[]> =>
    workApi.list({ opportunityId }),

  createLead: (input: NewLead, user: PlatformUser): Promise<Lead> =>
    salesApi.createLead(input, actorOf(user)),
  addNote: (
    opportunityId: string,
    text: string,
    user: PlatformUser,
  ): Promise<Note> => salesApi.addNote(opportunityId, text, actorOf(user)),
  setTaskStatus: (
    taskId: string,
    status: TaskStatus,
    user: PlatformUser,
  ): Promise<Task> => workApi.updateStatus(taskId, status, actorOf(user)),
};
