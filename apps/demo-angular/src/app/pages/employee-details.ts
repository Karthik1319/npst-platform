import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  HrService,
  type Employee,
  type LeaveRequest,
} from '../services/hr.service';
import { formatDate, initials, todayIso } from '../ui/format';
import { Icon } from '../ui/icon';
import { EMPLOYMENT_STATUS, LEAVE_STATUS, badge } from '../ui/status';

/** One employee: profile, employment details, contact, reporting line and leave. */
@Component({
  selector: 'app-hr-employee-details',
  imports: [RouterLink, Icon],
  templateUrl: './employee-details.html',
})
export class EmployeeDetails {
  private readonly hr = inject(HrService);
  private readonly today = todayIso();
  /** From the route `employees/:id` (component input binding). */
  readonly id = input.required<string>();
  protected readonly state = signal<'loading' | 'ready' | 'missing'>('loading');
  protected readonly employee = signal<Employee | null>(null);
  protected readonly reports = signal<Employee[]>([]);
  protected readonly leave = signal<LeaveRequest[]>([]);
  protected readonly tenure = computed(() => {
    const join = this.employee()?.joinDate;
    if (!join) return '';
    const months = Math.max(
      0,
      Math.floor(
        (Date.parse(`${this.today}T00:00:00`) -
          Date.parse(`${join}T00:00:00`)) /
          (30.44 * 86_400_000),
      ),
    );
    return months < 12
      ? `${months} month${months === 1 ? '' : 's'}`
      : `${Math.floor(months / 12)} yr ${months % 12} mo`;
  });
  protected readonly format = { formatDate, initials };
  protected readonly statusBadge = (status: string) =>
    badge(EMPLOYMENT_STATUS, status);
  protected readonly leaveBadge = (status: string) =>
    badge(LEAVE_STATUS, status);

  constructor() {
    effect(() => {
      const id = this.id();
      this.state.set('loading');
      void this.hr.employee(id).then((found) => {
        this.employee.set(found?.employee ?? null);
        this.reports.set(found?.reports ?? []);
        this.state.set(found ? 'ready' : 'missing');
      });
      void this.hr
        .leaveRequests({ employeeId: id })
        .then((list) => this.leave.set(list));
    });
  }
}
