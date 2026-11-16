import type {
  AuditEntry,
  PlatformUser,
  PortalApp,
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
 * App permissions use the app id as the resource, e.g. `access:sales-hub`,
 * so every application has its own permission, independent of role names.
 * In-app permissions only show or hide UI; backends check them again.
 */
export const mockRolePermissions: Readonly<Record<string, readonly string[]>> =
  {
    ADMIN: [
      'access:sales-hub',
      'access:projects',
      'access:people-hr',
      'access:admin-console',
      'view:audit',
      'export:sales-hub',
      'create:lead',
      'edit:opportunity',
      'update:project-task',
      'approve:leave',
      'apply:leave',
    ],
    SALES: [
      'access:sales-hub',
      'access:projects',
      'create:lead',
      'edit:opportunity',
    ],
    SOLUTIONS: [
      'access:projects',
      'access:people-hr',
      'update:project-task',
      'apply:leave',
    ],
    EMPLOYEE: ['access:people-hr', 'apply:leave'],
  };

/** Mock App Launcher catalogue: every app the portal hosts. */
export const mockApps: readonly PortalApp[] = [
  {
    id: 'sales-hub',
    name: 'Sales Hub',
    description: 'Manage leads, opportunities and the sales pipeline',
    path: '/sales',
  },
  {
    id: 'projects',
    name: 'Projects & Delivery',
    description: 'Track delivery, milestones, tasks and resources',
    path: '/projects',
  },
  {
    id: 'people-hr',
    name: 'People & HR',
    description: 'Employee directory, leave and attendance',
    path: '/people',
  },
  {
    id: 'admin-console',
    name: 'Admin Console',
    description: 'Users, roles and portal settings',
    path: '/admin',
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
  {
    id: 'a-3',
    entity: 'opportunity',
    entityId: 'OP-1043',
    action: 'updated',
    changedBy: 'Rahul Kulkarni',
    changedAt: '2026-10-21T11:05:00Z',
    summary: 'Estimated value changed from ₹3.2 Cr to ₹3.8 Cr',
  },
  {
    id: 'a-4',
    entity: 'opportunity',
    entityId: 'OP-1043',
    action: 'updated',
    changedBy: 'Rahul Kulkarni',
    changedAt: '2026-11-02T16:40:00Z',
    summary: 'Stage changed from Opportunity to Proposal',
  },
  {
    id: 'a-5',
    entity: 'opportunity',
    entityId: 'OP-1043',
    action: 'updated',
    changedBy: 'Arjun Mehta',
    changedAt: '2026-11-12T10:15:00Z',
    summary: 'Probability changed from 50% to 60%',
  },
];
