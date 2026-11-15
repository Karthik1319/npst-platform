import { createMockPlatform, mockAuth } from '@npst/platform-mocks';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/App';

afterEach(cleanup);

function renderApp(userId = 'u-2') {
  const user = mockAuth.findUser(userId);
  if (!user) throw new Error('mock user missing');
  const platform = createMockPlatform({ user });
  render(<App user={user} basePath="/react-b" platform={platform} />);
  return { platform };
}

describe('React B', () => {
  it('shows the user and base path it receives from the host (shell → MFE)', () => {
    renderApp();
    expect(screen.getByText('User 2 (SOLUTIONS)')).toBeDefined();
    expect(screen.getByText('/react-b')).toBeDefined();
  });

  it('asks the platform to show a notification (MFE → shell)', () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const { platform } = renderApp();
    const toasts: string[] = [];
    const stop = platform.toasts.subscribe((toast) =>
      toasts.push(toast.message),
    );

    act(() =>
      screen.getByRole('button', { name: 'Send a notification' }).click(),
    );

    expect(toasts).toEqual(['Hello from React B (#1)']);
    stop();
  });
});
