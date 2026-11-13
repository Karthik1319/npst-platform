import { act, cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '@/App';
import { SESSION_STORAGE_KEY } from '@/services/auth';
import { SessionProvider } from '@/session/SessionContext';

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

  it('opens an allowed app', async () => {
    renderSignedInAt('User 3', '/angular');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Angular' }),
    ).toBeDefined();
  });

  it('shows Page not found for a path that is not an app', async () => {
    renderSignedInAt('Admin User', '/does-not-exist');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeDefined();
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
