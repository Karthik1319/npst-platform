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
  it('starts as Priya Nair, not Admin (least privilege)', () => {
    render(<Standalone search="" />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Dashboard' }),
    ).toBeDefined();
    expect(currentUser()).toBe('Priya Nair');
  });

  it.each([
    ['user-3', 'Rohit Kulkarni (Application Admin, SOLUTIONS)'],
    ['user-7', 'Neha Kapoor (Employee, EMPLOYEE)'],
  ])('denies ?user=%s like the shell does', (userId, who) => {
    render(<Standalone search={`?user=${userId}`} />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Access denied' }),
    ).toBeDefined();
    expect(
      screen.getByText(`${who} does not have permission to open Deal Pulse.`),
    ).toBeDefined();
    expect(screen.queryByRole('navigation', { name: 'Deal Pulse' })).toBeNull();
  });

  it.each([
    ['user-2', 'Priya Nair'],
    ['user-1', 'Aarav Mehta'],
  ])('opens Deal Pulse for ?user=%s', (userId, who) => {
    render(<Standalone search={`?user=${userId}`} />);
    expect(
      screen.getByRole('navigation', { name: 'Deal Pulse' }),
    ).toBeDefined();
    expect(currentUser()).toBe(who);
  });

  it('shows toasts itself (no shell in standalone mode)', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    window.history.replaceState(null, '', '/tasks');
    render(<Standalone search="?user=user-2" />);
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
    expect(screen.queryByRole('navigation', { name: 'Deal Pulse' })).toBeNull();
  });
});
