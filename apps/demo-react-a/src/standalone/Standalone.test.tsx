import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
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
      screen.getByText(`${who} does not have permission to open React A.`),
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
