import { dateFrom, minutesAgo } from '../dates';
import type { Random } from '../random';
import type {
  Milestone,
  Project,
  ProjectPhase,
  ProjectStatus,
  Risk,
} from '../types';
import {
  ENGINEERS,
  FIRST_NAMES,
  LAST_NAMES,
  PROJECT_MANAGERS,
  SOLUTIONS_TEAM,
} from './people';
import { CUSTOMERS, PRODUCT_NAMES } from './sales';

const CRORE = 10_000_000;

/** Standard delivery milestones and where they fall in the schedule (0–1). */
const MILESTONES: readonly [string, number][] = [
  ['Project kick-off', 0.03],
  ['Requirements sign-off', 0.15],
  ['Solution design approved', 0.3],
  ['Build complete', 0.6],
  ['System testing complete', 0.75],
  ['UAT sign-off', 0.88],
  ['Go-live', 1],
];

export function phaseFor(progress: number): ProjectPhase {
  if (progress >= 100) return 'Closed';
  if (progress >= 92) return 'Go-live';
  if (progress >= 78) return 'UAT';
  if (progress >= 62) return 'Testing';
  if (progress >= 28) return 'Build';
  if (progress >= 10) return 'Design';
  return 'Initiation';
}

interface ProjectPlan {
  id: string;
  name: string;
  customerId: string;
  manager: string;
  status: ProjectStatus;
  progress: number;
  startDaysAgo: number;
  durationDays: number;
  value: number;
  opportunityId?: string;
  description?: string;
  risks?: Omit<Risk, 'id'>[];
  updates?: { daysAgo: number; author: string; text: string }[];
}

const FEATURED: ProjectPlan[] = [
  {
    id: 'PRJ-221',
    name: 'Digital Onboarding Platform',
    customerId: 'C-110',
    manager: 'Priya Sharma',
    status: 'At risk',
    progress: 58,
    startDaysAgo: 120,
    durationDays: 170,
    value: 2.4 * CRORE,
    description:
      'Paperless savings and current account opening with Video KYC, Aadhaar e-KYC and instant account activation for Lotus Small Finance Bank.',
    risks: [
      {
        title: 'e-KYC provider API sandbox delayed by two weeks',
        severity: 'High',
        owner: 'Priya Sharma',
        status: 'Open',
      },
      {
        title: 'Two backend developers moved to a production incident',
        severity: 'Medium',
        owner: 'Nikhil Verma',
        status: 'Mitigating',
      },
    ],
    updates: [
      {
        daysAgo: 0.03,
        author: 'Priya Sharma',
        text: 'Escalated the e-KYC sandbox delay to the bank’s vendor manager. Re-plan shared with the Solutions team.',
      },
      {
        daysAgo: 2,
        author: 'Nikhil Verma',
        text: 'Account activation APIs integrated with CBS in the test environment.',
      },
      {
        daysAgo: 6,
        author: 'Priya Sharma',
        text: 'Phase moved to Build after design sign-off by the bank.',
      },
    ],
  },
  {
    id: 'PRJ-218',
    name: 'UPI Switch Upgrade',
    customerId: 'C-109',
    manager: 'Aditya Joshi',
    status: 'On track',
    progress: 72,
    startDaysAgo: 150,
    durationDays: 210,
    value: 1.9 * CRORE,
  },
  {
    id: 'PRJ-224',
    name: 'Merchant Acquiring Rollout',
    customerId: 'C-105',
    manager: 'Meera Nair',
    status: 'On track',
    progress: 8,
    startDaysAgo: 10,
    durationDays: 180,
    value: 2.9 * CRORE,
    opportunityId: 'OP-1029',
    description:
      'Rollout of UPI merchant acquiring with dynamic QR and Soundbox for Pinnacle Payments Bank, won by Sales in OP-1029.',
  },
  {
    id: 'PRJ-209',
    name: 'Mobile Banking App 2.0',
    customerId: 'C-103',
    manager: 'Siddharth Gupta',
    status: 'Delayed',
    progress: 81,
    startDaysAgo: 230,
    durationDays: 222,
    value: 1.3 * CRORE,
    risks: [
      {
        title: 'UAT defects in fund transfer flows not yet closed',
        severity: 'High',
        owner: 'Siddharth Gupta',
        status: 'Open',
      },
      {
        title: 'Bank’s UAT team available only two days a week',
        severity: 'Medium',
        owner: 'Siddharth Gupta',
        status: 'Open',
      },
    ],
  },
  {
    id: 'PRJ-215',
    name: 'BBPS Integration',
    customerId: 'C-113',
    manager: 'Aditya Joshi',
    status: 'On track',
    progress: 45,
    startDaysAgo: 70,
    durationDays: 140,
    value: 65 * 100_000,
  },
  {
    id: 'PRJ-212',
    name: 'Fraud Monitoring Rollout',
    customerId: 'C-108',
    manager: 'Priya Sharma',
    status: 'At risk',
    progress: 66,
    startDaysAgo: 140,
    durationDays: 190,
    value: 1.7 * CRORE,
  },
];

