import { describe, expect, it } from 'vitest';
import { mockAuth } from './mock-auth';

describe('mockAuth', () => {
  it('offers the four predefined users', () => {
    expect(mockAuth.users.map((user) => user.name)).toEqual([
      'Admin User',
      'User 1',
      'User 2',
      'User 3',
    ]);
  });

  it('signs in a known user without a password', async () => {
    await expect(mockAuth.signIn('u-2')).resolves.toMatchObject({
      name: 'User 2',
    });
  });

  it('rejects an unknown user', async () => {
    await expect(mockAuth.signIn('nobody')).rejects.toThrow(
      'Unknown mock user',
    );
  });
});
