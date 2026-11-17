import type { PlatformApi, ToastKind } from '@npst/shared-contracts';

/**
 * Toasts for the Admin Portal pages (in-house replacement for `sonner`, same
 * call style: `toast.success('Saved')`). Every toast goes through the
 * platform's Notification Service (`platform.notify.toast()`), and the portal
 * shows it, exactly like toasts requested by MFEs.
 */
let notify: PlatformApi['notify'] | null = null;

/** Called by the portal once the platform object for the signed-in user exists. */
export function connectToasts(target: PlatformApi['notify'] | null): void {
  notify = target;
}

function show(kind: ToastKind, message: string): void {
  if (notify) notify.toast(message, { kind });
  else console.info(`[toast:${kind}]`, message);
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
