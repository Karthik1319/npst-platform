import { Component, computed, inject, signal } from '@angular/core';
import { MFE_PROPS } from '../mfe-props';
import {
  HrService,
  type LeaveBalance,
  type LeaveRequest,
  type LeaveStatus,
} from '../services/hr.service';
import { formatDate, initials, timeAgo, todayIso } from '../ui/format';
import { Icon } from '../ui/icon';
import { LEAVE_STATUS, badge } from '../ui/status';

const TYPES = [
  'Casual leave',
  'Sick leave',
  'Earned leave',
  'Comp off',
] as const;
type Filter = LeaveStatus | 'All';

/**
 * Leave management. Employees apply and follow their own requests
 * (`apply:leave`); managers approve or reject (`approve:leave`). Each step is
 * confirmed by a portal toast, and the other person gets a notification in
 * the portal's bell (sent by the HR backend).
 */
@Component({
  selector: 'app-hr-leave',
  imports: [Icon],
  templateUrl: './leave.html',
})
export class Leave {
  private readonly hr = inject(HrService);
  private readonly platform = inject(MFE_PROPS).platform;
  protected readonly canApprove = this.platform.permissions.can(
    'approve',
    'leave',
  );
  protected readonly canApply = this.platform.permissions.can('apply', 'leave');
  protected readonly types = TYPES;
  protected readonly today = todayIso();

  protected readonly requests = signal<LeaveRequest[]>([]);
  protected readonly mine = signal<LeaveRequest[]>([]);
  protected readonly balance = signal<LeaveBalance[]>([]);
  protected readonly filter = signal<Filter>('Pending');
  protected readonly filters: Filter[] = [
    'Pending',
    'Approved',
    'Rejected',
    'All',
  ];
  protected readonly shown = computed(() => {
    const filter = this.filter();
    return this.requests().filter(
      (r) => filter === 'All' || r.status === filter,
    );
  });
  protected readonly count = (filter: Filter) =>
    filter === 'All'
      ? this.requests().length
      : this.requests().filter((r) => r.status === filter).length;

  protected readonly applying = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal<string | null>(null);

  protected readonly format = { formatDate, initials, timeAgo };
  protected readonly leaveBadge = (status: string) =>
    badge(LEAVE_STATUS, status);

  constructor() {
    this.reload();
  }

  private reload(): void {
    if (this.canApprove)
      void this.hr
        .leaveRequests()
        .then((list) => this.requests.set(this.pendingFirst(list)));
    if (this.canApply) {
      void this.hr.myLeave().then((list) => this.mine.set(list));
      void this.hr.myBalance().then((list) => this.balance.set(list));
    }
  }

  private pendingFirst(list: LeaveRequest[]): LeaveRequest[] {
    return [...list].sort(
      (a, b) =>
        Number(b.status === 'Pending') - Number(a.status === 'Pending') ||
        b.appliedAt.localeCompare(a.appliedAt),
    );
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.target as HTMLFormElement);
    const value = (name: string) => String(form.get(name) ?? '').trim();
    const input = {
      type: value('type') as (typeof TYPES)[number],
      from: value('from'),
      to: value('to'),
      reason: value('reason'),
    };
    if (!input.from || !input.to || !input.reason) {
      this.error.set('Please fill in the dates and a reason.');
      return;
    }
    if (input.to < input.from) {
      this.error.set('The end date is before the start date.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      const request = await this.hr.applyLeave(input);
      // App → portal: the portal shows the confirmation.
      this.platform.notify.toast(
        `Leave request ${request.id} submitted for approval`,
        { kind: 'success' },
      );
      this.applying.set(false);
      this.reload();
    } catch {
      this.error.set('The request could not be submitted. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async decide(
    request: LeaveRequest,
    decision: 'Approved' | 'Rejected',
  ): Promise<void> {
    this.busy.set(request.id);
    try {
      await this.hr.decideLeave(request.id, decision);
      this.platform.notify.toast(
        `Leave ${decision.toLowerCase()} for ${request.employeeName}`,
        {
          kind: decision === 'Approved' ? 'success' : 'warning',
        },
      );
      this.reload();
    } finally {
      this.busy.set(null);
    }
  }
}
