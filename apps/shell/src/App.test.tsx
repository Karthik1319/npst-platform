import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/App';
import { Toaster } from '@/components/Toaster';
import { AuthProvider } from '@/context/AuthContext';
import { userService } from '@/services/adminService';
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

/** The Admin Portal's seeded users (one demo password for all). */
const USERS = {
  superAdmin: {
    id: 'user-1',
    name: 'Aarav Mehta',
    email: 'admin@npst.com',
    role: 'Super Admin',
  },
  admin: {
    id: 'user-2',
    name: 'Priya Nair',
    email: 'priya.nair@npst.com',
    role: 'Admin',
  },
  appAdmin: {
    id: 'user-3',
    name: 'Rohit Kulkarni',
    email: 'rohit.kulkarni@npst.com',
    role: 'Application Admin',
  },
  employee: {
    id: 'user-7',
    name: 'Neha Kapoor',
    email: 'neha.kapoor@npst.com',
    role: 'Employee',
  },
} as const;
type Who = keyof typeof USERS;

const SLOW = { timeout: 3000 }; // the login form waits ~1 s, like the original

function renderAt(path: string) {
  // A fresh cache per test, like a fresh page load.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={[path]}>
            <App />
          </MemoryRouter>
        </AuthProvider>
      </SessionProvider>
      <Toaster />
    </QueryClientProvider>,
  );
}

/** Starts the portal as if the user had signed in earlier (in this or another tab). */
function renderSignedInAt(who: Who, path: string) {
  localStorage.setItem(SESSION_STORAGE_KEY, USERS[who].id);
  renderAt(path);
}

/** What the browser tells this tab when another tab changes the session. */
function sessionChangedInAnotherTab(newUserId: string | null) {
  if (newUserId) localStorage.setItem(SESSION_STORAGE_KEY, newUserId);
  else localStorage.removeItem(SESSION_STORAGE_KEY);
  act(() => {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: SESSION_STORAGE_KEY,
        newValue: newUserId,
      }),
    );
  });
}

const loginPage = () =>
  screen.findByRole('heading', { name: 'Portal Sign In' }, SLOW);
const dashboard = () =>
  screen.findByRole('heading', { level: 1, name: 'Dashboard' }, SLOW);

async function signInWithForm(email: string, password = 'Admin@123') {
  await loginPage();
  fireEvent.change(screen.getByLabelText('Email address'), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: password },
  });
  fireEvent.click(screen.getByTestId('login-submit-button'));
}

function sidebar() {
  return screen.getByTestId('sidebar-nav');
}

/** Section titles and link names of the sidebar, as the user sees them. */
function sidebarSections(): string[] {
  return [...sidebar().children].map(
    (section) => section.querySelector('p')?.textContent ?? '',
  );
}

function applicationLinks(): string[] {
  const section = [...sidebar().children].find(
    (s) => s.querySelector('p')?.textContent === 'Applications',
  );
  return section
    ? within(section as HTMLElement)
        .getAllByRole('link')
        .map((link) => link.textContent?.trim() ?? '')
    : [];
}

function signOutFromMenu() {
  act(() => screen.getByTestId('topbar-profile-button').click());
  act(() => screen.getByRole('menuitem', { name: 'Sign out' }).click());
}

afterEach(() => {
  cleanup();
  // The mock session and the simulated backends keep their data here; start each test fresh.
  localStorage.clear();
  sessionStorage.clear();
});

