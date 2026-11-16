import { createMockPlatform, mockAuth } from '@npst/platform-mocks';
import type { MfeProps, ShellPlatformApi } from '@npst/shared-contracts';
import { APP_ID, APP_NAME } from '../config';

/** Least privilege: standalone mode starts as a normal user who may open this app, never Admin. */
export const DEFAULT_USER_ID = 'u-3';

const TOAST_DURATION_MS = 4000;

type Mount = (element: HTMLElement, props: MfeProps) => Promise<void>;

/**
 * Development-only harness: runs the app without the portal, with the mock
 * platform for a chosen mock user (`?user=<id>`) and the same access check as
 * the portal (`platform.permissions.can('access', APP_ID)`).
 * Plain DOM code, so it adds nothing to the Angular app itself.
 */
export async function startStandalone(
  root: Element,
  search: string,
  mount: Mount,
): Promise<void> {
  const userId = new URLSearchParams(search).get('user') ?? DEFAULT_USER_ID;
  const user = mockAuth.findUser(userId);
  root.replaceChildren(banner(userId));

  if (!user) {
    root.append(
      card('Unknown mock user', `Unknown mock user “${userId}”.`, true),
    );
    return;
  }
  const platform = createMockPlatform({ user });
  if (!platform.permissions.can('access', APP_ID)) {
    root.append(
      card(
        'Access denied',
        `${user.name} (${user.roles.join(', ')}) does not have permission to open ${APP_NAME}.`,
        true,
      ),
    );
    return;
  }

  root.append(toastRegion(platform));
  const container = document.createElement('div');
  root.append(container);
  await mount(container, { user, basePath: '/', platform });
}

function banner(currentUserId: string): HTMLElement {
  const element = document.createElement('div');
  element.className = 'npst-banner';
  element.setAttribute('role', 'note');
  const title = document.createElement('strong');
  title.textContent = 'Standalone mode (development only).';
  const list = document.createElement('ul');
  list.setAttribute('aria-label', 'Switch mock user');
  for (const option of mockAuth.users) {
    const link = document.createElement('a');
    link.href = `?user=${option.id}`;
    link.textContent = option.name;
    if (option.id === currentUserId) link.setAttribute('aria-current', 'true');
    const item = document.createElement('li');
    item.append(link);
    list.append(item);
  }
  element.append(title, ' Mock user:', list);
  return element;
}

function card(title: string, text: string, denied: boolean): HTMLElement {
  const element = document.createElement('section');
  element.className = denied ? 'npst-card npst-card--denied' : 'npst-card';
  const heading = document.createElement('h1');
  heading.textContent = title;
  const paragraph = document.createElement('p');
  paragraph.textContent = text;
  element.append(heading, paragraph);
  if (title === 'Unknown mock user') element.setAttribute('role', 'alert');
  return element;
}

/** Inside the portal the shell shows toasts; here there is no shell, so the harness does. */
function toastRegion(platform: ShellPlatformApi): HTMLElement {
  const region = document.createElement('div');
  region.className = 'npst-toasts';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  platform.toasts.subscribe((toast) => {
    const element = document.createElement('div');
    element.className = 'npst-toast';
    element.textContent = toast.message;
    region.append(element);
    window.setTimeout(() => element.remove(), TOAST_DURATION_MS);
  });
  return region;
}
