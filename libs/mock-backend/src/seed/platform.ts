import { dateTimeFrom, minutesAgo } from '../dates';
import type { Activity, StoredNotification, StoredReminder } from '../types';

type NotificationSeed = Omit<
  StoredNotification,
  'id' | 'createdAt' | 'readBy'
> & {
  minutesAgo: number;
  read?: boolean;
};

/**
 * Notifications already in each team's inbox when the demo starts. They are
 * addressed to teams (RBAC roles), never to a specific demo user.
 */
const NOTIFICATIONS: NotificationSeed[] = [
  // Management (ADMIN)
  {
    to: { team: 'ADMIN' },
    title: 'Solution proposal review due for ABC Bank',
    description:
      'Proposal v2 for OP-1043 (₹3.8 Cr) needs management sign-off before the CDO review.',
    kind: 'warning',
    appId: 'app-dealpulse',
    link: '/deal-pulse/opportunities/OP-1043',
    minutesAgo: 10,
  },
  {
    to: { team: 'ADMIN' },
    title: 'Opportunity OP-1043 moved to Proposal',
    description:
      'Rahul Kulkarni moved “ABC Bank – Digital Banking Platform” to the Proposal stage.',
    kind: 'success',
    appId: 'app-dealpulse',
    link: '/deal-pulse/opportunities/OP-1043',
    minutesAgo: 28,
  },
  {
    to: { team: 'ADMIN' },
    title: 'Project PRJ-221 is at risk',
    description:
      'Two tasks are delayed in the Build phase of Digital Onboarding Platform; go-live may slip by a week.',
    kind: 'error',
    appId: 'projects',
    link: '/projects/PRJ-221',
    minutesAgo: 120,
  },
  {
    to: { team: 'ADMIN' },
    title: 'Leave approvals waiting for you',
    description:
      'Seven leave requests are pending. The oldest was submitted four days ago.',
    kind: 'info',
    appId: 'app-keka',
    link: '/peopleos/leave',
    minutesAgo: 180,
  },
  {
    to: { team: 'ADMIN' },
    title: 'New employee onboarding scheduled',
    description:
      'Arjun Malhotra joins Engineering today. Laptop and access requests are complete.',
    kind: 'info',
    appId: 'app-keka',
    link: '/peopleos/employees',
    minutesAgo: 24 * 60,
    read: true,
  },
  // Sales
  {
    to: { team: 'SALES' },
    title: 'Follow-up due today: Meridian Co-operative Bank',
    description:
      'Send the revised commercials for the UPI Switch Migration (OP-1038).',
    kind: 'warning',
    appId: 'app-dealpulse',
    link: '/deal-pulse/opportunities/OP-1038',
    minutesAgo: 35,
  },
  {
    to: { team: 'SALES' },
    title: 'Discount request sent for approval',
    description:
      'Management will review the 12% discount for the ABC Bank proposal (OP-1043).',
    kind: 'info',
    appId: 'app-dealpulse',
    link: '/deal-pulse/opportunities/OP-1043',
    minutesAgo: 95,
  },
  {
    to: { team: 'SALES' },
    title: 'Pinnacle Payments Bank handed over to Delivery',
    description: 'Project PRJ-224 has started for the won deal OP-1029.',
    kind: 'success',
    appId: 'projects',
    link: '/projects/PRJ-224',
    minutesAgo: 3 * 24 * 60,
    read: true,
  },
  // Solutions and delivery
  {
    to: { team: 'SOLUTIONS' },
    title: 'Opportunity assigned to Solutions: Trident Bank',
    description:
      'Imran Shaikh assigned the fraud risk RFP (OP-1041) to your team for technical evaluation.',
    kind: 'info',
    appId: 'projects',
    link: '/projects/tasks',
    minutesAgo: 50,
  },
  {
    to: { team: 'SOLUTIONS' },
    title: 'Milestone approaching: UAT sign-off for PRJ-218',
    description:
      'UPI Switch Upgrade for Unity Mutual Co-op Bank has its UAT sign-off this month.',
    kind: 'warning',
    appId: 'projects',
    link: '/projects/PRJ-218',
    minutesAgo: 140,
  },
  {
    to: { team: 'SOLUTIONS' },
    title: 'Project PRJ-209 is delayed',
    description:
      'Mobile Banking App 2.0 has passed its target date with UAT defects still open.',
    kind: 'error',
    appId: 'projects',
    link: '/projects/PRJ-209',
    minutesAgo: 5 * 60,
  },
  // Every employee
  {
    to: { team: 'EMPLOYEE' },
    title: 'Holiday calendar for 2027 published',
    description: 'See PeopleOS for the list of company holidays.',
    kind: 'info',
    appId: 'app-keka',
    link: '/peopleos',
    minutesAgo: 4 * 60,
  },
  {
    to: { team: 'EMPLOYEE' },
    title: 'Information security training due this week',
    description:
      'Complete the annual training before Friday to keep system access.',
    kind: 'warning',
    appId: 'app-keka',
    link: '/peopleos',
    minutesAgo: 26 * 60,
  },
];

