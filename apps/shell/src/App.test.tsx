import { act, cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/App';
import { SESSION_STORAGE_KEY } from '@/services/auth';
import { SessionProvider } from '@/session/SessionContext';
import { mountStub } from '@/test/mount-stub';

// Non-React remotes: a fake mount-contract module instead of a real server.
const esmRemote = vi.hoisted(() => ({ down: false, loads: 0 }));
vi.mock('@/remotes/load-esm-remote', () => ({
  loadEsmRemote: () => {
    esmRemote.loads += 1;
    return esmRemote.down
      ? Promise.reject(new Error('Failed to fetch'))
      : Promise.resolve(mountStub);
  },
}));

// Same timeout/retry logic, with short limits so failure tests stay fast.
vi.mock('@/remotes/load-with-retry', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/remotes/load-with-retry')>();
  return {
    ...actual,
    loadWithRetry: <T,>(
      load: () => Promise<T>,
      options: Parameters<typeof actual.loadWithRetry>[1] = {},
    ) =>
      actual.loadWithRetry(load, {
        ...options,
        timeoutMs: 500,
        retryDelayMs: 0,
      }),
  };
});

const USER_IDS: Record<string, string> = {
  'Admin User': 'u-admin',
  'User 1': 'u-1',
  'User 2': 'u-2',
  'User 3': 'u-3',
};

function renderAt(path: string) {
  render(
    <SessionProvider>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </SessionProvider>,
  );
}

/** Starts the app as if `name` had signed in earlier in this browser tab. */
function renderSignedInAt(name: string, path: string) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, USER_IDS[name] ?? '');
  renderAt(path);
}

async function signInFromLoginPage(name: string) {
  const button = await screen.findByRole('button', {
    name: new RegExp(`^Sign in as ${name} \\(`),
  });
  act(() => button.click());
  await screen.findByRole('heading', { level: 1, name: 'Portal Home' });
}

async function launcherTileNames(): Promise<string[]> {
  const launcher = await screen.findByRole('list', { name: 'Applications' });
  return within(launcher)
    .getAllByRole('link')
    .map((tile) => tile.querySelector('span')?.textContent ?? '');
}

function navLinkNames(): string[] {
  const nav = screen.getByRole('navigation', { name: 'Main' });
  return within(nav)
    .getAllByRole('link')
    .map((link) => link.textContent ?? '');
}

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe('login page', () => {
  it('is shown first and offers the four demo users', async () => {
    renderAt('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sign in' }),
    ).toBeDefined();
    const users = screen.getByRole('list', { name: 'Demo users' });
    expect(within(users).getAllByRole('button')).toHaveLength(4);
    expect(screen.getByText('NPST Platform')).toBeDefined();
    // Intentional: no logo or other image on the login page.
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it.each([
    ['Admin User', 'ADMIN'],
    ['User 1', 'SALES'],
    ['User 2', 'SOLUTIONS'],
    ['User 3', 'EMPLOYEE'],
  ])(
    'signs in as %s and shows name and role %s in the header',
    async (name, role) => {
      renderAt('/login');
      await signInFromLoginPage(name);

      const header = screen.getByRole('banner');
      expect(within(header).getByText(name)).toBeDefined();
      expect(within(header).getByText(role)).toBeDefined();
    },
  );

  it('sends a signed-in user from /login to Portal Home', async () => {
    renderSignedInAt('User 1', '/login');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Portal Home' }),
    ).toBeDefined();
  });
});

describe('application visibility per role', () => {
  it.each([
    ['Admin User', ['React A', 'React B', 'Angular', 'Admin Console']],
    ['User 1', ['React A', 'React B']],
    ['User 2', ['React B', 'Angular']],
    ['User 3', ['Angular']],
  ])('%s sees tiles and nav links for %j only', async (name, expected) => {
    renderSignedInAt(name, '/');

    expect(await launcherTileNames()).toEqual(expected);
    expect(navLinkNames()).toEqual(['Home', ...expected]);
  });
});

describe('direct URL access', () => {
  it.each([
    ['User 3', '/react-a', 'React A'],
    ['User 1', '/angular', 'Angular'],
    ['User 2', '/admin', 'Admin Console'],
  ])(
    '%s opening %s is redirected to Access Denied',
    async (name, path, appName) => {
      renderSignedInAt(name, path);

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Access denied' }),
      ).toBeDefined();
      expect(
        screen.getByText(`You do not have permission to open ${appName}.`),
      ).toBeDefined();
      expect(
        screen.queryByRole('heading', { level: 1, name: appName }),
      ).toBeNull();
    },
  );

  it('loads the remote for React A and passes it the host props', async () => {
    renderSignedInAt('User 1', '/react-a');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Remote stub' }),
    ).toBeDefined();
    expect(
      screen.getByText('user=User 1 basePath=/react-a platformUser=User 1'),
    ).toBeDefined();
  });

  it('loads the remote for React B and passes it the host props', async () => {
    renderSignedInAt('User 2', '/react-b');
    expect(
      await screen.findByText(
        'user=User 2 basePath=/react-b platformUser=User 2',
      ),
    ).toBeDefined();
  });

  it('mounts the Angular remote through the mount contract and unmounts it on leave', async () => {
    renderSignedInAt('User 3', '/angular');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Mount stub' }),
    ).toBeDefined();
    expect(
      screen.getByText('user=User 3 basePath=/angular platformUser=User 3'),
    ).toBeDefined();
    expect(mountStub.live).toBe(1);

    act(() => screen.getByRole('link', { name: 'Home' }).click());

    await screen.findByRole('heading', { level: 1, name: 'Portal Home' });
    await vi.waitFor(() => expect(mountStub.live).toBe(0));
    expect(screen.queryByRole('heading', { name: 'Mount stub' })).toBeNull();
  });

  it('shows Page not found for a path that is not an app', async () => {
    renderSignedInAt('Admin User', '/does-not-exist');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeDefined();
  });
});

