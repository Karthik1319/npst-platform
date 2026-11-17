import { daysBetweenInclusive } from '../dates';
import { nextId, readData, updateData } from '../store';
import type {
  Actor,
  Employee,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
} from '../types';
import {
  clone,
  matches,
  paginate,
  recordActivity,
  sendNotification,
  today,
  type Page,
} from './common';

/** Yearly leave entitlement per type, in days. */
export const LEAVE_ENTITLEMENT: Record<LeaveType, number> = {
  'Casual leave': 8,
  'Sick leave': 6,
  'Earned leave': 15,
  'Comp off': 2,
};

export interface LeaveBalance {
  type: LeaveType;
  entitled: number;
  used: number;
  pending: number;
  available: number;
}

/** What an employee enters when applying for leave. */
export interface NewLeaveRequest {
  type: LeaveType;
  from: string;
  to: string;
  reason: string;
}

export interface Celebration {
  kind: 'Birthday' | 'Work anniversary';
  employeeId: string;
  name: string;
  department: string;
  /** YYYY-MM-DD of the coming occurrence. */
  date: string;
  /** Completed years, for anniversaries. */
  years?: number;
}

export interface HrSummary {
  totalEmployees: number;
  presentToday: number;
  onLeaveToday: number;
  pendingApprovals: number;
  joinedLast30Days: number;
  onProbation: number;
  departments: { name: string; count: number }[];
  celebrations: Celebration[];
}