const ROLES = [
  'Backend developer',
  'Frontend developer',
  'QA engineer',
  'DevOps engineer',
] as const;

/** Tracks how much of each person's time is already given to projects. */
class Staffing {
  private readonly allocated = new Map<string, number>();
  private readonly pool: string[];
  private cursor = 0;

  constructor(random: Random) {
    const generated = new Set<string>();
    while (generated.size < 40) {
      const name = `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)}`;
      if (!(ENGINEERS as readonly string[]).includes(name)) generated.add(name);
    }
    this.pool = [...ENGINEERS, ...generated];
  }

  /** Next engineers with spare time, given `allocation` percent each (at most 100% in total). */
  take(
    count: number,
    allocation: number,
  ): { name: string; allocation: number }[] {
    const picked: { name: string; allocation: number }[] = [];
    for (
      let tries = 0;
      picked.length < count && tries < this.pool.length;
      tries += 1
    ) {
      const name = this.pool[this.cursor % this.pool.length] ?? '';
      this.cursor += 1;
      const free = 100 - (this.allocated.get(name) ?? 0);
      if (free < 25) continue;
      const given = Math.min(free, allocation);
      this.allocated.set(name, 100 - free + given);
      picked.push({ name, allocation: given });
    }
    return picked;
  }
}

export function seedProjects(now: Date, random: Random): Project[] {
  const plans: ProjectPlan[] = [...FEATURED];
  const statuses: ProjectStatus[] = [
    ...Array<ProjectStatus>(10).fill('On track'),
    ...Array<ProjectStatus>(3).fill('At risk'),
    ...Array<ProjectStatus>(2).fill('Delayed'),
    ...Array<ProjectStatus>(3).fill('Completed'),
  ];
  const usedIds = new Set(FEATURED.map((plan) => plan.id));
  let next = 201;
  for (const status of statuses) {
    while (usedIds.has(`PRJ-${next}`)) next += 1;
    const id = `PRJ-${next}`;
    usedIds.add(id);
    const durationDays = random.int(120, 260);
    const completed = status === 'Completed';
    const progress = completed ? 100 : random.int(12, 90);
    plans.push({
      id,
      name: random.pick(PRODUCT_NAMES).replace(' (UPI + Soundbox)', ''),
      customerId: random.pick(CUSTOMERS.filter((c) => c.customerSince !== null))
        .id,
      manager: random.pick(PROJECT_MANAGERS),
      status,
      progress,
      startDaysAgo: completed
        ? durationDays + random.int(10, 90)
        : Math.round((durationDays * progress) / 100) + random.int(-10, 15),
      durationDays,
      value: random.int(5, 30) * 10 * 100_000,
    });
  }
  const staffing = new Staffing(random);
  return plans
    .map((plan) => buildProject(plan, now, random, staffing))
    .sort((a, b) => b.id.localeCompare(a.id));
}

