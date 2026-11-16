/**
 * Version of the platform contract.
 * Additive changes bump the minor version; a breaking change bumps the major
 * version and needs a migration note.
 */
export const PLATFORM_API_VERSION = '1.1.0';

// ---------- Shared data types ----------

/** Call it to stop listening. */
export type Unsubscribe = () => void;

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  roles: readonly string[];
}

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  kind?: ToastKind;
}

export interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
}

export interface AuditEntry {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  changedBy: string;
  /** ISO 8601 timestamp. */
  changedAt: string;
  summary: string;
}

export interface InboxItem {
  id: string;
  title: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
  read: boolean;
  /** One or two sentences of detail. Added in 1.1.0. */
  description?: string;
  /** How the bell styles the item. Added in 1.1.0. */
  kind?: ToastKind;
  /** Id of the app the notification is about. Added in 1.1.0. */
  appId?: string;
  /** Portal path that opens the related record. Added in 1.1.0. */
  link?: string;
}

export interface Reminder {
  id: string;
  title: string;
  /** ISO 8601 timestamp. */
  dueAt: string;
  /** Portal path that opens the related page. Added in 1.1.0. */
  link?: string;
}

/** An application the portal can open (from the App Launcher module). */
export interface PortalApp {
  id: string;
  name: string;
  description: string;
  /** Route in the shell where the app is shown, e.g. `/react-a`. */
  path: string;
}

// ---------- What every MFE receives ----------

/**
 * Platform features available to MFEs in the browser.
 * MFEs use platform features only through this interface.
 * Sensitive actions (sending email/SMS/OTP, writing audit events,
 * provisioning users, changing roles) are backend-only and not here.
 */
export interface PlatformApi {
  /** Contract version the implementation follows. */
  readonly version: string;

  /** UI Branding: colours and fonts arrive as CSS variables from `theme.css`. */
  readonly branding: {
    readonly themeVersion: string;
  };

  /** RBAC: the signed-in user. */
  readonly user: PlatformUser;

  /**
   * RBAC: show or hide UI only. Every backend API checks permissions again.
   * Convention: app-level permissions use the app id as the resource,
   * e.g. `can('access', 'react-a')`.
   */
  readonly permissions: {
    can(action: string, resource: string): boolean;
  };

  /** Notification Services: in-app message shown by the shell. */
  readonly notify: {
    toast(message: string, options?: ToastOptions): void;
  };

  /** Audit / Change History: read-only, permission-gated (`view` on `audit`). */
  readonly audit: {
    history(entity: string, id: string): Promise<readonly AuditEntry[]>;
  };
}

// ---------- What only the shell uses ----------

/**
 * The full platform object held by the shell. It adds the parts the shell
 * renders itself (bell, toasts, launcher). MFEs receive it typed as
 * `PlatformApi` and do not use these members.
 */
export interface ShellPlatformApi extends PlatformApi {
  /** Notification Services: inbox shown in the bell panel. */
  readonly inbox: {
    /** The signed-in user's notifications, newest first. */
    list(): Promise<readonly InboxItem[]>;
    /** Added in 1.1.0. */
    markRead(id: string): Promise<void>;
    /** Added in 1.1.0. */
    markAllRead(): Promise<void>;
    /**
     * Called when the inbox may have changed (a new notification arrived or
     * one was read), so the bell can reload it. Stands in for the
     * Notification Service's push channel. Added in 1.1.0.
     */
    subscribe(listener: () => void): Unsubscribe;
  };

  /** Notification Services: toasts requested through `notify.toast()`. */
  readonly toasts: {
    subscribe(listener: (toast: Toast) => void): Unsubscribe;
  };

  /** Alerts and Reminders: shown in the bell panel. */
  readonly reminders: {
    list(): Promise<readonly Reminder[]>;
  };

  /** Portal Home + App Launcher. */
  readonly apps: {
    /** Every app the portal hosts (used to tell "access denied" from "not found"). */
    catalogue(): Promise<readonly PortalApp[]>;
    /** Apps the user may open: those with `permissions.can('access', app.id)`. */
    allowed(): Promise<readonly PortalApp[]>;
  };
}
