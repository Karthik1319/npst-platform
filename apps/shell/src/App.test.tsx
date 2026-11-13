import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '@/App';

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe('App', () => {
  it('shows Portal Home with one launcher tile per app', () => {
    renderAt('/');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Portal Home' }),
    ).toBeDefined();
    const launcher = screen.getByRole('list', { name: 'Applications' });
    expect(within(launcher).getAllByRole('link')).toHaveLength(3);
  });

  it('shows the placeholder page on an app route', () => {
    renderAt('/react-a');
    expect(
      screen.getByRole('heading', { level: 1, name: 'React A' }),
    ).toBeDefined();
  });

  it('shows the not-found page on an unknown route', () => {
    renderAt('/does-not-exist');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeDefined();
  });
});
