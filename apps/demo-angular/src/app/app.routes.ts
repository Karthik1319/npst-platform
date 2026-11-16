import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard';
import { EmployeeDetails } from './pages/employee-details';
import { Employees } from './pages/employees';
import { Leave } from './pages/leave';

/** Pages below the portal path (`/people`, `/people/employees`, …). */
export const routes: Routes = [
  { path: '', pathMatch: 'full', component: Dashboard },
  { path: 'employees', component: Employees },
  { path: 'employees/:id', component: EmployeeDetails },
  { path: 'leave', component: Leave },
  // URLs outside this app (e.g. while the portal leaves /people) are not ours to handle.
  { path: '**', children: [] },
];
