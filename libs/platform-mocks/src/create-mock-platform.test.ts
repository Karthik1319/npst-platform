import type { PlatformUser } from '@npst/shared-contracts';
import { describe, expect, it, vi } from 'vitest';
import { createMockPlatform } from './create-mock-platform';
import { mockUsers } from './mock-data';

function user(name: string): PlatformUser {
  const found = mockUsers.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`No mock user ${name}`);
  return found;
}

describe('createMockPlatform', () => {
  it('follows the current contract version', () => {
    expect(createMockPlatform().version).toBe('1.0.0');
  });

  it('defaults to Admin User', () => {
    expect(createMockPlatform().user.name).toBe('Admin User');
  });

  it.each([
    ['Admin User', ['react-a', 'react-b', 'angular', 'admin-console']],
    ['User 1', ['react-a', 'react-b']],
    ['User 2', ['react-b', 'angular']],
    ['User 3', ['angular']],
  ])('%s may access exactly %j', async (name, expectedIds) => {
    const platform = createMockPlatform({ user: user(name) });

    const allowed = await platform.apps.allowed();
    expect(allowed.map((app) => app.id)).toEqual(expectedIds);

    const catalogue = await platform.apps.catalogue();
    for (const app of catalogue) {
      expect(platform.permissions.can('access', app.id)).toBe(
        expectedIds.includes(app.id),
      );
    }
  });

  it('lists all four apps in the catalogue for every user', async () => {
    const catalogue = await createMockPlatform({
      user: user('User 3'),
    }).apps.catalogue();
    expect(catalogue).toHaveLength(4);
  });

  it('sends toasts to subscribers until they unsubscribe', () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const platform = createMockPlatform();
    const listener = vi.fn();
    const unsubscribe = platform.toasts.subscribe(listener);

    platform.notify.toast('Saved', { kind: 'success' });
    unsubscribe();
    platform.notify.toast('Not delivered');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Saved', kind: 'success' }),
    );
  });

  it('returns audit history only with the view:audit permission', async () => {
    const history = await createMockPlatform({
      user: user('Admin User'),
    }).audit.history('leave-request', 'LR-42');
    expect(history).toHaveLength(2);

    await expect(
      createMockPlatform({ user: user('User 1') }).audit.history(
        'leave-request',
        'LR-42',
      ),
    ).rejects.toThrow('Not allowed');
  });
});
