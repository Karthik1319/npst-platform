import { dateFrom, minutesAgo } from '../dates';
import type { Random } from '../random';
import type {
  Lead,
  Opportunity,
  Project,
  Task,
  TaskPriority,
  TaskStatus,
} from '../types';
import { HR_TEAM, SALES_MANAGER } from './people';

const PHASE_TASKS: Record<string, readonly string[]> = {
  Initiation: [
    'Kick-off meeting with bank stakeholders',
    'Collect access to the bank’s test environment',
    'Finalise the project plan and RACI',
  ],
  Design: [
    'Finalise API specifications with the bank',
    'Review security architecture',
    'Prepare the data migration plan',
  ],
  Build: [
    'Build customer onboarding screens',
    'Integrate with CBS account APIs',
    'Implement notification hooks (SMS and email)',
    'Code review: payments module',
    'Set up the deployment pipeline for the bank environment',
  ],
  Testing: [
    'Fix priority 1 defects from system testing',
    'Performance test at 500 TPS',
    'Prepare the system test report',
  ],
  UAT: [
    'Support the bank’s UAT team',
    'Fix UAT defects in fund transfer flows',
    'Prepare the go-live runbook',
  ],
  'Go-live': [
    'Production deployment rehearsal',
    'Prepare the hypercare roster',
  ],
};

