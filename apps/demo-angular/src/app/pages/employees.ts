import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HrService, type Employee, type Page } from '../services/hr.service';
import { initials } from '../ui/format';
import { Icon } from '../ui/icon';
import { EMPLOYMENT_STATUS, badge } from '../ui/status';

const PAGE_SIZE = 15;

/** Employee directory with search, department and status filters. */
@Component({
  selector: 'app-hr-employees',
  imports: [RouterLink, Icon],
  templateUrl: './employees.html',
})
export class Employees {
  private readonly hr = inject(HrService);
  protected readonly search = signal('');
  protected readonly department = signal('');
  protected readonly status = signal('');
  protected readonly page = signal(1);
  protected readonly departments = signal<string[]>([]);
  protected readonly result = signal<Page<Employee> | null>(null);
  protected readonly pages = computed(() =>
    Math.max(1, Math.ceil((this.result()?.total ?? 0) / PAGE_SIZE)),
  );
  protected readonly first = computed(
    () => ((this.result()?.page ?? 1) - 1) * PAGE_SIZE + 1,
  );
  protected readonly last = computed(() =>
    Math.min(this.result()?.total ?? 0, (this.result()?.page ?? 1) * PAGE_SIZE),
  );
  protected readonly initials = initials;
  protected readonly statusBadge = (status: string) =>
    badge(EMPLOYMENT_STATUS, status);

  constructor() {
    void this.hr.departments().then((list) => this.departments.set(list));
    // Reload whenever a filter or the page changes.
    effect(() => {
      const query = {
        search: this.search(),
        department: this.department(),
        status: this.status(),
        page: this.page(),
        pageSize: PAGE_SIZE,
      };
      void this.hr.employees(query).then((page) => this.result.set(page));
    });
  }

  protected setFilter(
    filter: 'search' | 'department' | 'status',
    event: Event,
  ): void {
    this[filter].set(
      (event.target as HTMLInputElement | HTMLSelectElement).value,
    );
    this.page.set(1);
  }

  protected clear(): void {
    this.search.set('');
    this.department.set('');
    this.status.set('');
    this.page.set(1);
  }
}
