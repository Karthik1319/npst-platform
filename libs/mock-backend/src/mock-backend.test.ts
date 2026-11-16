import { beforeEach, describe, expect, it } from 'vitest';
import {
  activityService,
  generateDemoData,
  hrApi,
  notificationService,
  projectsApi,
  resetDemoData,
  salesApi,
  searchApi,
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

describe('leave workflow (People & HR)', () => {
  const employee = {
    id: 'portal-user-3',
    name: 'Employee Tester',
    roles: ['EMPLOYEE'],
  };
  const manager = {
    id: 'portal-admin',
    name: 'Manager Tester',
    roles: ['ADMIN'],
  };

  it('notifies managers of a new request and the employee of the decision', async () => {
    const request = await hrApi.applyLeave(
      {
        type: 'Casual leave',
        from: '2026-12-21',
        to: '2026-12-23',
        reason: 'Family function',
      },
      employee,
    );
    expect(request).toMatchObject({
      status: 'Pending',
      days: 3,
      employeeName: 'Employee Tester',
    });

    const managerInbox = await notificationService.inbox(manager);
    expect(managerInbox[0]).toMatchObject({
      title: 'Leave request from Employee Tester',
      read: false,
      link: '/people/leave',
    });

    await hrApi.decideLeave(request.id, 'Approved', manager);

    const employeeInbox = await notificationService.inbox(employee);
    expect(employeeInbox[0]).toMatchObject({
      title: 'Your leave request was approved',
      kind: 'success',
    });
    // Another employee does not see it.
    const other = await notificationService.inbox({
      id: 'someone-else',
      roles: ['EMPLOYEE'],
    });
    expect(
      other.some((n) => n.title === 'Your leave request was approved'),
    ).toBe(false);
  });

  it('deducts approved and pending days from the balance', async () => {
    await hrApi.applyLeave(
      {
        type: 'Sick leave',
        from: '2026-12-01',
        to: '2026-12-02',
        reason: 'Medical appointment',
      },
      employee,
    );
    const balance = await hrApi.leaveBalance(employee.id);
    expect(balance.find((b) => b.type === 'Sick leave')).toMatchObject({
      entitled: 6,
      pending: 2,
      available: 4,
    });
  });

  it('does not decide a request twice', async () => {
    const [pending] = await hrApi.listLeaveRequests({ status: 'Pending' });
    if (!pending) throw new Error('expected a pending request');
    await hrApi.decideLeave(pending.id, 'Rejected', manager);
    await expect(
      hrApi.decideLeave(pending.id, 'Approved', manager),
    ).rejects.toThrow('already rejected');
  });
});

describe('cross-application workflow (Sales Hub → Solutions → Sales Hub)', () => {
  const salesUser = {
    id: 'portal-sales',
    name: 'Sales Tester',
    roles: ['SALES'],
  };
  const solutionsUser = {
    id: 'portal-solutions',
    name: 'Solutions Tester',
    roles: ['SOLUTIONS'],
  };

  it('creates an opportunity, hands proposal work to Solutions and reports back when it is done', async () => {
    const opportunity = await salesApi.createOpportunity(
      {
        customerId: 'C-101',
        name: 'UPI Merchant Payments',
        product: 'Merchant Acquiring (UPI + Soundbox)',
        value: 25_000_000,
        expectedClose: '2027-02-15',
        owner: 'Rahul Kulkarni',
      },
      salesUser,
    );
    expect(opportunity).toMatchObject({
      customerName: 'ABC Bank',
      stage: 'Opportunity',
    });

    const task = await salesApi.requestSolutionProposal(
      opportunity.id,
      {
        title: 'Prepare solution proposal – ABC Bank',
        due: '2027-01-10',
        priority: 'High',
        note: '',
      },
      salesUser,
    );

    // Solutions: the task is in their queue and their bell.
    expect(
      (await workApi.forUser(solutionsUser)).some((t) => t.id === task.id),
    ).toBe(true);
    const solutionsInbox = await notificationService.inbox(solutionsUser);
    expect(solutionsInbox[0]).toMatchObject({
      title: 'Proposal task assigned: ABC Bank',
      link: `/projects/tasks?task=${task.id}`,
    });
    // Sales does not get Solutions' notification.
    expect(
      (await notificationService.inbox(salesUser)).some(
        (n) => n.id === solutionsInbox[0]?.id,
      ),
    ).toBe(false);

    await workApi.updateStatus(task.id, 'In progress', solutionsUser);
    await workApi.updateStatus(task.id, 'Done', solutionsUser);

    // Sales: notified, and the opportunity shows the work.
    const salesInbox = await notificationService.inbox(salesUser);
    expect(salesInbox[0]).toMatchObject({
      title:
        'Completed by Solutions Tester: Prepare solution proposal – ABC Bank',
      link: `/sales/opportunities/${opportunity.id}`,
    });
    const found = await salesApi.getOpportunity(opportunity.id);
    expect(found?.opportunity.timeline.map((t) => t.text).slice(0, 3)).toEqual([
      'Task completed: Prepare solution proposal – ABC Bank',
      'Work started: Prepare solution proposal – ABC Bank',
      `Solution proposal requested from the Solutions team (${task.id})`,
    ]);
    const [latest] = await activityService.recent({
      appIds: ['projects'],
      limit: 1,
    });
    expect(latest?.text).toBe(
      'Task “Prepare solution proposal – ABC Bank” completed',
    );
  });
});

describe('searchApi', () => {
  it('finds records only in the apps the user may open', async () => {
    const all = await searchApi.search('abc bank', [
      'sales-hub',
      'projects',
      'people-hr',
    ]);
    expect(
      all.some(
        (r) =>
          r.kind === 'Opportunity' && r.link === '/sales/opportunities/OP-1043',
      ),
    ).toBe(true);
    expect(await searchApi.search('abc bank', ['people-hr'])).toEqual([]);
    const people = await searchApi.search('priya sharma', ['people-hr']);
    expect(people[0]).toMatchObject({
      kind: 'Employee',
      title: 'Priya Sharma',
    });
  });
});
