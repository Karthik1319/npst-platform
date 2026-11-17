import { createMockPlatform, mockAuth } from '@npst/platform-mocks';
import type { MfeProps } from '@npst/shared-contracts';
import { getLiveInstances } from './app/app';
import { mount, unmount } from './main';

type Platform = ReturnType<typeof createMockPlatform>;

function propsFor(userId = 'user-7'): MfeProps & { platform: Platform } {
  const user = mockAuth.findUser(userId);
  if (!user) throw new Error('mock user missing');
  return { user, basePath: '/people', platform: createMockPlatform({ user }) };
}

/** Waits until `find` returns an element inside the mounted app. */
async function waitFor<T>(find: () => T | null | undefined): Promise<T> {
  return vi.waitFor(() => {
    const found = find();
    if (!found) throw new Error('not rendered yet');
    return found;
  });
}

const button = (root: HTMLElement, text: string) =>
  [...root.querySelectorAll('button')].find((b) =>
    b.textContent?.trim().startsWith(text),
  );

describe('People & HR (mount contract)', () => {
  let element: HTMLElement;

  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    window.history.replaceState(null, '', '/people');
    element = document.createElement('div');
    document.body.append(element);
  });

  afterEach(async () => {
    await unmount(element);
    element.remove();
    localStorage.clear(); // the simulated backend keeps its data here
    vi.restoreAllMocks();
  });

  it('shows the HR dashboard with figures for the signed-in user (shell → MFE)', async () => {
    await mount(element, propsFor('user-7'));
    await vi.waitFor(() =>
      expect(element.textContent).toContain('Total employees'),
    );
    expect(element.textContent).toContain('Present today');
    // Employees see their own balance, not the approval queue.
    expect(element.textContent).toContain('My leave balance');
    expect(element.textContent).not.toContain('Pending approvals');
  });

  it('shows the approval queue to managers (approve:leave)', async () => {
    await mount(element, propsFor('user-1'));
    await vi.waitFor(() =>
      expect(element.textContent).toContain('Pending leave approvals'),
    );
  });

  it('routes its own pages below the base path', async () => {
    window.history.replaceState(null, '', '/people/employees');
    await mount(element, propsFor());
    await vi.waitFor(() =>
      expect(element.textContent).toContain('Showing 1–15 of 276'),
    );

    const first = await waitFor(() =>
      element.querySelector<HTMLAnchorElement>('table a'),
    );
    const name = first.textContent?.trim() ?? '';
    first.click();

    await vi.waitFor(() =>
      expect(window.location.pathname).toMatch(
        /^\/people\/employees\/EMP-\d+$/,
      ),
    );
    await vi.waitFor(() =>
      expect(element.querySelector('h2')?.textContent).toBe(name),
    );
    expect(element.textContent).toContain('Employment details');
    expect(element.textContent).toContain('Contact information');
  });

  it('filters the directory by department', async () => {
    window.history.replaceState(null, '', '/people/employees');
    await mount(element, propsFor());
    const select = await waitFor(() =>
      element.querySelector<HTMLSelectElement>(
        'select[aria-label="Department"]',
      ),
    );
    await vi.waitFor(() => expect(select.options.length).toBeGreaterThan(1));

    select.value = 'Human Resources';
    select.dispatchEvent(new Event('change'));

    await vi.waitFor(() => expect(element.textContent).toContain('of 8'));
  });

  it('lets an employee apply for leave; the manager is notified and approves; the employee is notified', async () => {
    // Employee applies (MFE → shell: toast; HR backend → manager: notification).
    window.history.replaceState(null, '', '/people/leave');
    const employee = propsFor('user-7');
    const toasts: string[] = [];
    employee.platform.toasts.subscribe((toast) => toasts.push(toast.message));
    await mount(element, employee);
    (await waitFor(() => button(element, 'Apply for leave'))).click();
    const form = await waitFor(() =>
      element.querySelector<HTMLFormElement>(
        'form[aria-label="Apply for leave"]',
      ),
    );
    const set = (name: string, value: string) => {
      const field = form.querySelector<HTMLInputElement | HTMLSelectElement>(
        `[name="${name}"]`,
      );
      if (field) field.value = value;
    };
    set('type', 'Casual leave');
    set('from', '2099-01-05');
    set('to', '2099-01-06');
    set('reason', 'Family function');
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await vi.waitFor(() =>
      expect(toasts).toEqual([
        expect.stringMatching(/^Leave request LR-\d+ submitted for approval$/),
      ]),
    );
    await vi.waitFor(() =>
      expect(
        element.querySelector('table[aria-label="My leave requests"]')
          ?.textContent,
      ).toContain('Pending'),
    );
    await unmount(element);

    // Manager sees it in the bell and approves it.
    const manager = propsFor('user-1');
    expect((await manager.platform.inbox.list())[0]?.title).toBe(
      'Leave request from Neha Kapoor',
    );
    await mount(element, manager);
    const approve = await waitFor(() =>
      element.querySelector<HTMLButtonElement>(
        'button[aria-label="Approve leave for Neha Kapoor"]',
      ),
    );
    approve.click();
    await vi.waitFor(() =>
      expect(
        element.querySelector(
          'button[aria-label="Approve leave for Neha Kapoor"]',
        ),
      ).toBeNull(),
    );

    // The employee gets the answer in the bell.
    const inbox = await employee.platform.inbox.list();
    expect(inbox[0]).toMatchObject({
      title: 'Your leave request was approved',
      read: false,
    });
  });

  it('hides Apply and Approve without the permissions (Sales has neither)', async () => {
    window.history.replaceState(null, '', '/people/leave');
    await mount(element, propsFor('user-2'));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(button(element, 'Apply for leave')).toBeUndefined();
    expect(
      element.querySelector('table[aria-label="Leave requests"]'),
    ).toBeNull();
  });

  it('runs one instance per element and destroys it on unmount', async () => {
    await mount(element, propsFor());
    await mount(element, propsFor());
    await vi.waitFor(() =>
      expect(element.querySelectorAll('app-root').length).toBe(1),
    );
    expect(getLiveInstances()).toBe(1);

    await unmount(element);

    expect(getLiveInstances()).toBe(0);
    expect(element.childElementCount).toBe(0);
  });

  it('removes its styles from the page on unmount (nothing leaks into the portal)', async () => {
    await mount(element, propsFor());
    const hrStyles = () =>
      [...document.head.querySelectorAll('style')].filter((s) =>
        s.textContent?.includes('.hr-app'),
      );
    await vi.waitFor(() => expect(hrStyles().length).toBeGreaterThan(0));

    await unmount(element);

    expect(hrStyles()).toHaveLength(0);
  });
});
