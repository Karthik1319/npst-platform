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

/** Where the Angular remote (People & HR) is served (its own server). */
const DEMO_ANGULAR_URL: string =
  import.meta.env['VITE_DEMO_ANGULAR_URL'] ?? 'http://localhost:4203/';

/**
 * Which app id is served by which remote:
 * - Sales Hub → `demo-react-a` (React, Module Federation)
 * - Projects & Delivery → `demo-react-b` (React, Module Federation)
 * - People & HR → `demo-angular` (Angular CLI build, mount contract)
 *
 * `import('demoReactA/App')` is
 * resolved by Module Federation at runtime: it downloads the remote's code
 * from its own server when the route is opened (again on retry, if it failed).
 * Apps not listed here still show a placeholder page.
 */
export const remotes: Readonly<Record<string, RemoteDefinition>> = {
  'sales-hub': { kind: 'react', load: () => import('demoReactA/App') },
  projects: { kind: 'react', load: () => import('demoReactB/App') },
  'people-hr': { kind: 'mount', load: () => loadEsmRemote(DEMO_ANGULAR_URL) },
};
