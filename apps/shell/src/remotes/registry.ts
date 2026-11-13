import type { MfeProps } from '@npst/shared-contracts';
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Which app id is served by which remote. `import('demoReactA/App')` is
 * resolved by Module Federation at runtime: it downloads the remote's code
 * from its own server the first time the route is opened.
 * Apps not listed here still show a placeholder page.
 */
export const remoteApps: Readonly<
  Record<string, LazyExoticComponent<ComponentType<MfeProps>>>
> = {
  'react-a': lazy(() => import('demoReactA/App')),
};
