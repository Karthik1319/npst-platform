import { describe, expect, it } from 'vitest';
import { DEMO_PASSWORD, mockAuth } from './mock-auth';

describe('mockAuth', () => {
  it("offers the Admin Portal's seeded users", () => {
    expect(mockAuth.users.map((user) => user.email)).toEqual([
      'admin@npst.com',
      'priya.nair@npst.com',
      'rohit.kulkarni@npst.com',
      'sneha.iyer@npst.com',
      'vikram.desai@npst.com',
      'arjun.rao@npst.com',
      'neha.kapoor@npst.com',
      'karan.malhotra@npst.com',
    ]);
  });

  it.each([
    ['admin@npst.com', 'Super Admin'],
    ['priya.nair@npst.com', 'Admin'],
    ['Rohit.Kulkarni@npst.com ', 'Application Admin'],
    ['arjun.rao@npst.com', 'Employee'],
  ])('signs in %s (%s) with the one demo password', async (email, role) => {
    const user = await mockAuth.signIn(email, DEMO_PASSWORD);
    expect(user.roles[0]).toBe(role);
  });

  it('rejects a wrong password or an unknown email with the same message', async () => {
    await expect(mockAuth.signIn('admin@npst.com', 'wrong')).rejects.toThrow(
      'Invalid email or password',
    );
    await expect(
      mockAuth.signIn('nobody@npst.com', DEMO_PASSWORD),
    ).rejects.toThrow('Invalid email or password');
  });

  it('rejects an inactive user', async () => {
    await expect(
      mockAuth.signIn('karan.malhotra@npst.com', DEMO_PASSWORD),
    ).rejects.toThrow('inactive');
  });
});
