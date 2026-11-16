/** How long one attempt to load a remote may take before it counts as failed. */
export const REMOTE_TIMEOUT_MS = 8000;
/** Automatic retries after a failed attempt (so at most 2 attempts in total). */
export const REMOTE_RETRIES = 1;
/** Pause before the automatic retry, e.g. while a remote server restarts. */
export const REMOTE_RETRY_DELAY_MS = 1000;

export interface RetryOptions {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  /** Called before each automatic retry (used for logging). */
  onRetry?: (error: unknown, attempt: number) => void;
}

export class RemoteTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Remote did not load within ${timeoutMs} ms`);
    this.name = 'RemoteTimeoutError';
  }
}

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new RemoteTimeoutError(timeoutMs)),
      timeoutMs,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Loads a remote with a time limit and one automatic retry, so a slow or
 * briefly unavailable remote does not leave the page waiting forever.
 * Used for both remote types (Module Federation and plain ES modules).
 */
export async function loadWithRetry<T>(
  load: () => Promise<T>,
  {
    timeoutMs = REMOTE_TIMEOUT_MS,
    retries = REMOTE_RETRIES,
    retryDelayMs = REMOTE_RETRY_DELAY_MS,
    onRetry,
  }: RetryOptions = {},
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await withTimeout(load(), timeoutMs);
    } catch (error) {
      if (attempt >= retries) throw error;
      onRetry?.(error, attempt + 1);
      await delay(retryDelayMs);
    }
  }
}
