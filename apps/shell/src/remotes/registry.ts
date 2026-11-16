import type { MfeProps, MountableMfe } from '@npst/shared-contracts';
import { loadEsmRemote } from '@/remotes/load-esm-remote';
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
  'react-b': lazy(() => import('demoReactB/App')),
};

/** Where the Angular remote is served (its own server). */
const DEMO_ANGULAR_URL: string =
  import.meta.env['VITE_DEMO_ANGULAR_URL'] ?? 'http://localhost:4203/';

/**
 * Non-React remotes using the mount contract, loaded as plain ES modules
 * (no Module Federation needed: they share nothing with the shell).
 */
export const mountRemotes: Readonly<
  Record<string, () => Promise<MountableMfe>>
> = {
  angular: () => loadEsmRemote(DEMO_ANGULAR_URL),
};