describe('non-React remotes (mount contract)', () => {
  it('retries once, then shows a fallback with Try again that reloads the remote', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    esmRemote.down = true;
    esmRemote.loads = 0;
    try {
      renderSignedInAt('User 3', '/angular');
      expect(
        await screen.findByText('Angular is not available right now.'),
      ).toBeDefined();
      expect(esmRemote.loads).toBe(2); // first attempt + one automatic retry
      // The rest of the portal keeps working.
      expect(screen.getByRole('navigation', { name: 'Main' })).toBeDefined();

      // The remote is back: "Try again" loads it without a page reload.
      esmRemote.down = false;
      act(() => screen.getByRole('button', { name: 'Try again' }).click());

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Mount stub' }),
      ).toBeDefined();
      expect(esmRemote.loads).toBe(3);
    } finally {
      esmRemote.down = false;
    }
  });

  it('tells MFE routers about shell navigation (popstate)', async () => {
    renderSignedInAt('User 3', '/');
    await screen.findByRole('list', { name: 'Applications' });
    const popstate = vi.fn();
    window.addEventListener('popstate', popstate);

    const nav = screen.getByRole('navigation', { name: 'Main' });
    act(() => within(nav).getByRole('link', { name: 'Angular' }).click());

    await vi.waitFor(() => expect(popstate).toHaveBeenCalledTimes(1));
    window.removeEventListener('popstate', popstate);
  });
});

describe('shell ↔ MFE communication', () => {
  it('shell → MFE: the remote gets a platform for the signed-in user', async () => {
    renderSignedInAt('User 1', '/react-a');
    expect(await screen.findByText('canExport=false')).toBeDefined();
    cleanup();
    sessionStorage.clear();

    renderSignedInAt('Admin User', '/react-a');
    expect(await screen.findByText('canExport=true')).toBeDefined();
  });

  it('MFE → shell: a toast requested by the remote is shown by the shell', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    renderSignedInAt('User 1', '/react-a');
    const button = await screen.findByRole('button', {
      name: 'Notify the portal',
    });

    act(() => button.click());

    // The toast region belongs to the shell's layout, not to the remote.
    const toasts = screen.getByRole('status');
    expect(within(toasts).getByText('Hello from /react-a')).toBeDefined();
  });

  it('central sign-out removes the open remote', async () => {
    renderSignedInAt('User 1', '/react-a');
    await screen.findByRole('heading', { level: 1, name: 'Remote stub' });

    act(() => screen.getByRole('button', { name: 'Sign out' }).click());

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sign in' }),
    ).toBeDefined();
    expect(
      screen.queryByRole('heading', { level: 1, name: 'Remote stub' }),
    ).toBeNull();
  });
});

describe('access denied page', () => {
  it('explains the problem and links back to Portal Home', async () => {
    renderSignedInAt('User 1', '/access-denied');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Access denied' }),
    ).toBeDefined();
    expect(
      screen.getByText('You do not have permission to open this page.'),
    ).toBeDefined();
    expect(
      screen.getByRole('link', { name: 'Back to Portal Home' }),
    ).toBeDefined();
  });
});

describe('logout and protected routes', () => {
  it('redirects to the login page when not signed in', async () => {
    renderAt('/react-b');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sign in' }),
    ).toBeDefined();
  });

  it('signs out back to the login page and the portal stays protected', async () => {
    renderSignedInAt('User 2', '/');
    await screen.findByRole('heading', { level: 1, name: 'Portal Home' });

    act(() => screen.getByRole('button', { name: 'Sign out' }).click());

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sign in' }),
    ).toBeDefined();
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();

    cleanup();
    renderAt('/react-b');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sign in' }),
    ).toBeDefined();
  });
});

describe('platform features in the portal', () => {
  it('shows the bell count (2 unread + 2 reminders)', async () => {
    renderSignedInAt('Admin User', '/');
    expect(
      await screen.findByRole('button', { name: 'Notifications, 4 new' }),
    ).toBeDefined();
  });
});
