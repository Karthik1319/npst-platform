import type { PlatformUser } from '@npst/shared-contracts';
import { describe, expect, it, vi } from 'vitest';
import {
  createMockPlatform,
  type MockPlatformOptions,
} from './create-mock-platform';
import { mockUsers } from './mock-data';

function user(name: string): PlatformUser {
  const found = mockUsers.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`No mock user ${name}`);
  return found;
}

describe('createMockPlatform', () => {
  it('follows the current contract version', () => {
    expect(createMockPlatform({ user: user('User 1') }).version).toBe('1.1.0');
  });

  it('requires a user (no default user)', () => {
    // No silent Admin default: calling without a user is an error.
    expect(() =>
      createMockPlatform(undefined as unknown as MockPlatformOptions),
    ).toThrow('needs the signed-in user');
    expect(() =>
      createMockPlatform({} as unknown as MockPlatformOptions),
    ).toThrow('needs the signed-in user');
  });

  it.each([
    ['Admin User', ['sales-hub', 'projects', 'people-hr', 'admin-console']],
    ['User 1', ['sales-hub', 'projects']],
    ['User 2', ['projects', 'people-hr']],
    ['User 3', ['people-hr']],
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

  it.each([
    ['export:sales-hub', ['Admin User']],
    ['create:lead', ['Admin User', 'User 1']],
    ['edit:opportunity', ['Admin User', 'User 1']],
    ['update:project-task', ['Admin User', 'User 2']],
    ['approve:leave', ['Admin User']],
    ['apply:leave', ['Admin User', 'User 2', 'User 3']],
  ])('grants the in-app permission %s only to %j', (permission, names) => {
    const [action = '', resource = ''] = permission.split(':');
    for (const candidate of mockUsers) {
      expect(
        createMockPlatform({ user: candidate }).permissions.can(
          action,
          resource,
        ),
        candidate.name,
      ).toBe(names.includes(candidate.name));
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
    const platform = createMockPlatform({ user: user('User 1') });
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

  it("lists the notifications addressed to the user's role, and marks them read", async () => {
    const platform = createMockPlatform({ user: user('User 1') });
    const inbox = await platform.inbox.list();
    expect(inbox.length).toBeGreaterThan(0);
    expect(inbox.some((item) => item.title.includes('Meridian'))).toBe(true);
    // Not for Sales: addressed to the Solutions team.
    expect(inbox.some((item) => item.title.includes('Trident'))).toBe(false);

    const unread = inbox.filter((item) => !item.read);
    const first = unread[0];
    if (!first) throw new Error('expected an unread notification');
    await platform.inbox.markRead(first.id);
    const after = await platform.inbox.list();
    expect(after.filter((item) => !item.read)).toHaveLength(unread.length - 1);

    await platform.inbox.markAllRead();
    expect((await platform.inbox.list()).every((item) => item.read)).toBe(true);
  });

  it("lists the reminders for the user's role", async () => {
    const reminders = await createMockPlatform({
      user: user('User 3'),
    }).reminders.list();
    expect(reminders.map((reminder) => reminder.title)).toContain(
      'Submit timesheet',
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
