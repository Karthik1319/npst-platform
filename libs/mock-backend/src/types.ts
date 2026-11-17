/*
 * Records held by the simulated business backends. In the real system each
 * application has its own backend and database; here they share one store so
 * the demo works in a single browser without servers.
 */

/** Ids of the business applications (same ids as the portal's app catalogue). */
export type AppId = 'app-dealpulse' | 'projects' | 'app-keka';

/**
 * Teams that work queues and notifications are addressed to. They use the
 * RBAC role names, so a signed-in user belongs to the teams of their roles.
 */
export type Team = 'ADMIN' | 'SALES' | 'SOLUTIONS' | 'EMPLOYEE';

/** Who did something. In the real system the backend reads this from the session. */
export interface Actor {
  id: string;
  name: string;
  roles: readonly string[];
}

// ---------- Deal Pulse ----------

export type LeadStatus =
  'New' | 'Contacted' | 'Qualified' | 'Unqualified' | 'Converted';

export type LeadSource =
  | 'Website'
  | 'Referral'
  | 'Event'
  | 'Partner'
  | 'LinkedIn'
  | 'RFP portal'
  | 'Cold outreach';

export type Industry =
  | 'Private bank'
  | 'Co-operative bank'
  | 'Small finance bank'
  | 'Payments bank'
  | 'Regional rural bank'
  | 'NBFC'
  | 'Fintech';

export interface Lead {
  id: string;
  company: string;
  contactName: string;
  contactTitle: string;
  email: string;
  phone: string;
  source: LeadSource;
  industry: Industry;
  city: string;
  owner: string;
  status: LeadStatus;
  /** Product the lead asked about. */
  interest: string;
  /** Rough deal size in rupees. */
  estimatedValue: number;
  /** ISO date-time. */
  createdAt: string;
}

/** Pipeline stages after a lead is qualified. */
export type OpportunityStage =
  'Opportunity' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export interface Customer {
  id: string;
  name: string;
  industry: Industry;
  city: string;
  /** Year the relationship started, or `null` for a prospect. */
  customerSince: number | null;
  contactName: string;
  contactTitle: string;
  email: string;
  phone: string;
}

export interface TeamMember {
  name: string;
  role: string;
}

export interface TimelineEntry {
  id: string;
  /** ISO date-time. */
  at: string;
  actor: string;
  text: string;
  /** Which app recorded it, for entries added by another team's work. */
  appId?: AppId;
}

export interface Note {
  id: string;
  at: string;
  author: string;
  text: string;
}

