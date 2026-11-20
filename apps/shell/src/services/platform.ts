import { createMockPlatform } from '@npst/platform-mocks';
import type {
  InboxItem,
  PlatformUser,
  ShellPlatformApi,
} from '@npst/shared-contracts';
import { adminNotificationService } from '@/services/adminNotificationService';
import type { AdminNotification } from '@/types';

/**
 * Builds the platform object for the signed-in user; the shell passes it to
 * every MFE. It is a mock for now. When the real platform modules are ready,
 * only this file changes.
 *
 * The bell's inbox (Notification Service, in-app messages) shows the Admin
 * Portal's administrative notifications (approval requests and results,
 * filtered by the user's portal role), exactly as in the Admin Portal. The
 * stand-in applications' sample messages are not shown; the real Notification
 * Service will deliver the applications' messages here.
 */
export function createPlatform(user: PlatformUser): ShellPlatformApi {
  const platform = createMockPlatform({ user });
  return { ...platform, inbox: withAdminNotifications(platform.inbox) };
}

const ADMIN_PREFIX = 'admin:';

function toInboxItem(notification: AdminNotification): InboxItem {
  return {
    id: `${ADMIN_PREFIX}${notification.id}`,
    title: notification.title,
    description: notification.description,
    createdAt: notification.timestamp,
    read: notification.read,
    ...(notification.path ? { link: notification.path } : {}),
  };
}

function withAdminNotifications(
  inbox: ShellPlatformApi['inbox'],
): ShellPlatformApi['inbox'] {
  return {
    async list() {
      return adminNotificationService
        .list()
        .map(toInboxItem)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async markRead(id) {
      if (id.startsWith(ADMIN_PREFIX))
        adminNotificationService.markRead(id.slice(ADMIN_PREFIX.length));
    },
    async markAllRead() {
      adminNotificationService.markAllRead();
    },
    // Messages from the applications arrive through the Notification Service
    // (real module later); the bell reloads when it signals a change.
    subscribe: (listener) => inbox.subscribe(listener),
  };
}
