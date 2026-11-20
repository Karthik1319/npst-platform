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
    expect(createMockPlatform({ user: user('Priya Nair') }).version).toBe(
      '1.1.0',
    );
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

  const allApps = [
    'app-keka',
    'app-dealpulse',
    'app-skillup',
    'app-finance',
    'projects',
  ];
  it.each([
    ['Aarav Mehta', allApps],
    ['Priya Nair', allApps],
    ['Rohit Kulkarni', ['app-keka', 'projects']],
    ['Vikram Desai', ['app-finance', 'projects']],
    ['Arjun Rao', ['app-keka', 'app-skillup']],
    ['Neha Kapoor', ['app-keka']],
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

  // Users by email (the demo accounts reuse two seeded names).
  const AARAV = 'admin@npst.com';
  const PRIYA = 'priya.nair@npst.com';
  const ROHIT = 'rohit.kulkarni@npst.com';
  const SNEHA = 'sneha.iyer@npst.com';
  const VIKRAM = 'vikram.desai@npst.com';
  const ARJUN = 'arjun.rao@npst.com';
  const NEHA = 'neha.kapoor@npst.com';
  const KARAN = 'karan.malhotra@npst.com';
  const MAKER = 'maker@npst.com';
  const CHECKER = 'checker@npst.com';
  const EMPLOYEE = 'employee@npst.com';
  const ADMIN_PAGES = [AARAV, PRIYA, KARAN, MAKER, CHECKER];
  it.each([
    ['manage:settings', [AARAV]],
    ['view:applications', ADMIN_PAGES],
    ['manage:branding', [...ADMIN_PAGES, ROHIT, SNEHA, VIKRAM]],
    ['view:ai-summary', [...ADMIN_PAGES, ROHIT, SNEHA, VIKRAM]],
    ['view:employee-dashboard', [ARJUN, NEHA, EMPLOYEE]],
    ['export:app-dealpulse', [AARAV]],
    ['create:lead', [AARAV, PRIYA, VIKRAM, KARAN]],
    ['update:project-task', [AARAV, ROHIT, SNEHA]],
    ['approve:leave', [AARAV]],
    ['apply:leave', [AARAV, ROHIT, SNEHA, ARJUN, NEHA, EMPLOYEE]],
  ])('grants the permission %s only to %j', (permission, emails) => {
    const [action = '', resource = ''] = permission.split(':');
    for (const candidate of mockUsers) {
      expect(
        createMockPlatform({ user: candidate }).permissions.can(
          action,
          resource,
        ),
        candidate.email,
      ).toBe(emails.includes(candidate.email));
    }
  });

  it('lists every registered app in the catalogue for every user', async () => {
    const catalogue = await createMockPlatform({
      user: user('Neha Kapoor'),
    }).apps.catalogue();
    expect(catalogue.map((app) => app.id)).toEqual(allApps);
  });

  it('sends toasts to subscribers until they unsubscribe', () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const platform = createMockPlatform({ user: user('Priya Nair') });
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
    const platform = createMockPlatform({ user: user('Priya Nair') });
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
      user: user('Neha Kapoor'),
    }).reminders.list();
    expect(reminders.map((reminder) => reminder.title)).toContain(
      'Submit timesheet',
    );
  });

  it('returns audit history only with the view:audit permission', async () => {
    const history = await createMockPlatform({
      user: user('Aarav Mehta'),
    }).audit.history('leave-request', 'LR-42');
    expect(history).toHaveLength(2);

    await expect(
      createMockPlatform({ user: user('Arjun Rao') }).audit.history(
        'leave-request',
        'LR-42',
      ),
    ).rejects.toThrow('Not allowed');
  });
});
