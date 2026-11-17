import { createCrudService } from './mockApi';
import { auditService } from './auditService';
import { seedApps, seedUsers } from '@/data/seed';
import { STORAGE_KEYS } from './storage';
import type { ConfigStatus, NotificationIntegration, NpstApplication, NpstSettings, User } from '@/types';

const appCrud = createCrudService<NpstApplication>(STORAGE_KEYS.apps, seedApps);
const userCrud = createCrudService<User>(STORAGE_KEYS.users, seedUsers);

const DEFAULT_SETTINGS: NpstSettings = {
  portalName: 'NPST Shared Services',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  sessionTimeout: 30,
  enforce2FA: false,
  passwordExpiry: 90,
  apiKey: 'npst_sk_live_9f3d7a2c4e8b1650',
};

export const applicationService = {
  list: appCrud.list,
  get: appCrud.get,
  create: (input: Omit<NpstApplication, 'id'>): NpstApplication => {
    const app = appCrud.create(input);
    auditService.log('Applications', `Added application ${app.name}`, app.id);
    return app;
  },
  update: (id: string, patch: Partial<Omit<NpstApplication, 'id'>>): NpstApplication | undefined => {
    const next = appCrud.update(id, patch);
    if (next) auditService.log('Applications', `Updated application ${next.name}`, id);
    return next;
  },
  remove: (id: string): void => {
    const app = appCrud.get(id);
    appCrud.remove(id);
    if (app) auditService.log('Applications', `Removed application ${app.name}`, id);
  },
  /** Silent status sync used by the branding/notification modules (their own actions audit the change). */
  setIntegrationStatus: (id: string, patch: { brandingStatus?: ConfigStatus; notificationStatus?: NotificationIntegration }): void => {
    appCrud.update(id, patch);
  },
};

export const userService = {
  list: userCrud.list,
  get: userCrud.get,
  create: (input: Omit<User, 'id'>): User => {
    const user = userCrud.create(input);
    auditService.log('Users', `Created user ${user.name} (${user.role})`, 'Portal');
    return user;
  },
  update: (id: string, patch: Partial<Omit<User, 'id'>>): User | undefined => {
    const previous = userCrud.get(id);
    const next = userCrud.update(id, patch);
    if (next) {
      const before = Object.fromEntries(Object.keys(patch).map((key) => [key, previous?.[key as keyof User]]));
      auditService.log('Employees', `Updated ${next.name}; previous=${JSON.stringify(before)}; updated=${JSON.stringify(patch)}`, id);
    }
    return next;
  },
  remove: (id: string): void => {
    const user = userCrud.get(id);
    userCrud.remove(id);
    if (user) auditService.log('Users', `Deleted user ${user.name}`, 'Portal');
  },
};

export const settingsService = {
  get(): NpstSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.settings);
      if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<NpstSettings>) };
    } catch {
      // fall through to defaults
    }
    return DEFAULT_SETTINGS;
  },
  save(patch: Partial<NpstSettings>): NpstSettings {
    const next = { ...this.get(), ...patch };
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(next));
    } catch (error) {
      console.error('Failed to persist settings', error);
    }
    auditService.log('Settings', 'Updated portal settings', 'Portal');
    return next;
  },
  regenerateApiKey(): string {
    const key = `npst_sk_live_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
    this.save({ apiKey: key });
    return key;
  },
};
