import { onDataChange, readData, updateData } from '../store';
import type {
  Activity,
  AppId,
  Recipient,
  StoredNotification,
  StoredReminder,
} from '../types';
import { clone } from './common';

/** Who is asking: the signed-in user (in the real system, from the session). */
export interface Viewer {
  id: string;
  roles: readonly string[];
}

const isFor = (to: Recipient, viewer: Viewer) =>
  'team' in to ? viewer.roles.includes(to.team) : to.userId === viewer.id;

export interface NotificationView extends Omit<
  StoredNotification,
  'to' | 'readBy' | 'readByDefault'
> {
  read: boolean;
}

const view = (n: StoredNotification, viewer: Viewer): NotificationView => ({
  id: n.id,
  title: n.title,
  description: n.description,
  kind: n.kind,
  createdAt: n.createdAt,
  ...(n.appId ? { appId: n.appId } : {}),
  ...(n.link ? { link: n.link } : {}),
  read: n.readByDefault === true || n.readBy.includes(viewer.id),
});

/**
 * Simulated Notification Service. Backends send notifications server to
 * server (`send`); the portal's bell reads the user's inbox. Browsers and MFEs
 * never send notifications themselves.
 */
export const notificationService = {
  async inbox(viewer: Viewer): Promise<NotificationView[]> {
    return readData()
      .notifications.filter((n) => isFor(n.to, viewer))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((n) => view(n, viewer));
  },

  async markRead(id: string, viewer: Viewer): Promise<void> {
    updateData((data) => {
      const found = data.notifications.find(
        (n) => n.id === id && isFor(n.to, viewer),
      );
      if (found && !found.readBy.includes(viewer.id))
        found.readBy.push(viewer.id);
    });
  },

  async markAllRead(viewer: Viewer): Promise<void> {
    updateData((data) => {
      for (const n of data.notifications) {
        if (isFor(n.to, viewer) && !n.readBy.includes(viewer.id))
          n.readBy.push(viewer.id);
      }
    });
  },

  async reminders(viewer: Viewer): Promise<StoredReminder[]> {
    return clone(
      readData()
        .reminders.filter((r) => isFor(r.to, viewer))
        .sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    );
  },

  /** Calls `listener` when notifications may have changed. */
  subscribe(listener: () => void): () => void {
    return onDataChange(listener);
  },
};

/** Simulated activity feed behind the portal's Recent Activity. */
export const activityService = {
  async recent(query: {
    appIds: readonly AppId[];
    limit?: number;
  }): Promise<Activity[]> {
    return clone(
      readData()
        .activity.filter((a) => query.appIds.includes(a.appId))
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, query.limit ?? 8),
    );
  },
};
