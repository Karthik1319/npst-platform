import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-page-one',
  template: '<p>This is <strong>page 1</strong> of the Angular app.</p>',
})
class PageOne {}

@Component({
  selector: 'app-page-two',
  template: '<p>This is <strong>page 2</strong> of the Angular app.</p>',
})
class PageTwo {}

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'page-1' },
  { path: 'page-1', component: PageOne },
  { path: 'page-2', component: PageTwo },
  // URLs outside this app (e.g. while the portal leaves /angular) are not ours to handle.
  { path: '**', children: [] },
];
