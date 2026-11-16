import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Standalone } from '@/standalone/Standalone';

afterEach(cleanup);

describe('standalone mode (development only)', () => {
  it('starts as User 1, not Admin (least privilege)', () => {
    render(<Standalone search="" />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'React A' }),
    ).toBeDefined();
    expect(screen.getByText('User 1 (SALES)')).toBeDefined();
    expect(screen.queryByText(/Admin User \(ADMIN\)/)).toBeNull();
  });

  it.each([
    ['u-2', 'User 2 (SOLUTIONS)'],
    ['u-3', 'User 3 (EMPLOYEE)'],
  ])('denies ?user=%s like the shell does', (userId, who) => {
    render(<Standalone search={`?user=${userId}`} />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Access denied' }),
    ).toBeDefined();
    expect(
      screen.getByText(`${who} does not have permission to open Sales Hub.`),
    ).toBeDefined();
    expect(
      screen.queryByRole('heading', { level: 1, name: 'React A' }),
    ).toBeNull();
  });

  it.each([
    ['u-1', 'User 1 (SALES)'],
    ['u-admin', 'Admin User (ADMIN)'],
  ])('opens React A for ?user=%s', (userId, who) => {
    render(<Standalone search={`?user=${userId}`} />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'React A' }),
    ).toBeDefined();
    expect(screen.getByText(who)).toBeDefined();
  });

  it('shows toasts itself (no shell in standalone mode)', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    render(<Standalone search="?user=u-1" />);
    act(() =>
      screen.getByRole('button', { name: 'Send a notification' }).click(),
    );
    expect(await screen.findByText('Hello from React A (#1)')).toBeDefined();
  });

  it('rejects an unknown mock user', () => {
    render(<Standalone search="?user=nobody" />);
    expect(screen.getByRole('alert').textContent).toContain(
      'Unknown mock user',
    );
    expect(
      screen.queryByRole('heading', { level: 1, name: 'React A' }),
    ).toBeNull();
  });
});
