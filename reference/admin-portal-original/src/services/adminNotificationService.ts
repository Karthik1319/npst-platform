import { createCrudService } from './mockApi';
import { readSession } from './storage';
import { STORAGE_KEYS } from './storage';
import type { AdminNotification, UserRole } from '@/types';

const crud = createCrudService<AdminNotification>(STORAGE_KEYS.adminNotifications, () => []);

export const adminNotificationService = {
  list(): AdminNotification[] {
    const role = readSession()?.role;
    return crud.list().filter((notification) => !role || notification.roles.includes(role));
  },
  unreadCount(): number {
    return this.list().filter((notification) => !notification.read).length;
  },
  create(input: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>): AdminNotification {
    return crud.create({ ...input, timestamp: new Date().toISOString(), read: false });
  },
  markRead(id: string): void {
    crud.update(id, { read: true });
  },
  markAllRead(): void {
    crud.list().filter((notification) => !notification.read).forEach((notification) => crud.update(notification.id, { read: true }));
  },
};

export const adminRoles: UserRole[] = ['Super Admin', 'Admin', 'Application Admin'];
