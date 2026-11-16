import { APP_BASE_HREF } from '@angular/common';
import { type ApplicationRef } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import type { MfeProps } from '@npst/shared-contracts';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { MFE_PROPS } from './app/mfe-props';
import { showPortalNotice } from './portal-notice';

/*
 * NPST mount contract. The portal imports this file (the normal Angular CLI
 * entry, built with `ng build`) and calls `mount` / `unmount`.
 * Only app code is involved; the Angular CLI build setup is unchanged.
 */

const running = new WeakMap<HTMLElement, ApplicationRef>();

/** Starts the Angular app inside `element` with the portal's props. */
export async function mount(
  element: HTMLElement,
  props: MfeProps,
): Promise<void> {
  if (running.has(element)) return;
  const appRef = await createApplication({
    providers: [
      ...appConfig.providers,
      { provide: MFE_PROPS, useValue: props },
      // The Angular router works below the portal path, e.g. /angular/page-2.
      { provide: APP_BASE_HREF, useValue: props.basePath },
    ],
  });
  const host = document.createElement('app-root');
  element.replaceChildren(host);
  appRef.bootstrap(App, host);
  running.set(element, appRef);
}

/** Destroys the app started in `element` and releases everything it used. */
export async function unmount(element: HTMLElement): Promise<void> {
  const appRef = running.get(element);
  running.delete(element);
  appRef?.destroy();
  element.replaceChildren();
}

// Opened on its own: only this app's index.html has this marker; the portal's page does not.
const standaloneRoot = document.querySelector(
  '[data-npst-standalone="demo-angular"]',
);
if (standaloneRoot) {
  if (typeof ngDevMode !== 'undefined' && ngDevMode) {
    // Development only: removed from production builds together with the mock data.
    void import('./standalone/standalone').then(({ startStandalone }) =>
      startStandalone(standaloneRoot, window.location.search, mount),
    );
  } else {
    showPortalNotice(standaloneRoot);
  }
}
