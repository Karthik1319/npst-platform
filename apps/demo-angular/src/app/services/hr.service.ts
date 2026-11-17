import { Injectable, inject } from '@angular/core';
import {
  hrApi,
  type Employee,
  type EmployeeQuery,
  type HrSummary,
  type LeaveBalance,
  type LeaveRequest,
  type LeaveStatus,
  type NewLeaveRequest,
  type Page,
} from '@npst/mock-backend';
import { MFE_PROPS } from '../mfe-props';

export type {
  Employee,
  EmployeeQuery,
  HrSummary,
  LeaveBalance,
  LeaveRequest,
  LeaveStatus,
  NewLeaveRequest,
  Page,
};

/** Department shown on requests made by portal users (they are not in the sample directory). */
const ROLE_DEPARTMENT: Record<string, string> = {
  ADMIN: 'Management',
  SALES: 'Sales',
  SOLUTIONS: 'Solutions',
  EMPLOYEE: 'Operations',
};

/**
 * Keka HR backend calls. All data access of this app goes through this
 * service. In the POC it calls the simulated backend; in production it calls
 * the HRMS API over HTTP with the portal's session cookie (the app never
 * passes a user or token itself).
 */
@Injectable({ providedIn: 'root' })
export class HrService {
  private readonly props = inject(MFE_PROPS);

  /** Stand-in for the session the real backend reads; never sent by a real client. */
  private actor() {
    const { id, name, roles } = this.props.user;
    return {
      id,
      name,
      roles,
      department: ROLE_DEPARTMENT[roles[0] ?? ''] ?? 'NPST',
    };
  }

  summary(): Promise<HrSummary> {
    return hrApi.summary();
  }

  employees(query: EmployeeQuery): Promise<Page<Employee>> {
    return hrApi.listEmployees(query);
  }

  employee(
    id: string,
  ): Promise<{ employee: Employee; reports: Employee[] } | null> {
    return hrApi.getEmployee(id);
  }

  departments(): Promise<string[]> {
    return hrApi.departments();
  }

  leaveRequests(
    query: { status?: LeaveStatus | ''; employeeId?: string } = {},
  ): Promise<LeaveRequest[]> {
    return hrApi.listLeaveRequests(query);
  }

  /** The signed-in user's own requests and balance. */
  myLeave(): Promise<LeaveRequest[]> {
    return hrApi.listLeaveRequests({ employeeId: this.props.user.id });
  }

  myBalance(): Promise<LeaveBalance[]> {
    return hrApi.leaveBalance(this.props.user.id);
  }

  applyLeave(input: NewLeaveRequest): Promise<LeaveRequest> {
    return hrApi.applyLeave(input, this.actor());
  }

  decideLeave(
    id: string,
    decision: 'Approved' | 'Rejected',
  ): Promise<LeaveRequest> {
    return hrApi.decideLeave(id, decision, this.actor());
  }
}