describe('login page (the only login, central session)', () => {
  it('is shown first, without a logo', async () => {
    renderAt('/');
    expect(await loginPage()).toBeDefined();
    expect(screen.getAllByText('NPST Shared Services').length).toBeGreaterThan(
      0,
    );
    // Intentional: no logo or other image on the login page.
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it.each(Object.keys(USERS) as Who[])(
    'signs in the %s with the one demo password',
    async (who) => {
      const user = USERS[who];
      renderAt('/login');
      await signInWithForm(user.email);

      const profile = await screen.findByTestId(
        'topbar-profile-button',
        {},
        SLOW,
      );
      expect(within(profile).getByText(user.name)).toBeDefined();
      expect(within(profile).getByText(user.role)).toBeDefined();
      // The central session (shared by every tab) now holds the user.
      expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBe(user.id);
    },
  );

  it('rejects a wrong password', async () => {
    renderAt('/login');
    await signInWithForm('admin@npst.com', 'Wrong@123');
    expect((await screen.findByRole('alert', {}, SLOW)).textContent).toContain(
      'Invalid email or password',
    );
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('rejects an inactive account', async () => {
    renderAt('/login');
    await signInWithForm('karan.malhotra@npst.com');
    expect((await screen.findByRole('alert', {}, SLOW)).textContent).toContain(
      'inactive',
    );
  });

  it('sends a signed-in user from /login to the portal', async () => {
    renderSignedInAt('superAdmin', '/login');
    expect(await dashboard()).toBeDefined();
  });
});

describe('navigation per role (RBAC, UI only)', () => {
  const allApps = [
    'Keka HR',
    'Deal Pulse',
    'SkillUp Lounge',
    'NPST Finance',
    'Projects & Delivery',
  ];

  it.each([
    [
      'superAdmin',
      [
        'Application Management',
        'Shared Services',
        'Administration',
        'Applications',
      ],
      allApps,
    ],
    [
      'admin',
      [
        'Application Management',
        'Shared Services',
        'Administration',
        'Applications',
      ],
      allApps,
    ],
    [
      'appAdmin',
      ['Shared Services', 'Applications'],
      ['Keka HR', 'Projects & Delivery'],
    ],
    ['employee', ['Applications'], ['Keka HR']],
  ] as const)(
    '%s sees sections %j and applications %j',
    async (who, sections, apps) => {
      renderSignedInAt(who, who === 'employee' ? '/keka' : '/');
      await screen.findByTestId('sidebar-nav');
      await vi.waitFor(() => expect(applicationLinks()).toEqual(apps));
      expect(sidebarSections()).toEqual(sections);
    },
  );

  it('only the Super Admin sees Settings', async () => {
    renderSignedInAt('admin', '/');
    await dashboard();
    expect(
      within(sidebar()).queryByRole('link', { name: 'Settings' }),
    ).toBeNull();
    expect(
      within(sidebar()).getByRole('link', { name: 'Employee Management' }),
    ).toBeDefined();
  });

  it('starts an employee in their first application', async () => {
    renderSignedInAt('employee', '/');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Mount stub' }),
    ).toBeDefined();
  });

  it.each([
    ['employee', '/settings', 'You do not have permission to open this page.'],
    ['appAdmin', '/users', 'You do not have permission to open this page.'],
    [
      'employee',
      '/deal-pulse',
      'You do not have permission to open Deal Pulse.',
    ],
    [
      'employee',
      '/deal-pulse/opportunities/OP-1043',
      'You do not have permission to open Deal Pulse.',
    ],
  ] as const)(
    '%s opening %s gets Access denied',
    async (who, path, message) => {
      renderSignedInAt(who, path);
      expect(await screen.findByText('Access denied')).toBeDefined();
      expect(screen.getByText(message)).toBeDefined();
      expect(
        screen.queryByRole('heading', { level: 1, name: 'Remote stub' }),
      ).toBeNull();
    },
  );

  it('sends an unknown path back to the start page', async () => {
    renderSignedInAt('superAdmin', '/does-not-exist');
    expect(await dashboard()).toBeDefined();
  });
});

describe('applications (MFEs)', () => {
  it('loads Deal Pulse (React, Module Federation) and passes it the host props', async () => {
    renderSignedInAt('admin', '/deal-pulse');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Remote stub' }),
    ).toBeDefined();
    expect(
      screen.getByText(
        'user=Priya Nair basePath=/deal-pulse platformUser=Priya Nair',
      ),
    ).toBeDefined();
  });

  it('loads Projects & Delivery on its own pages too', async () => {
    renderSignedInAt('appAdmin', '/projects/PRJ-221');
    expect(
      await screen.findByText(
        'user=Rohit Kulkarni basePath=/projects platformUser=Rohit Kulkarni',
      ),
    ).toBeDefined();
  });

  it('mounts Keka HR (Angular) through the mount contract and unmounts it on leave', async () => {
    renderSignedInAt('superAdmin', '/keka');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Mount stub' }),
    ).toBeDefined();
    expect(
      screen.getByText(
        'user=Aarav Mehta basePath=/keka platformUser=Aarav Mehta',
      ),
    ).toBeDefined();
    expect(mountStub.live).toBe(1);

    act(() =>
      within(sidebar()).getByRole('link', { name: 'Dashboard' }).click(),
    );

    await dashboard();
    await vi.waitFor(() => expect(mountStub.live).toBe(0));
    expect(screen.queryByRole('heading', { name: 'Mount stub' })).toBeNull();
  });

  it('shows a placeholder for a registered application without a frontend yet', async () => {
    renderSignedInAt('superAdmin', '/skillup');
    expect(
      await screen.findByText('SkillUp Lounge is not connected yet'),
    ).toBeDefined();
  });

  it('shows the application in the breadcrumb', async () => {
    renderSignedInAt('admin', '/deal-pulse/leads');
    await screen.findByRole('heading', { level: 1, name: 'Remote stub' });
    const crumbs = screen.getByTestId('breadcrumb-nav');
    expect(crumbs.textContent).toBe('ApplicationsDeal Pulse');
  });

  it('retries once, then shows a fallback with Try again that reloads the remote', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    esmRemote.down = true;
    esmRemote.loads = 0;
    try {
      renderSignedInAt('employee', '/keka');
      expect(
        await screen.findByText('Keka HR is not available right now.'),
      ).toBeDefined();
      expect(esmRemote.loads).toBe(2); // first attempt + one automatic retry
      // The rest of the portal keeps working.
      expect(screen.getByTestId('sidebar-nav')).toBeDefined();

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
    renderSignedInAt('superAdmin', '/');
    await dashboard();
    const popstate = vi.fn();
    window.addEventListener('popstate', popstate);

    await vi.waitFor(() => expect(applicationLinks()).toContain('Keka HR'));
    act(() => within(sidebar()).getByRole('link', { name: 'Keka HR' }).click());

    await vi.waitFor(() => expect(popstate).toHaveBeenCalledTimes(1));
    window.removeEventListener('popstate', popstate);
  });
});

describe('shell ↔ MFE communication', () => {
  it('shell → MFE: the remote gets a platform for the signed-in user', async () => {
    renderSignedInAt('admin', '/deal-pulse');
    expect(await screen.findByText('canExport=false')).toBeDefined();
    cleanup();

    renderSignedInAt('superAdmin', '/deal-pulse');
    expect(await screen.findByText('canExport=true')).toBeDefined();
  });

  it("MFE → shell: a toast requested by the remote is shown by the portal's toaster", async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    renderSignedInAt('admin', '/deal-pulse');
    const button = await screen.findByRole('button', {
      name: 'Notify the portal',
    });

    act(() => button.click());

    const toaster = screen.getByRole('region', { name: 'Notifications' });
    expect(within(toaster).getByText('Hello from /deal-pulse')).toBeDefined();
  });

  it("the bell shows the platform inbox, including the applications' messages", async () => {
    renderSignedInAt('superAdmin', '/');
    await dashboard();
    act(() => screen.getByTestId('topbar-notifications-button').click());
    expect(
      await screen.findByText('Solution proposal review due for ABC Bank'),
    ).toBeDefined();
  });

  it('central sign-out removes the open remote', async () => {
    renderSignedInAt('admin', '/deal-pulse');
    await screen.findByRole('heading', { level: 1, name: 'Remote stub' });

    signOutFromMenu();

    expect(await loginPage()).toBeDefined();
    expect(
      screen.queryByRole('heading', { level: 1, name: 'Remote stub' }),
    ).toBeNull();
  });
});

