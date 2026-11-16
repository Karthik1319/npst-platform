import { beforeEach, describe, expect, it } from 'vitest';
import {
  activityService,
  generateDemoData,
  hrApi,
  notificationService,
  projectsApi,
  resetDemoData,
  salesApi,
  workApi,
} from './index';

const admin = { id: 'viewer-admin', roles: ['ADMIN'] };
const sales = { id: 'viewer-sales', roles: ['SALES'] };

beforeEach(() => resetDemoData());

describe('sample data', () => {
  it('is the same every time it is generated (stable demo)', () => {
    const now = new Date('2026-11-16T09:00:00');
    expect(generateDemoData(now)).toEqual(generateDemoData(now));
  });

  it('contains no data of the portal’s mock users (those belong to the RBAC mock)', () => {
    const json = JSON.stringify(generateDemoData());
    for (const leaked of ['Admin User', 'u-admin', '@example.com', 'User 1']) {
      expect(json).not.toContain(leaked);
    }
  });

  it('uses unique ids', () => {
    const data = generateDemoData();
    for (const list of [
      data.leads,
      data.opportunities,
      data.projects,
      data.tasks,
      data.employees,
      data.leaveRequests,
    ]) {
      const ids = list.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('salesApi', () => {
  it('reports a narrowing funnel from leads to won deals', async () => {
    const summary = await salesApi.summary();
    const counts = summary.funnel.map((step) => step.count);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    expect(summary.totalLeads).toBe(124);
    expect(summary.pipelineValue).toBeGreaterThan(0);
    expect(summary.pipelineChangePercent).toBe(12);
  });

  it('filters and pages leads', async () => {
    const page = await salesApi.listLeads({ status: 'New', pageSize: 10 });
    expect(page.total).toBe(24);
    expect(page.items).toHaveLength(10);
    expect(page.items.every((lead) => lead.status === 'New')).toBe(true);
  });

  it('returns an opportunity with its customer', async () => {
    const found = await salesApi.getOpportunity('OP-1043');
    expect(found?.customer.name).toBe('ABC Bank');
    expect(found?.opportunity.stage).toBe('Proposal');
    expect(await salesApi.getOpportunity('OP-0000')).toBeNull();
  });
});

describe('projectsApi', () => {
  it('counts active projects by health', async () => {
    const summary = await projectsApi.summary();
    expect(summary.active).toBe(21);
    expect(summary.onTrack + summary.atRisk + summary.delayed).toBe(21);
    expect(summary.atRisk).toBe(5);
    expect(summary.delayed).toBe(3);
  });
});

describe('hrApi', () => {
  it('summarises headcount, attendance and approvals', async () => {
    const summary = await hrApi.summary();
    expect(summary.totalEmployees).toBe(276);
    expect(summary.presentToday + summary.onLeaveToday).toBe(276);
    expect(summary.onLeaveToday).toBeGreaterThan(0);
    expect(summary.pendingApprovals).toBe(7);
  });
});

describe('notificationService', () => {
  it('delivers team notifications only to that team', async () => {
    const adminInbox = await notificationService.inbox(admin);
    const salesInbox = await notificationService.inbox(sales);
    expect(adminInbox.length).toBeGreaterThan(0);
    expect(adminInbox.map((n) => n.id)).not.toEqual(
      salesInbox.map((n) => n.id),
    );
    expect(
      salesInbox.every((n) => !adminInbox.some((a) => a.id === n.id)),
    ).toBe(true);
  });

  it('marks notifications read per user', async () => {
    const [first] = (await notificationService.inbox(admin)).filter(
      (n) => !n.read,
    );
    if (!first) throw new Error('expected an unread notification');

    await notificationService.markRead(first.id, admin);

    const after = await notificationService.inbox(admin);
    expect(after.find((n) => n.id === first.id)?.read).toBe(true);
    const otherAdmin = await notificationService.inbox({
      id: 'someone-else',
      roles: ['ADMIN'],
    });
    expect(otherAdmin.find((n) => n.id === first.id)?.read).toBe(false);

    await notificationService.markAllRead(admin);
    expect((await notificationService.inbox(admin)).every((n) => n.read)).toBe(
      true,
    );
  });
});

describe('workApi', () => {
  it("lists the open tasks in the user's team queues", async () => {
    const tasks = await workApi.forUser(sales);
    expect(tasks.length).toBeGreaterThan(0);
    expect(
      tasks.every(
        (t) => t.assignee.kind === 'team' && t.assignee.team === 'SALES',
      ),
    ).toBe(true);
    expect(tasks.every((t) => t.status !== 'Done')).toBe(true);
  });
});

describe('Sales Hub write operations', () => {
  const actor = { id: 'viewer-sales', name: 'Sales Tester', roles: ['SALES'] };

  it('creates a lead as New and records it in Recent Activity', async () => {
    const lead = await salesApi.createLead(
      {
        company: 'Harbor Urban Co-op Bank',
        contactName: 'Asha Rao',
        contactTitle: 'Head of IT',
        email: 'asha.rao@harbor.example',
        phone: '+91 98200 00000',
        source: 'Referral',
        industry: 'Co-operative bank',
        city: 'Pune',
        owner: 'Sneha Patil',
        interest: 'UPI Switch',
        estimatedValue: 5_000_000,
      },
      actor,
    );
    expect(lead.status).toBe('New');
    const first = (await salesApi.listLeads()).items[0];
    expect(first?.id).toBe(lead.id);
    const [latest] = await activityService.recent({
      appIds: ['sales-hub'],
      limit: 1,
    });
    expect(latest?.text).toBe('New lead “Harbor Urban Co-op Bank” added');
  });

  it('adds a note to an opportunity', async () => {
    await salesApi.addNote(
      'OP-1043',
      'Pricing call booked for Thursday.',
      actor,
    );
    const found = await salesApi.getOpportunity('OP-1043');
    expect(found?.opportunity.notes[0]?.text).toBe(
      'Pricing call booked for Thursday.',
    );
  });

  it('completes a task and adds it to the opportunity timeline', async () => {
    const [task] = await workApi.list({
      opportunityId: 'OP-1043',
      team: 'SALES',
    });
    if (!task) throw new Error('expected a sales task for OP-1043');

    const done = await workApi.updateStatus(task.id, 'Done', actor);

    expect(done.completedBy).toBe('Sales Tester');
    const found = await salesApi.getOpportunity('OP-1043');
    expect(found?.opportunity.timeline[0]?.text).toBe(
      `Task completed: ${task.title}`,
    );
    expect((await workApi.forUser(actor)).some((t) => t.id === task.id)).toBe(
      false,
    );
  });
});
