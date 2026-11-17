import type { PlatformUser } from '@npst/shared-contracts';
import { resetPublishedThemes } from '@/services/brand-server';
import type { Session } from '@/types';
import { toSession } from '@/context/session-shape';

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
  adminNotifications: 'npst_admin_notifications',
  accessibility: 'npst_accessibility',
} as const;

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return crypto.randomUUID();
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

// Where the signed-in user comes from: the portal's central session
// (`services/auth.ts` registers itself; this module never stores a session).
let sessionSource: () => PlatformUser | null = () => null;

/** Called once by `services/auth.ts`. */
export function setSessionSource(source: () => PlatformUser | null): void {
  sessionSource = source;
}

/** The signed-in user in the Admin Portal's own shape (read from the central session). */
export function readSession(): Session | null {
  const user = sessionSource();
  return user ? toSession(user) : null;
}

/** Clears every mock-data key (used by Settings → Reset demo data). */
export function resetAllData(): void {
  // Published themes on the brand server are demo data too.
  void resetPublishedThemes();
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
