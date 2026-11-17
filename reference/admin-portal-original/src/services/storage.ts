import type { Session } from '@/types';

export const STORAGE_KEYS = {
  apps: 'npst_apps',
  brandingConfigs: 'npst_branding_configs',
  brandingVersions: 'npst_branding_versions',
  brandingPresets: 'npst_branding_presets',
  brandingApprovals: 'npst_branding_approvals',
  templates: 'npst_templates',
  notificationCodeMasters: 'npst_notification_code_masters',
  notificationDefinitions: 'npst_notification_definitions',
  rules: 'npst_rules',
  channels: 'npst_channels',
  notifLogs: 'npst_notification_logs',
  notifReadAt: 'npst_notif_read_at',
  policies: 'npst_reminder_policies',
  reminderCodeMasters: 'npst_reminder_code_masters',
  reminderDefinitions: 'npst_reminder_definitions',
  escalations: 'npst_escalations',
  reminders: 'npst_reminder_instances',
  users: 'npst_users',
  audit: 'npst_audit_logs',
  settings: 'npst_settings',
  sidebarCollapsed: 'npst_sidebar_collapsed',
  session: 'npst_session',
  adminNotifications: 'npst_admin_notifications',
  accessibility: 'npst_accessibility',
} as const;

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Reads a collection from LocalStorage, seeding it on first access. */
export function loadCollection<T>(key: string, seed: () => T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw) as T[];
  } catch {
    // corrupted payload — fall through and reseed
  }
  const seeded = seed();
  try {
    localStorage.setItem(key, JSON.stringify(seeded));
  } catch {
    // storage full — the in-memory copy still serves this session
  }
  return seeded;
}

export function persistCollection<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error(`Failed to persist ${key}`, error);
  }
}

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session) ?? sessionStorage.getItem(STORAGE_KEYS.session);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function writeSession(session: Session, remember: boolean): void {
  clearSession();
  const store = remember ? localStorage : sessionStorage;
  store.setItem(STORAGE_KEYS.session, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.session);
  sessionStorage.removeItem(STORAGE_KEYS.session);
}

/** Clears every mock-data key (used by Settings → Reset demo data). */
export function resetAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

export function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

export function writeFlag(key: string, value: boolean): void {
  try {
    if (value) localStorage.setItem(key, '1');
    else localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
