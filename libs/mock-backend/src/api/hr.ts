import { readData } from '../store';
import type { Employee, LeaveRequest, LeaveStatus } from '../types';
import { clone, matches, paginate, today, type Page } from './common';

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

/** Simulated People & HR backend (read side). */
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
