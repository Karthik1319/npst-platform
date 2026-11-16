import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadWithRetry, RemoteTimeoutError } from '@/remotes/load-with-retry';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const options = { timeoutMs: 100, retries: 1, retryDelayMs: 50 };

describe('loadWithRetry', () => {
  it('returns the remote when the first attempt works', async () => {
    const load = vi.fn(async () => 'remote');
    await expect(loadWithRetry(load, options)).resolves.toBe('remote');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('retries once after a failure and then succeeds', async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce('remote');
    const onRetry = vi.fn();

    const result = loadWithRetry(load, { ...options, onRetry });
    await vi.advanceTimersByTimeAsync(50);

    await expect(result).resolves.toBe('remote');
    expect(load).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
  });

  it('gives up after one retry', async () => {
    const load = vi.fn(async () => {
      throw new Error('Failed to fetch');
    });

    const result = loadWithRetry(load, options);
    const assertion = expect(result).rejects.toThrow('Failed to fetch');
    await vi.advanceTimersByTimeAsync(50);

    await assertion;
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('treats a remote that never answers as failed after the timeout', async () => {
    const load = vi.fn(() => new Promise<string>(() => {}));

    const result = loadWithRetry(load, options);
    const assertion = expect(result).rejects.toBeInstanceOf(RemoteTimeoutError);
    // attempt 1 times out (100) + pause (50) + attempt 2 times out (100)
    await vi.advanceTimersByTimeAsync(250);

    await assertion;
    expect(load).toHaveBeenCalledTimes(2);
  });
});
