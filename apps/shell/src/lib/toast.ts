import type { PlatformApi, Toast, ToastKind } from '@npst/shared-contracts';

/**
 * Toasts for the Admin Portal pages (in-house replacement for `sonner`, same
 * call style: `toast.success('Saved')`).
 *
 * - Signed in: every toast goes through the platform's Notification Service
 *   (`platform.notify.toast()`), exactly like toasts requested by MFEs, and
 *   the portal's toaster shows it.
 * - Not signed in (login page, right after sign-out): there is no platform
 *   object, so the toaster shows it directly.
 */
let notify: PlatformApi['notify'] | null = null;
const listeners = new Set<(toast: Toast) => void>();
let nextId = 1;

/** Called by the portal when the platform object for the signed-in user exists (null on sign-out). */
export function connectToasts(target: PlatformApi['notify'] | null): void {
  notify = target;
}

/** The portal's toaster listens here (toasts from pages and, via the platform, from MFEs). */
export function subscribeToasts(listener: (toast: Toast) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Shows a toast in the portal's toaster (used for toasts that came through the platform). */
export function showToast(toast: Toast): void {
  listeners.forEach((listener) => listener(toast));
}

function show(kind: ToastKind, message: string): void {
  if (notify) notify.toast(message, { kind });
  else showToast({ id: `local-toast-${nextId++}`, message, kind });
}

type Options = { description?: string };
const withDescription = (message: string, options?: Options) =>
  options?.description ? `${message}: ${options.description}` : message;

export const toast = Object.assign(
  (message: string, options?: Options) =>
    show('info', withDescription(message, options)),
  {
    success: (message: string, options?: Options) =>
      show('success', withDescription(message, options)),
    error: (message: string, options?: Options) =>
      show('error', withDescription(message, options)),
    info: (message: string, options?: Options) =>
      show('info', withDescription(message, options)),
    warning: (message: string, options?: Options) =>
      show('warning', withDescription(message, options)),
    message: (message: string, options?: Options) =>
      show('info', withDescription(message, options)),
  },
);
