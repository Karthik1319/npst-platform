import type { MfeProps, MountableMfe } from '@npst/shared-contracts';
import type { ComponentType } from 'react';
import { loadEsmRemote } from '@/remotes/load-esm-remote';

/**
 * How the shell loads one remote app. Both kinds receive the same props and
 * get the same timeout, retry and fallback.
 * - `react`: a React component through Module Federation (shares the shell's
 *   single React copy).
 * - `mount`: any other framework through the mount contract, loaded as a plain
 *   ES module from its standard build (shares nothing with the shell).
 */
export type RemoteDefinition =
  | {
      kind: 'react';
      load: () => Promise<{ default: ComponentType<MfeProps> }>;
    }
  | { kind: 'mount'; load: () => Promise<MountableMfe> };

/** Where the Angular remote is served (its own server). */
const DEMO_ANGULAR_URL: string =
  import.meta.env['VITE_DEMO_ANGULAR_URL'] ?? 'http://localhost:4203/';

/**
 * Which app id is served by which remote. `import('demoReactA/App')` is
 * resolved by Module Federation at runtime: it downloads the remote's code
 * from its own server when the route is opened (again on retry, if it failed).
 * Apps not listed here still show a placeholder page.
 */
export const remotes: Readonly<Record<string, RemoteDefinition>> = {
  'react-a': { kind: 'react', load: () => import('demoReactA/App') },
  'react-b': { kind: 'react', load: () => import('demoReactB/App') },
  angular: { kind: 'mount', load: () => loadEsmRemote(DEMO_ANGULAR_URL) },
};