function buildProject(
  plan: ProjectPlan,
  now: Date,
  random: Random,
  staffing: Staffing,
): Project {
  const found = CUSTOMERS.find((c) => c.id === plan.customerId);
  if (!found) throw new Error(`Unknown customer ${plan.customerId}`);
  const start = -plan.startDaysAgo;
  const done = plan.progress / 100;

  let current = false;
  const milestones: Milestone[] = MILESTONES.map(([name, at], index) => {
    const dueDays = start + Math.round(plan.durationDays * at);
    let status: Milestone['status'];
    if (at <= done) status = 'Done';
    else if (!current) {
      current = true;
      status = dueDays < 0 ? 'Overdue' : 'In progress';
    } else status = dueDays < 0 ? 'Overdue' : 'Upcoming';
    return {
      id: `${plan.id}-m${index + 1}`,
      name,
      due: dateFrom(now, dueDays),
      status,
    };
  });

  const architect = random.pick(SOLUTIONS_TEAM);
  const completed = plan.status === 'Completed';
  const engineers = completed
    ? []
    : staffing.take(random.int(3, 5), random.pick([25, 50, 50, 75]));

  return {
    id: plan.id,
    name: plan.name,
    customerId: found.id,
    customerName: found.name,
    manager: plan.manager,
    startDate: dateFrom(now, start),
    targetDate: dateFrom(now, start + plan.durationDays),
    status: plan.status,
    phase: phaseFor(plan.progress),
    progress: plan.progress,
    contractValue: plan.value,
    description:
      plan.description ??
      `Delivery of ${plan.name.toLowerCase()} for ${found.name}, ${found.city}.`,
    ...(plan.opportunityId ? { opportunityId: plan.opportunityId } : {}),
    team: [
      {
        name: plan.manager,
        role: 'Project manager',
        allocation: completed ? 0 : 30,
      },
      {
        name: architect,
        role: 'Solutions architect',
        allocation: completed ? 0 : 10,
      },
      ...engineers.map((engineer, index) => ({
        name: engineer.name,
        role: index === 0 ? 'Tech lead' : random.pick(ROLES),
        allocation: engineer.allocation,
      })),
    ],
    milestones,
    risks: (plan.risks ?? defaultRisks(plan, random)).map((risk, index) => ({
      ...risk,
      id: `${plan.id}-r${index + 1}`,
    })),
    updates: (plan.updates ?? defaultUpdates(plan, random)).map(
      (update, index) => ({
        id: `${plan.id}-u${index + 1}`,
        at: minutesAgo(now, update.daysAgo * 24 * 60),
        author: update.author,
        text: update.text,
      }),
    ),
  };
}

function defaultRisks(plan: ProjectPlan, random: Random): Omit<Risk, 'id'>[] {
  if (plan.status === 'Completed') return [];
  const pool: Omit<Risk, 'id'>[] = [
    {
      title: 'Bank environment access pending for the test team',
      severity: 'Medium',
      owner: plan.manager,
      status: 'Open',
    },
    {
      title: 'Change requests raised late in the build phase',
      severity: 'Medium',
      owner: plan.manager,
      status: 'Mitigating',
    },
    {
      title: 'Third-party certification slot not yet confirmed',
      severity: 'High',
      owner: plan.manager,
      status: 'Open',
    },
    {
      title: 'Key-person dependency on the tech lead',
      severity: 'Low',
      owner: plan.manager,
      status: 'Mitigating',
    },
  ];
  const count = plan.status === 'On track' ? random.int(0, 1) : 2;
  return pool.sort(() => random.next() - 0.5).slice(0, count);
}

function defaultUpdates(
  plan: ProjectPlan,
  random: Random,
): { daysAgo: number; author: string; text: string }[] {
  const phase = phaseFor(plan.progress);
  if (plan.status === 'Completed') {
    return [
      {
        daysAgo: random.int(10, 60),
        author: plan.manager,
        text: 'Project closed after hypercare. Handed over to support.',
      },
    ];
  }
  return [
    {
      daysAgo: random.int(1, 4),
      author: plan.manager,
      text: `Weekly status shared with the bank: ${plan.progress}% complete, phase ${phase}.`,
    },
    {
      daysAgo: random.int(6, 14),
      author: plan.manager,
      text: 'Steering committee reviewed scope and timeline.',
    },
  ];
}
