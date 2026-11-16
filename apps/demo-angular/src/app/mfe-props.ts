import { InjectionToken } from '@angular/core';
import type { MfeProps } from '@npst/shared-contracts';

/** The props the portal passed to `mount`, available to any component via `inject(MFE_PROPS)`. */
export const MFE_PROPS = new InjectionToken<MfeProps>('MFE_PROPS');
