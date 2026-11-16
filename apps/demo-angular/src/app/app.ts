import { Component, inject, OnDestroy, signal, VERSION } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MFE_PROPS } from './mfe-props';

/** Number of live App instances on the page (must never be more than 1 per mount). */
let liveInstances = 0;
export const getLiveInstances = (): number => liveInstances;

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnDestroy {
  protected readonly props = inject(MFE_PROPS);
  protected readonly angularVersion = VERSION.full;
  protected readonly servedFrom = new URL(import.meta.url).origin;
  private readonly sent = signal(0);

  constructor() {
    liveInstances += 1;
    console.info(`[demo-angular] created (live instances: ${liveInstances})`);
  }

  protected notifyPortal(): void {
    this.sent.update((n) => n + 1);
    this.props.platform.notify.toast(`Hello from Angular (#${this.sent()})`, {
      kind: 'success',
    });
  }

  ngOnDestroy(): void {
    liveInstances -= 1;
    console.info(`[demo-angular] destroyed (live instances: ${liveInstances})`);
  }
}
