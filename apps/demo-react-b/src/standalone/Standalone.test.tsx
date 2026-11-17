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
  it('starts as Priya Nair, not Admin (least privilege)', () => {
    window.history.replaceState(null, '', '/');
    render(<Standalone search="" />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Dashboard' }),
    ).toBeDefined();
    expect(currentUser()).toBe('Priya Nair');
  });

  it('denies ?user=user-7 like the shell does', () => {
    render(<Standalone search="?user=user-7" />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Access denied' }),
    ).toBeDefined();
    expect(
      screen.getByText(
        'Neha Kapoor (Employee, EMPLOYEE) does not have permission to open Projects & Delivery.',
      ),
    ).toBeDefined();
    expect(
      screen.queryByRole('navigation', { name: 'Projects & Delivery' }),
    ).toBeNull();
  });

  it.each([
    ['user-2', 'Priya Nair'],
    ['user-3', 'Rohit Kulkarni'],
    ['user-1', 'Aarav Mehta'],
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
