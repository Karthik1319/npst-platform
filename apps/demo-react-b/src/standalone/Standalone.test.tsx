import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Standalone } from '@/standalone/Standalone';

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
    window.history.replaceState(null, '', '/');
    render(<Standalone search="" />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Dashboard' }),
    ).toBeDefined();
    expect(currentUser()).toBe('User 1');
  });

  it('denies ?user=u-3 like the shell does', () => {
    render(<Standalone search="?user=u-3" />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Access denied' }),
    ).toBeDefined();
    expect(
      screen.getByText(
        'User 3 (EMPLOYEE) does not have permission to open Projects & Delivery.',
      ),
    ).toBeDefined();
    expect(
      screen.queryByRole('navigation', { name: 'Projects & Delivery' }),
    ).toBeNull();
  });

  it.each([
    ['u-1', 'User 1'],
    ['u-2', 'User 2'],
    ['u-admin', 'Admin User'],
  ])('opens Projects & Delivery for ?user=%s', (userId, who) => {
    render(<Standalone search={`?user=${userId}`} />);
    expect(
      screen.getByRole('navigation', { name: 'Projects & Delivery' }),
    ).toBeDefined();
    expect(currentUser()).toBe(who);
  });

  it('rejects an unknown mock user', () => {
    render(<Standalone search="?user=nobody" />);
    expect(screen.getByRole('alert').textContent).toContain(
      'Unknown mock user',
    );
  });
});
