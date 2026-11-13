import { createMockPlatform, mockAuth } from '@npst/platform-mocks';
import { createEventBus } from '@npst/shared-contracts';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '@/App';

afterEach(cleanup);

function renderApp() {
  const user = mockAuth.findUser('u-1');
  if (!user) throw new Error('mock user missing');
  const platform = createMockPlatform({ user });
  render(
    <App
      user={platform.user}
      basePath="/react-a"
      bus={createEventBus()}
      platform={platform}
    />,
  );
}

describe('React A', () => {
  it('shows the user and base path it receives from the host', () => {
    renderApp();
    expect(screen.getByText('User 1 (SALES)')).toBeDefined();
    expect(screen.getByText('/react-a')).toBeDefined();
  });

  it('uses React state (hooks work)', () => {
    renderApp();
    const button = screen.getByRole('button', { name: 'Clicked 0 times' });
    act(() => button.click());
    expect(
      screen.getByRole('button', { name: 'Clicked 1 time' }),
    ).toBeDefined();
  });
});
