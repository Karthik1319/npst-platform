import type {
  AuditEntry,
  InboxItem,
  PlatformUser,
  PortalApp,
  Reminder,
} from '@npst/shared-contracts';

/** Mock users offered on the mock login page. */
export const mockUsers: readonly PlatformUser[] = [
  {
    id: 'u-admin',
    name: 'Admin User',
    email: 'admin.user@example.com',
    roles: ['ADMIN'],
  },
  {
    id: 'u-1',
    name: 'User 1',
    email: 'user1@example.com',
    roles: ['SALES'],
  },
  {
    id: 'u-2',
    name: 'User 2',
    email: 'user2@example.com',
    roles: ['SOLUTIONS'],
  },
  {
    id: 'u-3',
    name: 'User 3',
    email: 'user3@example.com',
    roles: ['EMPLOYEE'],
  },
];

/**
 * Mock RBAC: the permissions each role grants, written `action:resource`.
 * App permissions use the app id as the resource, e.g. `access:react-a`,
 * so every application has its own permission, independent of role names.
 */
export const mockRolePermissions: Readonly<Record<string, readonly string[]>> =
  {
    ADMIN: [
      'access:react-a',
      'access:react-b',
      'access:angular',
      'access:admin-console',
      'view:audit',
    ],
    SALES: ['access:react-a', 'access:react-b'],
    SOLUTIONS: ['access:react-b', 'access:angular'],
    EMPLOYEE: ['access:angular'],
  };

/** Mock App Launcher catalogue: every app the portal hosts. */
export const mockApps: readonly PortalApp[] = [
  {
    id: 'react-a',
    name: 'React A',
    description: 'Demo React micro-frontend (remote A).',
    path: '/react-a',
  },
  {
    id: 'react-b',
    name: 'React B',
    description: 'Demo React micro-frontend (remote B).',
    path: '/react-b',
  },
  {
    id: 'angular',
    name: 'Angular',
    description: 'Demo Angular micro-frontend (mount/unmount).',
    path: '/angular',
  },
  {
    id: 'admin-console',
    name: 'Admin Console',
    description: 'Portal administration (placeholder).',
    path: '/admin',
  },
];

export const mockInbox: readonly InboxItem[] = [
  {
    id: 'n-1',
    title: 'Your leave request was approved',
    createdAt: '2026-11-12T09:30:00Z',
    read: false,
  },
  {
    id: 'n-2',
    title: 'New policy document published',
    createdAt: '2026-11-11T14:00:00Z',
    read: false,
  },
  {
    id: 'n-3',
    title: 'Welcome to the NPST portal',
    createdAt: '2026-11-01T08:00:00Z',
    read: true,
  },
];

export const mockReminders: readonly Reminder[] = [
  { id: 'r-1', title: 'Submit timesheet', dueAt: '2026-11-14T17:00:00Z' },
  {
    id: 'r-2',
    title: 'Review team leave requests',
    dueAt: '2026-11-15T10:00:00Z',
  },
];

export const mockAuditEntries: readonly AuditEntry[] = [
  {
    id: 'a-1',
    entity: 'leave-request',
    entityId: 'LR-42',
    action: 'created',
    changedBy: 'User 1',
    changedAt: '2026-11-10T08:15:00Z',
    summary: 'Leave request created for 18–20 Nov',
  },
  {
    id: 'a-2',
    entity: 'leave-request',
    entityId: 'LR-42',
    action: 'approved',
    changedBy: 'User 2',
    changedAt: '2026-11-12T09:30:00Z',
    summary: 'Status changed from Pending to Approved',
  },
];
