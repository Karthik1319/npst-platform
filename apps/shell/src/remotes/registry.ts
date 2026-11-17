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

/** Where the Angular remote (Keka HR stand-in) is served (its own server). */
const DEMO_ANGULAR_URL: string =
  import.meta.env['VITE_DEMO_ANGULAR_URL'] ?? 'http://localhost:4203/';

/**
 * Which app id (from the application registry) is served by which remote:
 * - Deal Pulse (`app-dealpulse`) → `demo-react-a` (React, Module Federation;
 *   the Sales Hub demo standing in for the real app)
 * - Keka HR (`app-keka`) → `demo-angular` (Angular CLI build, mount contract;
 *   the People & HR demo standing in for the real app)
 * - Projects & Delivery (`projects`) → `demo-react-b` (earlier demo app)
 *
 * `import('demoReactA/App')` is
 * resolved by Module Federation at runtime: it downloads the remote's code
 * from its own server when the route is opened (again on retry, if it failed).
 * Apps not listed here still show a placeholder page.
 */
export const remotes: Readonly<Record<string, RemoteDefinition>> = {
  'app-dealpulse': { kind: 'react', load: () => import('demoReactA/App') },
  'app-keka': { kind: 'mount', load: () => loadEsmRemote(DEMO_ANGULAR_URL) },
  projects: { kind: 'react', load: () => import('demoReactB/App') },
};