describe('sign-out and protected routes', () => {
  it('redirects to the login page when not signed in', async () => {
    renderAt('/projects');
    expect(await loginPage()).toBeDefined();
  });

  it('signs out back to the login page and the portal stays protected', async () => {
    renderSignedInAt('superAdmin', '/');
    await dashboard();

    signOutFromMenu();

    expect(await loginPage()).toBeDefined();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();

    cleanup();
    renderAt('/settings');
    expect(await loginPage()).toBeDefined();
  });
});

describe('one session for the portal, every app and every tab', () => {
  it('a new tab is already signed in', async () => {
    // Signed in once (e.g. in the first tab); a second tab opens directly in an app.
    renderSignedInAt('appAdmin', '/projects');
    expect(
      await screen.findByText(
        'user=Rohit Kulkarni basePath=/projects platformUser=Rohit Kulkarni',
      ),
    ).toBeDefined();
    expect(
      screen.queryByRole('heading', { name: 'Portal Sign In' }),
    ).toBeNull();
  });

  it('signing out in another tab signs this tab out of the portal and its apps', async () => {
    renderSignedInAt('admin', '/deal-pulse');
    await screen.findByRole('heading', { level: 1, name: 'Remote stub' });

    sessionChangedInAnotherTab(null);

    expect(await loginPage()).toBeDefined();
    expect(
      screen.queryByRole('heading', { level: 1, name: 'Remote stub' }),
    ).toBeNull();
  });

  it('signing in as someone else in another tab switches this tab too', async () => {
    renderSignedInAt('superAdmin', '/');
    await dashboard();

    sessionChangedInAnotherTab(USERS.employee.id);

    const profile = await screen.findByTestId('topbar-profile-button');
    await vi.waitFor(() =>
      expect(within(profile).getByText('Neha Kapoor')).toBeDefined(),
    );
  });
});