export interface EmployeeQuery {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

const isOnLeave = (request: LeaveRequest, day: string) =>
  request.status === 'Approved' && request.from <= day && day <= request.to;

/** Simulated Keka HR backend (read side). */
export const hrApi = {
  async summary(): Promise<HrSummary> {
    const { employees, leaveRequests } = readData();
    const day = today();
    const onLeave = new Set(
      leaveRequests.filter((r) => isOnLeave(r, day)).map((r) => r.employeeId),
    );
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const departments = new Map<string, number>();
    for (const e of employees)
      departments.set(e.department, (departments.get(e.department) ?? 0) + 1);
    return {
      totalEmployees: employees.length,
      presentToday: employees.length - onLeave.size,
      onLeaveToday: onLeave.size,
      pendingApprovals: leaveRequests.filter((r) => r.status === 'Pending')
        .length,
      joinedLast30Days: employees.filter(
        (e) => new Date(`${e.joinDate}T00:00:00`) >= monthAgo,
      ).length,
      onProbation: employees.filter((e) => e.status === 'Probation').length,
      departments: [...departments]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      celebrations: celebrations(employees, 14),
    };
  },

  async listEmployees(query: EmployeeQuery = {}): Promise<Page<Employee>> {
    const items = readData().employees.filter(
      (e) =>
        matches(query.search, e.name, e.id, e.designation, e.email) &&
        (!query.department || e.department === query.department) &&
        (!query.status || e.status === query.status),
    );
    return clone(paginate(items, query.page, query.pageSize));
  },

  async getEmployee(
    id: string,
  ): Promise<{ employee: Employee; reports: Employee[] } | null> {
    const { employees } = readData();
    const employee = employees.find((e) => e.id === id);
    if (!employee) return null;
    return clone({
      employee,
      reports: employees.filter((e) => e.managerId === id),
    });
  },

  async departments(): Promise<string[]> {
    return [...new Set(readData().employees.map((e) => e.department))].sort();
  },

  /** Leave balance of one person (approved and pending days are deducted). */
  async leaveBalance(employeeId: string): Promise<LeaveBalance[]> {
    const own = readData().leaveRequests.filter(
      (r) => r.employeeId === employeeId,
    );
    return (Object.keys(LEAVE_ENTITLEMENT) as LeaveType[]).map((type) => {
      const days = (status: LeaveStatus) =>
        own
          .filter((r) => r.type === type && r.status === status)
          .reduce((sum, r) => sum + r.days, 0);
      const used = days('Approved');
      const pending = days('Pending');
      const entitled = LEAVE_ENTITLEMENT[type];
      return {
        type,
        entitled,
        used,
        pending,
        available: Math.max(0, entitled - used - pending),
      };
    });
  },

  // ---------- Write side (the real backend checks `apply:leave` / `approve:leave`) ----------

  /**
   * Submits a leave request for the signed-in user. Managers (the ADMIN team in
   * this demo) get a notification in the portal's bell.
   */
  async applyLeave(
    input: NewLeaveRequest,
    actor: Actor & { department?: string },
  ): Promise<LeaveRequest> {
    if (input.to < input.from)
      throw new Error('The end date is before the start date');
    return updateData((data) => {
      const request: LeaveRequest = {
        id: nextId(data, 'LR', 2301),
        employeeId: actor.id,
        employeeName: actor.name,
        department: actor.department ?? 'NPST',
        type: input.type,
        from: input.from,
        to: input.to,
        days: daysBetweenInclusive(input.from, input.to),
        reason: input.reason,
        status: 'Pending',
        appliedAt: new Date().toISOString(),
      };
      data.leaveRequests.unshift(request);
      sendNotification(data, {
        to: { team: 'ADMIN' },
        title: `Leave request from ${actor.name}`,
        description: `${request.type}, ${request.days} day${request.days === 1 ? '' : 's'} from ${request.from}. Waiting for your approval.`,
        kind: 'info',
        appId: 'app-keka',
        link: '/keka/leave',
      });
      recordActivity(data, {
        appId: 'app-keka',
        actor: actor.name,
        text: `Leave request submitted (${request.type}, ${request.days} day${request.days === 1 ? '' : 's'})`,
        link: '/keka/leave',
      });
      return clone(request);
    });
  },

  /** Approves or rejects a pending request; the requester is notified. */
  async decideLeave(
    id: string,
    decision: 'Approved' | 'Rejected',
    actor: Actor,
  ): Promise<LeaveRequest> {
    return updateData((data) => {
      const request = data.leaveRequests.find((r) => r.id === id);
      if (!request) throw new Error(`Leave request ${id} not found`);
      if (request.status !== 'Pending')
        throw new Error(
          `Leave request ${id} is already ${request.status.toLowerCase()}`,
        );
      request.status = decision;
      request.decidedBy = actor.name;
      request.decidedAt = new Date().toISOString();
      // Requests made in the portal belong to a portal user, who gets the answer in the bell.
      if (!request.employeeId.startsWith('EMP-')) {
        sendNotification(data, {
          to: { userId: request.employeeId },
          title: `Your leave request was ${decision.toLowerCase()}`,
          description: `${request.type} from ${request.from} to ${request.to} (${request.days} day${request.days === 1 ? '' : 's'}), ${decision.toLowerCase()} by ${actor.name}.`,
          kind: decision === 'Approved' ? 'success' : 'warning',
          appId: 'app-keka',
          link: '/keka/leave',
        });
      }
      recordActivity(data, {
        appId: 'app-keka',
        actor: actor.name,
        text: `Leave ${decision.toLowerCase()} for ${request.employeeName}`,
        link: '/keka/leave',
      });
      return clone(request);
    });
  },

  async listLeaveRequests(
    query: { status?: LeaveStatus | ''; employeeId?: string } = {},
  ): Promise<LeaveRequest[]> {
    return clone(
      readData().leaveRequests.filter(
        (r) =>
          (!query.status || r.status === query.status) &&
          (!query.employeeId || r.employeeId === query.employeeId),
      ),
    );
  },
};

/** Birthdays and work anniversaries in the next `days` days, soonest first. */
function celebrations(
  employees: readonly Employee[],
  days: number,
): Celebration[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const result: Celebration[] = [];
  const pad = (n: number) => String(n).padStart(2, '0');
  for (let offset = 0; offset <= days; offset += 1) {
    const day = new Date(start);
    day.setDate(day.getDate() + offset);
    const monthDay = `${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
    const iso = `${day.getFullYear()}-${monthDay}`;
    for (const e of employees) {
      if (e.birthday === monthDay) {
        result.push({
          kind: 'Birthday',
          employeeId: e.id,
          name: e.name,
          department: e.department,
          date: iso,
        });
      }
      const years = day.getFullYear() - Number(e.joinDate.slice(0, 4));
      if (e.joinDate.slice(5) === monthDay && years > 0) {
        result.push({
          kind: 'Work anniversary',
          employeeId: e.id,
          name: e.name,
          department: e.department,
          date: iso,
          years,
        });
      }
    }
  }
  return result;
}