export interface DocumentRef {
  id: string;
  name: string;
  kind: 'RFP' | 'Proposal' | 'Commercials' | 'Presentation' | 'Contract';
  sizeKb: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Opportunity {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  product: string;
  /** Estimated deal value in rupees. */
  value: number;
  stage: OpportunityStage;
  /** Win probability in percent. */
  probability: number;
  owner: string;
  /** ISO date (YYYY-MM-DD). */
  expectedClose: string;
  nextAction: string;
  /** ISO date (YYYY-MM-DD). */
  nextActionDue: string;
  createdAt: string;
  summary: string;
  requirements: string[];
  team: TeamMember[];
  timeline: TimelineEntry[];
  notes: Note[];
  documents: DocumentRef[];
  /** Set when the deal is lost. */
  lostReason?: string;
}

// ---------- Projects & Delivery ----------

export type ProjectStatus =
  'On track' | 'At risk' | 'Delayed' | 'On hold' | 'Completed';

export type ProjectPhase =
  'Initiation' | 'Design' | 'Build' | 'Testing' | 'UAT' | 'Go-live' | 'Closed';

export type MilestoneStatus = 'Done' | 'In progress' | 'Upcoming' | 'Overdue';

export interface Milestone {
  id: string;
  name: string;
  /** ISO date (YYYY-MM-DD). */
  due: string;
  status: MilestoneStatus;
}

export interface Risk {
  id: string;
  title: string;
  severity: 'High' | 'Medium' | 'Low';
  owner: string;
  status: 'Open' | 'Mitigating' | 'Closed';
}

export interface ProjectMember extends TeamMember {
  /** Share of the person's time on this project, in percent. */
  allocation: number;
}

export interface Project {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  manager: string;
  /** ISO dates (YYYY-MM-DD). */
  startDate: string;
  targetDate: string;
  status: ProjectStatus;
  phase: ProjectPhase;
  progress: number;
  /** Contract value in rupees. */
  contractValue: number;
  description: string;
  /** The won opportunity this project delivers, if any. */
  opportunityId?: string;
  team: ProjectMember[];
  milestones: Milestone[];
  risks: Risk[];
  updates: Note[];
}

// ---------- Work items (shared task service) ----------

export type TaskStatus = 'To do' | 'In progress' | 'In review' | 'Done';
export type TaskPriority = 'High' | 'Medium' | 'Low';

/** A task is either given to a named person or put in a team's queue. */
export type TaskAssignee =
  { kind: 'person'; name: string } | { kind: 'team'; team: Team };

export interface Task {
  id: string;
  title: string;
  description?: string;
  /** The app where the task is worked on. */
  appId: AppId;
  /** The app the task came from, when another team created it. */
  sourceAppId?: AppId;
  assignee: TaskAssignee;
  priority: TaskPriority;
  status: TaskStatus;
  /** ISO date (YYYY-MM-DD). */
  due: string;
  projectId?: string;
  opportunityId?: string;
  /** e.g. 'Call', 'Meeting', 'Email' for sales follow-ups. */
  activity?: 'Call' | 'Meeting' | 'Email' | 'Demo' | 'Document';
  createdBy: string;
  createdAt: string;
  completedBy?: string;
  completedAt?: string;
}

// ---------- Keka HR ----------

export type EmploymentStatus = 'Active' | 'Probation' | 'Notice period';
export type EmploymentType = 'Full-time' | 'Contract' | 'Intern';

export interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
  managerId: string | null;
  managerName: string | null;
  status: EmploymentStatus;
  type: EmploymentType;
  /** ISO date (YYYY-MM-DD). */
  joinDate: string;
  /** Month and day only (MM-DD). */
  birthday: string;
  email: string;
  phone: string;
  location: string;
  workMode: 'Office' | 'Hybrid' | 'Remote';
}

export type LeaveType =
  'Casual leave' | 'Sick leave' | 'Earned leave' | 'Comp off';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  /** Employee id, or the portal user id for requests made in the portal. */
  employeeId: string;
  employeeName: string;
  department: string;
  type: LeaveType;
  /** ISO dates (YYYY-MM-DD), inclusive. */
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  decidedBy?: string;
  decidedAt?: string;
}

// ---------- Platform services (server side) ----------

/** Who a notification or reminder is for: a team (role) or one user. */
export type Recipient = { team: Team } | { userId: string };

export interface StoredNotification {
  id: string;
  to: Recipient;
  title: string;
  description: string;
  kind: 'info' | 'success' | 'warning' | 'error';
  appId?: AppId;
  link?: string;
  createdAt: string;
  /** Users who have read it. */
  readBy: string[];
  /** Sample notifications that start as already read for everyone. */
  readByDefault?: boolean;
}

export interface StoredReminder {
  id: string;
  to: Recipient;
  title: string;
  dueAt: string;
  link?: string;
}

/** One line in the portal's Recent Activity. */
export interface Activity {
  id: string;
  at: string;
  appId: AppId;
  actor: string;
  text: string;
  link?: string;
}

/** Everything the simulated backends hold. */
export interface DemoData {
  version: number;
  /** When the data was generated (dates are relative to it). */
  seededAt: string;
  customers: Customer[];
  leads: Lead[];
  opportunities: Opportunity[];
  projects: Project[];
  tasks: Task[];
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  notifications: StoredNotification[];
  reminders: StoredReminder[];
  activity: Activity[];
  /** Figures from before the demo period, for "vs last quarter" comparisons. */
  benchmarks: { pipelineLastQuarter: number };
  /** Next number per id prefix, for records created during the demo. */
  counters: Record<string, number>;
}
