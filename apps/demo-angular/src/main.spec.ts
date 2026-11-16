import { createMockPlatform, mockAuth } from '@npst/platform-mocks';
import type { MfeProps } from '@npst/shared-contracts';
import { getLiveInstances } from './app/app';
import { mount, unmount } from './main';

function propsFor(
  userId = 'u-3',
): MfeProps & { platform: ReturnType<typeof createMockPlatform> } {
  const user = mockAuth.findUser(userId);
  if (!user) throw new Error('mock user missing');
  return { user, basePath: '/angular', platform: createMockPlatform({ user }) };
}

function link(element: HTMLElement, name: string): HTMLAnchorElement {
  const found = [...element.querySelectorAll('a')].find(
    (a) => a.textContent?.trim() === name,
  );
  if (!found) throw new Error(`link ${name} not found`);
  return found;
}

describe('mount contract', () => {
  let element: HTMLElement;

  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    window.history.replaceState(null, '', '/angular');
    element = document.createElement('div');
    document.body.append(element);
  });

  afterEach(async () => {
    await unmount(element);
    element.remove();
    vi.restoreAllMocks();
  });

  it('shows the user and base path it receives from the portal (shell → MFE)', async () => {
    await mount(element, propsFor());
    await vi.waitFor(() =>
      expect(element.textContent).toContain('User 3 (EMPLOYEE)'),
    );
    expect(element.textContent).toContain('/angular');
  });

  it('asks the platform to show a notification (MFE → shell)', async () => {
    const props = propsFor();
    const toasts: string[] = [];
    props.platform.toasts.subscribe((toast) => toasts.push(toast.message));
    await mount(element, props);
    const button = await vi.waitFor(() => {
      const found = element.querySelector('button');
      if (!found) throw new Error('not rendered yet');
      return found;
    });

    button.click();
    button.click();

    expect(toasts).toEqual([
      'Hello from Angular (#1)',
      'Hello from Angular (#2)',
    ]);
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

  it('routes its own pages below the base path', async () => {
    window.history.replaceState(null, '', '/angular/page-2');
    await mount(element, propsFor());
    await vi.waitFor(() => expect(element.textContent).toContain('page 2'));

    link(element, 'Page 1').click();

    await vi.waitFor(() =>
      expect(window.location.pathname).toBe('/angular/page-1'),
    );
    await vi.waitFor(() => expect(element.textContent).toContain('page 1'));
  });
});
