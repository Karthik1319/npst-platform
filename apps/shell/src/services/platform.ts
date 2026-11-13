import { createMockPlatform } from '@npst/platform-mocks';
import type { PlatformUser, ShellPlatformApi } from '@npst/shared-contracts';

/**
 * Builds the platform object for the signed-in user; the shell passes it to
 * every MFE. It is a mock for now. When the real platform modules are ready,
 * only this file changes.
 */
export function createPlatform(user: PlatformUser): ShellPlatformApi {
  return createMockPlatform({ user });
}
