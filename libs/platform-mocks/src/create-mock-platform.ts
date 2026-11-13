import {
  PLATFORM_API_VERSION,
  type PlatformUser,
  type ShellPlatformApi,
  type Toast,
} from '@npst/shared-contracts';
import {
  mockApps,
  mockAuditEntries,
  mockInbox,
  mockReminders,
  mockRolePermissions,
} from './mock-data';

export interface MockPlatformOptions {
  /**
   * The signed-in user. Required on purpose: there is no default user, so
   * nothing silently runs with more rights (e.g. Admin) than intended.
   */
  user: PlatformUser;
}

/**
 * Builds a complete platform object from in-memory data.
 * The real platform modules will provide the same interface later.
 */
export function createMockPlatform(
  options: MockPlatformOptions,
): ShellPlatformApi {
  const user = options?.user;
  if (!user) {
    throw new Error('createMockPlatform() needs the signed-in user');
  }
  const toastListeners = new Set<(toast: Toast) => void>();
  let nextToastId = 1;

  const can = (action: string, resource: string): boolean =>
    user.roles.some((role) =>
      (mockRolePermissions[role] ?? []).includes(`${action}:${resource}`),
    );

  return {
    version: PLATFORM_API_VERSION,
    branding: { themeVersion: 'local' },
    user,
    permissions: { can },

    notify: {
      toast(message, toastOptions = {}) {
        const toast: Toast = {
          id: `toast-${nextToastId++}`,
          message,
          kind: toastOptions.kind ?? 'info',
        };
        console.info('[mock notify] toast', toast);
        toastListeners.forEach((listener) => listener(toast));
      },
    },

    audit: {
      async history(entity, id) {
        if (!can('view', 'audit')) {
          throw new Error('Not allowed to view audit history');
        }
        return mockAuditEntries.filter(
          (entry) => entry.entity === entity && entry.entityId === id,
        );
      },
    },

    inbox: {
      async list() {
        return mockInbox;
      },
    },

    toasts: {
      subscribe(listener) {
        toastListeners.add(listener);
        return () => {
          toastListeners.delete(listener);
        };
      },
    },

    reminders: {
      async list() {
        return mockReminders;
      },
    },

    apps: {
      async catalogue() {
        return mockApps;
      },
      // Same rule as the shell's route guard: `access` on the app id.
      async allowed() {
        return mockApps.filter((app) => can('access', app.id));
      },
    },
  };
}
