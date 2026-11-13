import type { EventBus } from './event-bus';
import type { PlatformApi, PlatformUser } from './platform-api';

/** Props the host passes to every MFE, React or not. */
export interface MfeProps {
  user: PlatformUser;
  /** Route prefix the MFE lives under, e.g. `/react-a`. */
  basePath: string;
  bus: EventBus;
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