describe('Shared Services pages (Step 20)', () => {
  it.each([
    ['/branding', 'UI Branding Management'],
    ['/branding/history', 'Branding Version History'],
    ['/notifications/templates', 'Notification Templates'],
    ['/notifications/channels', 'Notification Channels'],
  ])('an Application Admin opens %s', async (path, title) => {
    renderSignedInAt('appAdmin', path);
    expect(
      await screen.findByRole('heading', { level: 1, name: title }),
    ).toBeDefined();
  });

  it('opens the branding editor for an application', async () => {
    renderSignedInAt('superAdmin', '/branding/configure/app-keka');
    expect(
      (await screen.findByTestId('branding-editor-title')).textContent,
    ).toContain('Keka HR');
    expect(
      screen.getAllByTestId('branding-live-preview').length,
    ).toBeGreaterThan(0);
  });

  it('redirects /notifications to the templates', async () => {
    renderSignedInAt('admin', '/notifications');
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Notification Templates',
      }),
    ).toBeDefined();
  });

  it.each(['/branding', '/notifications/templates'])(
    'an Employee opening %s gets Access denied',
    async (path) => {
      renderSignedInAt('employee', path);
      expect(await screen.findByText('Access denied')).toBeDefined();
    },
  );
});

describe('Shared Services pages (Step 21)', () => {
  it.each([
    ['appAdmin', '/reminders', 'Reminder Management'],
    ['appAdmin', '/reminders/escalations', 'Escalation Management'],
    ['admin', '/users', 'Employee Management'],
    ['admin', '/audit-logs', 'Audit Logs'],
  ] as const)('%s opens %s', async (who, path, title) => {
    renderSignedInAt(who, path);
    expect(
      await screen.findByRole('heading', { level: 1, name: title }),
    ).toBeDefined();
  });

  it('draws the reminder charts in-house', async () => {
    renderSignedInAt('superAdmin', '/reminders');
    await screen.findByRole('heading', {
      level: 1,
      name: 'Reminder Management',
    });
    // jsdom has no layout, so only the legend is checked here (geometry: geometry.test.ts).
    expect(
      screen.getByText('Completed', { selector: 'li span' }),
    ).toBeDefined();
  });

  it.each(['/reminders', '/users', '/audit-logs'])(
    'an Employee opening %s gets Access denied',
    async (path) => {
      renderSignedInAt('employee', path);
      expect(await screen.findByText('Access denied')).toBeDefined();
    },
  );
});

describe('Employee Management drives sign-in and access (mock RBAC and Provisioning)', () => {
  it('a user deactivated in Employee Management cannot sign in', async () => {
    userService.update('user-6', { status: 'inactive' });
    renderAt('/login');
    await signInWithForm('arjun.rao@npst.com');
    expect((await screen.findByRole('alert', {}, SLOW)).textContent).toContain(
      'inactive',
    );
  });

  it('applications assigned in Employee Management appear after sign-in', async () => {
    userService.update(USERS.employee.id, {
      apps: ['app-keka', 'app-finance'],
    });
    renderSignedInAt('employee', '/keka');
    await screen.findByTestId('sidebar-nav');
    await vi.waitFor(() =>
      expect(applicationLinks()).toEqual(['Keka HR', 'NPST Finance']),
    );
  });
});

describe('published themes (Step 23)', () => {
  it('renders an application inside its own theme area, so its published branding stays inside it', async () => {
    renderSignedInAt('admin', '/deal-pulse');
    const remote = await screen.findByRole('heading', {
      level: 1,
      name: 'Remote stub',
    });
    expect(
      remote.closest('[data-app-theme]')?.getAttribute('data-app-theme'),
    ).toBe('app-dealpulse');
  });
});
