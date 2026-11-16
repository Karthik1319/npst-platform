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

/** Portal Home greets the user by name in its main heading. */
const portalHome = (name: string) =>
  screen.findByRole('heading', { level: 1, name });

async function signInFromLoginPage(name: string) {
  const button = await screen.findByRole('button', {
    name: new RegExp(`^Sign in as ${name} \\(`),
  });
  act(() => button.click());
  await portalHome(name);
}

async function shortcutNames(): Promise<string[]> {
  const main = await screen.findByRole('main');
  const shortcuts = await within(main).findByRole('list', {
    name: 'Applications',
  });
  return within(shortcuts)
    .getAllByRole('link')
    .map(
      (card) =>
        [...card.querySelectorAll('span')]
          .map((span) => span.textContent)
          .find(Boolean) ?? '',
    );
}

function navAppNames(): string[] {
  const nav = screen.getByRole('navigation', { name: 'Main' });
  const apps = within(nav).getByRole('list', { name: 'Applications' });
  return within(apps)
    .getAllByRole('link')
    .map((link) => link.textContent?.trim() ?? '');
}

function signOutFromMenu() {
  act(() => screen.getByRole('button', { name: /^Account menu, / }).click());
  act(() => screen.getByRole('button', { name: 'Sign out' }).click());
}

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  // The simulated backends keep their data here; start each test fresh.
  localStorage.clear();
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
    expect(await portalHome('User 1')).toBeDefined();
  });
});

describe('application visibility per role', () => {
  it.each([
    [
      'Admin User',
      ['Sales Hub', 'Projects & Delivery', 'People & HR', 'Admin Console'],
    ],
    ['User 1', ['Sales Hub', 'Projects & Delivery']],
    ['User 2', ['Projects & Delivery', 'People & HR']],
    ['User 3', ['People & HR']],
  ])('%s sees shortcuts and nav links for %j only', async (name, expected) => {
    renderSignedInAt(name, '/');

    expect(await shortcutNames()).toEqual(expected);
    expect(navAppNames()).toEqual(
      expected.filter((app) => app !== 'Admin Console'),
    );
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(
      within(nav).queryByRole('link', { name: 'Admin Console' }) !== null,
    ).toBe(expected.includes('Admin Console'));
  });
});

describe('direct URL access', () => {
  it.each([
    ['User 3', '/sales', 'Sales Hub'],
    ['User 1', '/people', 'People & HR'],
    ['User 2', '/admin', 'Admin Console'],
    ['User 3', '/sales/opportunities/OP-1043', 'Sales Hub'],
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

  it('loads the Sales Hub remote and passes it the host props', async () => {
    renderSignedInAt('User 1', '/sales');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Remote stub' }),
    ).toBeDefined();
    expect(
      screen.getByText('user=User 1 basePath=/sales platformUser=User 1'),
    ).toBeDefined();
  });

  it('loads the Projects & Delivery remote on its own pages too', async () => {
    renderSignedInAt('User 2', '/projects/PRJ-221');
    expect(
      await screen.findByText(
        'user=User 2 basePath=/projects platformUser=User 2',
      ),
    ).toBeDefined();
  });

  it('mounts People & HR (Angular) through the mount contract and unmounts it on leave', async () => {
    renderSignedInAt('User 3', '/people');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Mount stub' }),
    ).toBeDefined();
    expect(
      screen.getByText('user=User 3 basePath=/people platformUser=User 3'),
    ).toBeDefined();
    expect(mountStub.live).toBe(1);

    act(() => screen.getByRole('link', { name: 'Home' }).click());

    await portalHome('User 3');
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
      renderSignedInAt('User 3', '/people');
      expect(
        await screen.findByText('People & HR is not available right now.'),
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
    await portalHome('User 3');
    const popstate = vi.fn();
    window.addEventListener('popstate', popstate);

    const nav = screen.getByRole('navigation', { name: 'Main' });
    act(() => within(nav).getByRole('link', { name: 'People & HR' }).click());

    await vi.waitFor(() => expect(popstate).toHaveBeenCalledTimes(1));
    window.removeEventListener('popstate', popstate);
  });
});

describe('shell ↔ MFE communication', () => {
  it('shell → MFE: the remote gets a platform for the signed-in user', async () => {
    renderSignedInAt('User 1', '/sales');
    expect(await screen.findByText('canExport=false')).toBeDefined();
    cleanup();
    sessionStorage.clear();

    renderSignedInAt('Admin User', '/sales');
    expect(await screen.findByText('canExport=true')).toBeDefined();
  });

  it('MFE → shell: a toast requested by the remote is shown by the shell', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    renderSignedInAt('User 1', '/sales');
    const button = await screen.findByRole('button', {
      name: 'Notify the portal',
    });

    act(() => button.click());

    // The toast region belongs to the shell's layout, not to the remote.
    const toasts = screen.getByRole('status');
    expect(within(toasts).getByText('Hello from /sales')).toBeDefined();
  });

  it('central sign-out removes the open remote', async () => {
    renderSignedInAt('User 1', '/sales');
    await screen.findByRole('heading', { level: 1, name: 'Remote stub' });

    signOutFromMenu();

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
    renderAt('/projects');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sign in' }),
    ).toBeDefined();
  });

  it('signs out back to the login page and the portal stays protected', async () => {
    renderSignedInAt('User 2', '/');
    await portalHome('User 2');

    signOutFromMenu();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sign in' }),
    ).toBeDefined();
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();

    cleanup();
    renderAt('/projects');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sign in' }),
    ).toBeDefined();
  });
});