export function seedTasks(
  now: Date,
  random: Random,
  projects: readonly Project[],
  opportunities: readonly Opportunity[],
  leads: readonly Lead[],
): Task[] {
  const tasks: Task[] = [];
  let next = 3101;
  const add = (
    task: Omit<Task, 'id' | 'createdAt'> & { createdDaysAgo?: number },
  ) => {
    const { createdDaysAgo = random.int(1, 10), ...rest } = task;
    tasks.push({
      ...rest,
      id: `T-${next++}`,
      createdAt: minutesAgo(now, createdDaysAgo * 24 * 60),
    });
  };

  // ---- Team queues (shown in "My Tasks" for everyone with that role) ----
  add({
    title: 'Technical evaluation: Trident Bank fraud risk RFP',
    description:
      'Sales assigned this opportunity to Solutions. Check the RFP’s technical requirements and confirm the solution fit before the proposal is finalised.',
    appId: 'projects',
    sourceAppId: 'app-dealpulse',
    assignee: { kind: 'team', team: 'SOLUTIONS' },
    priority: 'High',
    status: 'To do',
    due: dateFrom(now, 4),
    opportunityId: 'OP-1041',
    createdBy: 'Imran Shaikh',
    createdDaysAgo: 1,
  });
  add({
    title: 'Update project plan – PRJ-221',
    description: 'Re-plan the Build phase after the e-KYC sandbox delay.',
    appId: 'projects',
    assignee: { kind: 'team', team: 'SOLUTIONS' },
    priority: 'High',
    status: 'In progress',
    due: dateFrom(now, 1),
    projectId: 'PRJ-221',
    createdBy: 'Priya Sharma',
  });
  add({
    title: 'Review open UAT defects with Sahyog Urban Co-op Bank',
    appId: 'projects',
    assignee: { kind: 'team', team: 'SOLUTIONS' },
    priority: 'High',
    status: 'To do',
    due: dateFrom(now, 0),
    projectId: 'PRJ-209',
    createdBy: 'Siddharth Gupta',
  });
  add({
    title: 'Prepare resource plan for Merchant Acquiring Rollout',
    appId: 'projects',
    assignee: { kind: 'team', team: 'SOLUTIONS' },
    priority: 'Medium',
    status: 'To do',
    due: dateFrom(now, 5),
    projectId: 'PRJ-224',
    createdBy: 'Meera Nair',
  });

  add({
    title: 'Review RFP for ABC Bank',
    appId: 'app-dealpulse',
    assignee: { kind: 'team', team: 'SALES' },
    priority: 'High',
    status: 'To do',
    due: dateFrom(now, 0),
    opportunityId: 'OP-1043',
    activity: 'Document',
    createdBy: SALES_MANAGER,
  });
  add({
    title: 'Send revised commercials to Meridian Co-operative Bank',
    appId: 'app-dealpulse',
    assignee: { kind: 'team', team: 'SALES' },
    priority: 'High',
    status: 'To do',
    due: dateFrom(now, 0),
    opportunityId: 'OP-1038',
    activity: 'Email',
    createdBy: 'Sneha Patil',
  });
  add({
    title: 'Share contract redlines with Vista Fintech',
    appId: 'app-dealpulse',
    assignee: { kind: 'team', team: 'SALES' },
    priority: 'Medium',
    status: 'To do',
    due: dateFrom(now, -1),
    opportunityId: 'OP-1035',
    activity: 'Email',
    createdBy: 'Rahul Kulkarni',
  });
  add({
    title: 'Schedule discovery workshop with Northwind SFB',
    appId: 'app-dealpulse',
    assignee: { kind: 'team', team: 'SALES' },
    priority: 'Medium',
    status: 'To do',
    due: dateFrom(now, 3),
    opportunityId: 'OP-1046',
    activity: 'Meeting',
    createdBy: 'Kavya Reddy',
  });

  add({
    title: 'Approve discount for the ABC Bank proposal',
    description:
      'Sales asks for a 12% discount on licence fees to stay competitive.',
    appId: 'app-dealpulse',
    assignee: { kind: 'team', team: 'ADMIN' },
    priority: 'High',
    status: 'To do',
    due: dateFrom(now, 1),
    opportunityId: 'OP-1043',
    activity: 'Document',
    createdBy: 'Rahul Kulkarni',
    createdDaysAgo: 0,
  });
  add({
    title: 'Review recovery plans for delayed projects',
    appId: 'projects',
    assignee: { kind: 'team', team: 'ADMIN' },
    priority: 'Medium',
    status: 'To do',
    due: dateFrom(now, 2),
    createdBy: 'Siddharth Gupta',
  });

  add({
    title: 'Complete annual information security training',
    appId: 'app-keka',
    assignee: { kind: 'team', team: 'EMPLOYEE' },
    priority: 'Medium',
    status: 'To do',
    due: dateFrom(now, 4),
    createdBy: HR_TEAM[0],
  });
  add({
    title: 'Submit investment declaration for FY 2026–27',
    appId: 'app-keka',
    assignee: { kind: 'team', team: 'EMPLOYEE' },
    priority: 'Low',
    status: 'To do',
    due: dateFrom(now, 14),
    createdBy: HR_TEAM[1],
  });

  // ---- Sales follow-ups with named owners ----
  const openDeals = opportunities.filter((o) =>
    ['Opportunity', 'Proposal', 'Negotiation'].includes(o.stage),
  );
  for (const deal of openDeals.slice(0, 12)) {
    const kind = random.pick(['Call', 'Meeting', 'Email', 'Demo'] as const);
    const text = {
      Call: `Follow-up call with ${deal.customerName}`,
      Meeting: `Meeting with ${deal.customerName} procurement`,
      Email: `Email pricing clarifications to ${deal.customerName}`,
      Demo: `${deal.product} demo for ${deal.customerName}`,
    }[kind];
    add({
      title: text,
      appId: 'app-dealpulse',
      assignee: { kind: 'person', name: deal.owner },
      priority: random.pick(['High', 'Medium', 'Medium', 'Low'] as const),
      status: random.chance(0.2) ? 'Done' : 'To do',
      due: dateFrom(now, random.int(-4, 9)),
      opportunityId: deal.id,
      activity: kind,
      createdBy: deal.owner,
    });
  }
  for (const lead of leads
    .filter((l) => l.status === 'New' || l.status === 'Contacted')
    .slice(0, 8)) {
    add({
      title: `Intro call with ${lead.contactName} (${lead.company})`,
      appId: 'app-dealpulse',
      assignee: { kind: 'person', name: lead.owner },
      priority: 'Medium',
      status: 'To do',
      due: dateFrom(now, random.int(-2, 6)),
      activity: 'Call',
      createdBy: lead.owner,
    });
  }

  // ---- Delivery tasks for active projects ----
  for (const project of projects) {
    if (project.status === 'Completed') continue;
    const titles = PHASE_TASKS[project.phase] ?? PHASE_TASKS['Build'] ?? [];
    const people = project.team.slice(2).map((m) => m.name);
    titles.forEach((title, index) => {
      const late = project.status !== 'On track' && index < 2;
      const status: TaskStatus = late
        ? 'In progress'
        : random.pick([
            'To do',
            'To do',
            'In progress',
            'In review',
            'Done',
          ] as const);
      const priority: TaskPriority = late
        ? 'High'
        : random.pick(['High', 'Medium', 'Medium', 'Low'] as const);
      add({
        title,
        appId: 'projects',
        assignee: {
          kind: 'person',
          name: people[index % people.length] ?? project.manager,
        },
        priority,
        status,
        due: dateFrom(now, late ? -random.int(2, 6) : random.int(-1, 14)),
        projectId: project.id,
        createdBy: project.manager,
      });
    });
  }

  return tasks;
}
