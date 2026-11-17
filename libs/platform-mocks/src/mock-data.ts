import type {
  AuditEntry,
  PlatformUser,
  PortalApp,
} from '@npst/shared-contracts';

/** A mock user: who they are plus what the provisioning admin assigned. */
export interface MockUser extends PlatformUser {
  /** Applications assigned in Employee Management (`access:<appId>`). */
  readonly apps: readonly string[];
  /** Inactive users cannot sign in. */
  readonly status: 'active' | 'inactive';
}

/**
 * The Admin Portal's seeded users (same ids, names, emails, roles and
 * application access). The first role is the portal role (Super Admin, Admin,
 * Application Admin, Employee). The second is the user's team in the
 * stand-in business apps (ADMIN, SALES, SOLUTIONS, EMPLOYEE), which their demo
 * workflows use to address tasks and notifications.
 */
export const mockUsers: readonly MockUser[] = [
  {
    id: 'user-1',
    name: 'Aarav Mehta',
    email: 'admin@npst.com',
    roles: ['Super Admin', 'ADMIN'],
    apps: ['app-keka', 'app-skillup', 'app-finance', 'app-dealpulse'],
    status: 'active',
  },
  {
    id: 'user-2',
    name: 'Priya Nair',
    email: 'priya.nair@npst.com',
    roles: ['Admin', 'SALES'],
    apps: ['app-keka', 'app-skillup', 'app-finance', 'app-dealpulse'],
    status: 'active',
  },
  {
    id: 'user-3',
    name: 'Rohit Kulkarni',
    email: 'rohit.kulkarni@npst.com',
    roles: ['Application Admin', 'SOLUTIONS'],
    apps: ['app-keka'],
    status: 'active',
  },
  {
    id: 'user-4',
    name: 'Sneha Iyer',
    email: 'sneha.iyer@npst.com',
    roles: ['Application Admin', 'SOLUTIONS'],
    apps: ['app-skillup'],
    status: 'active',
  },
  {
    id: 'user-5',
    name: 'Vikram Desai',
    email: 'vikram.desai@npst.com',
    roles: ['Application Admin', 'SALES'],
    apps: ['app-finance'],
    status: 'active',
  },
  {
    id: 'user-6',
    name: 'Arjun Rao',
    email: 'arjun.rao@npst.com',
    roles: ['Employee', 'EMPLOYEE'],
    apps: ['app-keka', 'app-skillup'],
    status: 'active',
  },
  {
    id: 'user-7',
    name: 'Neha Kapoor',
    email: 'neha.kapoor@npst.com',
    roles: ['Employee', 'EMPLOYEE'],
    apps: ['app-keka'],
    status: 'active',
  },
  {
    id: 'user-8',
    name: 'Karan Malhotra',
    email: 'karan.malhotra@npst.com',
    roles: ['Admin', 'SALES'],
    apps: ['app-dealpulse'],
    status: 'inactive',
  },
];

/**
 * Mock RBAC: the permissions each role grants, written `action:resource`.
 * Access to an application (`access:<appId>`) is not part of a role: it comes
 * from the user's assigned applications (`MockUser.apps`).
 * Permissions only show or hide UI; backends check them again.
 */
export const mockRolePermissions: Readonly<Record<string, readonly string[]>> =
  {
    // Portal roles: which Shared Services pages are shown.
    'Super Admin': [
      'view:applications',
      'manage:branding',
      'manage:notifications',
      'manage:reminders',
      'manage:employees',
      'view:audit-logs',
      'manage:settings',
      'view:audit',
    ],
    Admin: [
      'view:applications',
      'manage:branding',
      'manage:notifications',
      'manage:reminders',
      'manage:employees',
      'view:audit-logs',
      'view:audit',
    ],
    'Application Admin': [
      'manage:branding',
      'manage:notifications',
      'manage:reminders',
    ],
    Employee: [],
    // Teams in the stand-in business apps.
    ADMIN: [
      'access:projects',
      'export:sales-hub',
      'create:lead',
      'edit:opportunity',
      'update:project-task',
      'approve:leave',
      'apply:leave',
    ],
    SALES: ['access:projects', 'create:lead', 'edit:opportunity'],
    SOLUTIONS: ['access:projects', 'update:project-task', 'apply:leave'],
    EMPLOYEE: ['apply:leave'],
  };

/**
 * Mock App Launcher catalogue: the Admin Portal's application registry.
 * Projects & Delivery is an earlier demo app that is not in the registry; it
 * stays until its removal is approved (Step 24).
 */
export const mockApps: readonly PortalApp[] = [
  {
    id: 'app-keka',
    name: 'Keka HR',
    description:
      'Human capital management for 3,200+ NPST employees — payroll, attendance, leave and performance.',
    path: '/keka',
  },
  {
    id: 'app-dealpulse',
    name: 'Deal Pulse',
    description:
      'Sales pipeline intelligence tracking deals, quotes and revenue targets across regions.',
    path: '/deal-pulse',
  },
  {
    id: 'app-skillup',
    name: 'SkillUp Lounge',
    description:
      'Enterprise learning platform hosting live cohorts, self-paced courses and certification tracks.',
    path: '/skillup',
  },
  {
    id: 'app-finance',
    name: 'NPST Finance',
    description:
      'Accounts payable, invoicing, expense claims and financial approvals for the finance organization.',
    path: '/finance',
  },
  {
    id: 'projects',
    name: 'Projects & Delivery',
    description: 'Track delivery, milestones, tasks and resources',
    path: '/projects',
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
