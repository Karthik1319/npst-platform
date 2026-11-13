import { createEventBus } from '@npst/shared-contracts';

/** The one event bus the shell passes to every MFE (built on `window` events). */
export const bus = createEventBus();
