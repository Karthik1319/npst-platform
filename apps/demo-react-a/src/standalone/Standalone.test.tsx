import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Standalone } from '@/standalone/Standalone';

beforeEach(() => window.history.replaceState(null, '', '/'));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

const currentUser = () =>
  screen
    .getByRole('list', { name: 'Switch mock user' })
    .querySelector('[aria-current="true"]')?.textContent;

describe('standalone mode (development only)', () => {
  it('starts as User 1, not Admin (least privilege)', () => {
    render(<Standalone search="" />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Dashboard' }),
    ).toBeDefined();
    expect(currentUser()).toBe('User 1');
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
    expect(screen.queryByRole('navigation', { name: 'Sales Hub' })).toBeNull();
  });

  it.each([
    ['u-1', 'User 1'],
    ['u-admin', 'Admin User'],
  ])('opens Sales Hub for ?user=%s', (userId, who) => {
    render(<Standalone search={`?user=${userId}`} />);
    expect(screen.getByRole('navigation', { name: 'Sales Hub' })).toBeDefined();
    expect(currentUser()).toBe(who);
  });

  it('shows toasts itself (no shell in standalone mode)', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    window.history.replaceState(null, '', '/tasks');
    render(<Standalone search="?user=u-1" />);
    const [button] = await screen.findAllByRole('button', {
      name: 'Mark done',
    });

    await act(async () => button?.click());

    expect(await screen.findByText(/^Follow-up done: /)).toBeDefined();
  });

  it('rejects an unknown mock user', () => {
    render(<Standalone search="?user=nobody" />);
    expect(screen.getByRole('alert').textContent).toContain(
      'Unknown mock user',
    );
    expect(screen.queryByRole('navigation', { name: 'Sales Hub' })).toBeNull();
  });
});
