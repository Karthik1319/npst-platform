import type { PlatformApi, PlatformUser } from './platform-api';

/**
 * Props the shell (parent) passes to every MFE (child), React or not.
 *
 * Two-way parent–child communication, without any extra channel:
 * - Shell → MFE: these props.
 * - MFE → Shell: calls on `platform` (e.g. `platform.notify.toast()`, which
 *   the shell shows). Anything new an MFE needs from the shell is added to
 *   `PlatformApi` as a versioned change.
 *
 * Each MFE manages its own internal pages under `basePath`. MFEs never talk
 * to each other directly (see docs/architecture.md, "Communication").
 */
export interface MfeProps {
  user: PlatformUser;
  /** Route prefix the MFE lives under, e.g. `/react-a`. */
  basePath: string;
  platform: PlatformApi;
}

/**
 * Contract for MFEs that are not React components (e.g. Angular).
 * The host creates a DOM element and hands it over; the MFE renders inside it
 * and must release everything (listeners, subscriptions, DOM) in `unmount`.
 */
export interface MountableMfe {
  mount(element: HTMLElement, props: MfeProps): Promise<void>;
  unmount(element: HTMLElement): Promise<void>;
}
