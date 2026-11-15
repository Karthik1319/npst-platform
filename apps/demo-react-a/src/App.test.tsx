import { createMockPlatform, mockAuth } from '@npst/platform-mocks';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/App';

afterEach(cleanup);

function renderApp(userId = 'u-1') {
  const user = mockAuth.findUser(userId);
  if (!user) throw new Error('mock user missing');
  const platform = createMockPlatform({ user });
  render(<App user={user} basePath="/react-a" platform={platform} />);
  return { platform };
}

/** Collects the toasts the app asks the platform (the shell) to show. */
function collectToasts(platform: ReturnType<typeof createMockPlatform>) {
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  const toasts: string[] = [];
  const stop = platform.toasts.subscribe((toast) => toasts.push(toast.message));
  return { toasts, stop };
}

describe('React A', () => {
  it('shows the user and base path it receives from the host (shell → MFE)', () => {
    renderApp();
    expect(screen.getByText('User 1 (SALES)')).toBeDefined();
    expect(screen.getByText('/react-a')).toBeDefined();
  });

  it('asks the platform to show a notification (MFE → shell)', () => {
    const { platform } = renderApp();
    const { toasts, stop } = collectToasts(platform);
    const button = screen.getByRole('button', { name: 'Send a notification' });

    act(() => button.click());
    act(() => button.click());

    expect(toasts).toEqual([
      'Hello from React A (#1)',
      'Hello from React A (#2)',
    ]);
    stop();
  });

  it('hides Export report without export:react-a (User 1)', () => {
    renderApp('u-1');
    expect(screen.queryByRole('button', { name: 'Export report' })).toBeNull();
    expect(screen.getByText(/Export is hidden/)).toBeDefined();
  });

  it('shows Export report with export:react-a (Admin) and toasts on click', () => {
    const { platform } = renderApp('u-admin');
    const { toasts, stop } = collectToasts(platform);

    act(() => screen.getByRole('button', { name: 'Export report' }).click());

    expect(toasts).toEqual(['Export started (demo).']);
    stop();
  });
});