describe('Portal Home dashboard', () => {
  it.each([
    [
      'Admin User',
      [
        'Sales pipeline',
        'Active projects',
        'Total employees',
        'Pending approvals',
      ],
    ],
    [
      'User 1',
      [
        'Sales pipeline',
        'Active projects',
        'Won deals',
        'Projects needing attention',
      ],
    ],
    ['User 3', ['Total employees', 'On leave today', 'My open tasks']],
  ])(
    'shows %s only figures from apps they may open: %j',
    async (name, labels) => {
      renderSignedInAt(name, '/');
      const figures = await screen.findByRole('list', { name: 'Key figures' });
      await vi.waitFor(() =>
        expect(within(figures).getAllByRole('link')).toHaveLength(
          labels.length,
        ),
      );
      for (const label of labels) {
        expect(within(figures).getByText(label)).toBeDefined();
      }
    },
  );

  it('shows the sales funnel and project health only to users with those apps', async () => {
    renderSignedInAt('Admin User', '/');
    expect(
      await screen.findByRole('img', { name: /^Sales funnel: Lead 124/ }),
    ).toBeDefined();
    expect(screen.getByRole('img', { name: /^Project health:/ })).toBeDefined();
    cleanup();

    renderSignedInAt('User 3', '/');
    await screen.findByRole('heading', { name: 'Workforce today' });
    expect(screen.queryByRole('img', { name: /^Sales funnel/ })).toBeNull();
    expect(
      screen.queryByRole('heading', { name: 'Recent activity' }),
    ).not.toBeNull();
    expect(screen.queryByText(/Proposal v2 uploaded/)).toBeNull();
  });

  it("lists the open tasks of the user's team", async () => {
    renderSignedInAt('User 2', '/');
    const tasks = await screen.findByRole('region', { name: 'My tasks' });
    expect(
      await within(tasks).findByRole('link', {
        name: 'Technical evaluation: Trident Bank fraud risk RFP',
      }),
    ).toBeDefined();
  });

  it('offers leave approvals as a task to users who may approve', async () => {
    renderSignedInAt('Admin User', '/');
    const tasks = await screen.findByRole('region', { name: 'My tasks' });
    expect(
      await within(tasks).findByRole('link', {
        name: 'Approve leave requests (7 pending)',
      }),
    ).toBeDefined();
  });
});

describe('notifications (bell, Notifications page)', () => {
  it('shows the unread count for the user’s role', async () => {
    renderSignedInAt('Admin User', '/');
    expect(
      await screen.findByRole('button', { name: 'Notifications, 4 new' }),
    ).toBeDefined();
  });

  it('opens the bell panel and goes to the related record on click', async () => {
    renderSignedInAt('User 2', '/');
    act(() =>
      screen.getByRole('button', { name: /^Notifications, \d+ new$/ }).click(),
    );
    const panel = await screen.findByRole('dialog', { name: 'Notifications' });
    const item = await within(panel).findByRole('button', {
      name: /Project PRJ-209 is delayed/,
    });

    // The remote suspends while it loads, so wait for act to finish.
    await act(async () => item.click());

    // The Projects remote (stub) opens on the project's page.
    expect(
      await screen.findByText(
        'user=User 2 basePath=/projects platformUser=User 2',
      ),
    ).toBeDefined();
  });

  it('marks everything read from the Notifications page', async () => {
    renderSignedInAt('User 1', '/notifications');
    await screen.findByRole('heading', { level: 1, name: 'Notifications' });
    expect(
      await screen.findByRole('button', { name: 'Notifications, 2 new' }),
    ).toBeDefined();

    act(() => screen.getByRole('button', { name: 'Mark all as read' }).click());

    expect(
      await screen.findByRole('button', { name: 'Notifications, 0 new' }),
    ).toBeDefined();
  });
});

describe('My Tasks page', () => {
  it("lists the open tasks of the user's team with links into the apps", async () => {
    renderSignedInAt('User 1', '/my-tasks');
    const link = await screen.findByRole('link', {
      name: 'Review RFP for ABC Bank',
    });
    expect(link.getAttribute('href')).toBe('/sales/opportunities/OP-1043');
    expect(
      screen.queryByRole('link', { name: /Trident Bank fraud risk RFP/ }),
    ).toBeNull();
  });
});
