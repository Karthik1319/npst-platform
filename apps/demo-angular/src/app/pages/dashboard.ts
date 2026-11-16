import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MFE_PROPS } from '../mfe-props';
import {
  HrService,
  type HrSummary,
  type LeaveBalance,
  type LeaveRequest,
} from '../services/hr.service';
import {
  dueInfo,
  formatDate,
  formatNumber,
  initials,
  todayIso,
} from '../ui/format';
import { Icon } from '../ui/icon';
import { LEAVE_STATUS, badge } from '../ui/status';

/** HR home: headcount, attendance today, approvals or own leave, celebrations. */
@Component({
  selector: 'app-hr-dashboard',
  imports: [RouterLink, Icon],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly hr = inject(HrService);
  private readonly platform = inject(MFE_PROPS).platform;
  protected readonly canApprove = this.platform.permissions.can(
    'approve',
    'leave',
  );
  protected readonly canApply = this.platform.permissions.can('apply', 'leave');
  protected readonly summary = signal<HrSummary | null>(null);
  protected readonly onLeave = signal<LeaveRequest[]>([]);
  protected readonly pending = signal<LeaveRequest[]>([]);
  protected readonly myRequests = signal<LeaveRequest[]>([]);
  protected readonly balance = signal<LeaveBalance[]>([]);
  protected readonly departments = computed(() =>
    (this.summary()?.departments ?? []).slice(0, 7),
  );
  protected readonly maxDepartment = computed(() =>
    Math.max(1, ...this.departments().map((d) => d.count)),
  );
  protected readonly available = computed(() =>
    this.balance().reduce((sum, b) => sum + b.available, 0),
  );
  protected readonly format = {
    formatDate,
    formatNumber,
    initials,
    due: (d: string) => dueInfo(d).label,
  };
  protected readonly leaveBadge = (status: string) =>
    badge(LEAVE_STATUS, status);

  constructor() {
    void this.hr.summary().then((s) => this.summary.set(s));
    const today = todayIso();
    void this.hr
      .leaveRequests({ status: 'Approved' })
      .then((list) =>
        this.onLeave.set(list.filter((r) => r.from <= today && today <= r.to)),
      );
    if (this.canApprove)
      void this.hr
        .leaveRequests({ status: 'Pending' })
        .then((list) => this.pending.set(list));
    if (this.canApply) {
      void this.hr.myLeave().then((list) => this.myRequests.set(list));
      void this.hr.myBalance().then((list) => this.balance.set(list));
    }
  }
}
