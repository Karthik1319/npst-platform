import {
  Component,
  DestroyRef,
  OnDestroy,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { MFE_PROPS } from './mfe-props';
import { Icon, type IconName } from './ui/icon';

/** Number of live App instances on the page (must never be more than 1 per mount). */
let liveInstances = 0;
export const getLiveInstances = (): number => liveInstances;

const TABS: { path: string; label: string; icon: IconName; exact: boolean }[] =
  [
    { path: '/', label: 'Dashboard', icon: 'dashboard', exact: true },
    {
      path: '/employees',
      label: 'Employee directory',
      icon: 'people',
      exact: false,
    },
    { path: '/leave', label: 'Leave management', icon: 'leave', exact: false },
  ];

/**
 * PeopleOS root: app title, page tabs and the routed page.
 *
 * Styles: this component's stylesheets are not encapsulated so every page can
 * use the same classes, but every rule is scoped below `.hr-app`, so nothing
 * reaches the portal. Angular removes them when the app is destroyed.
 */
@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  selector: 'app-root',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'hr-app' },
  styleUrls: [
    './styles/layout.css',
    './styles/controls.css',
    './styles/content.css',
    './styles/forms.css',
  ],
  templateUrl: './app.html',
})
export class App implements OnDestroy {
  protected readonly props = inject(MFE_PROPS);
  protected readonly tabs = TABS;
  protected readonly title = signal('PeopleOS');
  private readonly router = inject(Router);

  constructor() {
    liveInstances += 1;
    console.info(`[demo-angular] created (live instances: ${liveInstances})`);
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.title.set(this.titleFor(event.urlAfterRedirects));
    });
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  private titleFor(url: string): string {
    const path = url.split('?')[0] ?? '';
    if (path.startsWith('/employees/')) return 'Employee profile';
    return (
      TABS.find((tab) =>
        tab.exact ? path === tab.path : path.startsWith(tab.path),
      )?.label ?? 'PeopleOS'
    );
  }

  ngOnDestroy(): void {
    liveInstances -= 1;
    console.info(`[demo-angular] destroyed (live instances: ${liveInstances})`);
  }
}
