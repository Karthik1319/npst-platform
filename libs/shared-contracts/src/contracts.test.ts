import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  PLATFORM_API_VERSION,
  type MfeProps,
  type MountableMfe,
  type PlatformApi,
  type PlatformUser,
} from './index';

/*
 * `expectTypeOf` checks run when the project is type-checked
 * (`nx run-many -t typecheck`): a contract change that breaks these lines
 * fails the build, so it can't happen by accident.
 */
describe('shell–MFE contract', () => {
  it('passes exactly user, basePath and platform to every MFE', () => {
    expectTypeOf<keyof MfeProps>().toEqualTypeOf<
      'user' | 'basePath' | 'platform'
    >();
    expectTypeOf<MfeProps['user']>().toEqualTypeOf<PlatformUser>();
    expectTypeOf<MfeProps['basePath']>().toEqualTypeOf<string>();
    expectTypeOf<MfeProps['platform']>().toEqualTypeOf<PlatformApi>();
  });

  it('gives non-React MFEs (Angular) the same props through mount/unmount', () => {
    expectTypeOf<keyof MountableMfe>().toEqualTypeOf<'mount' | 'unmount'>();
    expectTypeOf<MountableMfe['mount']>().parameters.toEqualTypeOf<
      [HTMLElement, MfeProps]
    >();
    expectTypeOf<MountableMfe['unmount']>().parameters.toEqualTypeOf<
      [HTMLElement]
    >();
  });

  it('lets MFEs reach the shell only through the platform features', () => {
    expectTypeOf<keyof PlatformApi>().toEqualTypeOf<
      'version' | 'branding' | 'user' | 'permissions' | 'notify' | 'audit'
    >();
  });

  it('has a semantic version, so MFEs can check compatibility', () => {
    expect(PLATFORM_API_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