export function seedNotifications(now: Date): StoredNotification[] {
  return NOTIFICATIONS.map(({ minutesAgo: age, read, ...rest }, index) => ({
    ...rest,
    id: `N-${5001 + index}`,
    createdAt: minutesAgo(now, age),
    readBy: [],
    ...(read ? { readByDefault: true } : {}),
  }));
}

export function seedReminders(now: Date): StoredReminder[] {
  return [
    {
      id: 'R-1',
      to: { team: 'ADMIN' },
      title: 'Review team leave requests',
      dueAt: dateTimeFrom(now, 1, 10),
      link: '/peopleos/leave',
    },
    {
      id: 'R-2',
      to: { team: 'ADMIN' },
      title: 'Quarterly business review with leadership',
      dueAt: dateTimeFrom(now, 3, 15),
    },
    {
      id: 'R-3',
      to: { team: 'SALES' },
      title: 'Update the weekly sales forecast',
      dueAt: dateTimeFrom(now, 1, 17),
      link: '/deal-pulse',
    },
    {
      id: 'R-4',
      to: { team: 'SOLUTIONS' },
      title: 'Submit timesheet',
      dueAt: dateTimeFrom(now, 2, 17),
    },
    {
      id: 'R-5',
      to: { team: 'EMPLOYEE' },
      title: 'Submit timesheet',
      dueAt: dateTimeFrom(now, 2, 17),
    },
    {
      id: 'R-6',
      to: { team: 'EMPLOYEE' },
      title: 'Investment declaration closes',
      dueAt: dateTimeFrom(now, 14, 18),
    },
  ];
}

type ActivitySeed = Omit<Activity, 'id' | 'at'> & { minutesAgo: number };

const ACTIVITY: ActivitySeed[] = [
  {
    minutesAgo: 15,
    appId: 'app-dealpulse',
    actor: 'Rahul Kulkarni',
    text: 'Proposal v2 uploaded for “ABC Bank – Digital Banking Platform”',
    link: '/deal-pulse/opportunities/OP-1043',
  },
  {
    minutesAgo: 42,
    appId: 'projects',
    actor: 'Priya Sharma',
    text: 'Project “Digital Onboarding Platform” re-planned after a vendor delay',
    link: '/projects/PRJ-221',
  },
  {
    minutesAgo: 60,
    appId: 'app-keka',
    actor: 'HR System',
    text: 'New employee “Arjun Malhotra” added to Engineering',
    link: '/peopleos/employees',
  },
  {
    minutesAgo: 130,
    appId: 'app-dealpulse',
    actor: 'Sneha Patil',
    text: 'Lead “Granite Urban Co-op Bank” qualified',
    link: '/deal-pulse/leads',
  },
  {
    minutesAgo: 190,
    appId: 'app-keka',
    actor: 'Ritu Saxena',
    text: 'Approved 3 leave requests for Quality Assurance',
    link: '/peopleos/leave',
  },
  {
    minutesAgo: 300,
    appId: 'projects',
    actor: 'Aditya Joshi',
    text: 'Milestone “System testing complete” reached on PRJ-218',
    link: '/projects/PRJ-218',
  },
  {
    minutesAgo: 24 * 60,
    appId: 'app-dealpulse',
    actor: 'Imran Shaikh',
    text: 'Opportunity “Trident Bank – Fraud Risk Management” assigned to Solutions',
    link: '/deal-pulse/opportunities/OP-1041',
  },
  {
    minutesAgo: 26 * 60,
    appId: 'projects',
    actor: 'Siddharth Gupta',
    text: 'Risk raised on PRJ-209: UAT defects in fund transfer flows',
    link: '/projects/PRJ-209',
  },
  {
    minutesAgo: 3 * 24 * 60,
    appId: 'projects',
    actor: 'Meera Nair',
    text: 'Project “Merchant Acquiring Rollout” started for Pinnacle Payments Bank',
    link: '/projects/PRJ-224',
  },
  {
    minutesAgo: 4 * 24 * 60,
    appId: 'app-dealpulse',
    actor: 'Sneha Patil',
    text: 'Deal won: Pinnacle Payments Bank – Merchant Acquiring (₹2.9 Cr)',
    link: '/deal-pulse/opportunities/OP-1029',
  },
];

export function seedActivity(now: Date): Activity[] {
  return ACTIVITY.map(({ minutesAgo: age, ...entry }, index) => ({
    ...entry,
    id: `A-${7001 + index}`,
    at: minutesAgo(now, age),
  }));
}
