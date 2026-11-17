import { nextId, readData, updateData } from '../store';
import type {
  Actor,
  Customer,
  Lead,
  LeadStatus,
  Note,
  Opportunity,
  OpportunityStage,
  Task,
  TimelineEntry,
} from '../types';
import {
  clone,
  matches,
  paginate,
  recordActivity,
  sendNotification,
  type Page,
} from './common';
import { PRODUCTS } from '../seed/sales';

/** What a user enters for a new lead. */
export type NewLead = Omit<Lead, 'id' | 'createdAt' | 'status'>;

/** What a sales user enters for a new opportunity. */
export interface NewOpportunity {
  customerId: string;
  name: string;
  product: string;
  value: number;
  expectedClose: string;
  owner: string;
  summary?: string;
}

/** A request for the Solutions team to prepare a proposal. */
export interface ProposalRequest {
  title: string;
  due: string;
  priority: 'High' | 'Medium' | 'Low';
  note: string;
}

/** One entry of the Deal Pulse's activity feed. */
export interface SalesActivity extends TimelineEntry {
  opportunityId: string;
  opportunityName: string;
  customerName: string;
}

export const OPEN_STAGES: readonly OpportunityStage[] = [
  'Opportunity',
  'Proposal',
  'Negotiation',
];

/** The pipeline from first contact to a won deal. */
export type FunnelStage =
  'Lead' | 'Qualified' | 'Opportunity' | 'Proposal' | 'Negotiation' | 'Won';

export interface SalesSummary {
  totalLeads: number;
  qualifiedLeads: number;
  activeOpportunities: number;
  proposalsSubmitted: number;
  wonDeals: number;
  wonValue: number;
  lostDeals: number;
  /** Value of open deals, in rupees. */
  pipelineValue: number;
  /** Change against last quarter, in percent. */
  pipelineChangePercent: number;
  /** How many records reached each stage (a funnel). */
  funnel: { stage: FunnelStage; count: number }[];
  /** How many leads have each status right now. */
  leadsByStatus: Record<LeadStatus, number>;
  /** How many opportunities are in each stage right now. */
  byStage: { stage: OpportunityStage; count: number; value: number }[];
}

export interface LeadQuery {
  search?: string;
  status?: LeadStatus | '';
  source?: string;
  industry?: string;
  owner?: string;
  page?: number;
  pageSize?: number;
}

export interface OpportunityQuery {
  search?: string;
  stage?: OpportunityStage | '';
  owner?: string;
}

/** Simulated Deal Pulse backend (read side). */
export const salesApi = {
  async summary(): Promise<SalesSummary> {
    const { leads, opportunities, benchmarks } = readData();
    const count = (stages: readonly OpportunityStage[]) =>
      opportunities.filter((o) => stages.includes(o.stage)).length;
    const open = opportunities.filter((o) => OPEN_STAGES.includes(o.stage));
    const pipelineValue = open.reduce((sum, o) => sum + o.value, 0);
    const won = opportunities.filter((o) => o.stage === 'Won');
    const qualified = leads.filter(
      (l) => l.status === 'Qualified' || l.status === 'Converted',
    ).length;
    // Every deal past the Opportunity stage had a proposal (lost deals are lost after one).
    const reachedProposal = count(['Proposal', 'Negotiation', 'Won', 'Lost']);
    return {
      totalLeads: leads.length,
      qualifiedLeads: qualified,
      activeOpportunities: open.length,
      proposalsSubmitted: reachedProposal,
      wonDeals: won.length,
      wonValue: won.reduce((sum, o) => sum + o.value, 0),
      lostDeals: count(['Lost']),
      pipelineValue,
      pipelineChangePercent: Math.round(
        ((pipelineValue - benchmarks.pipelineLastQuarter) /
          benchmarks.pipelineLastQuarter) *
          100,
      ),
      funnel: [
        { stage: 'Lead', count: leads.length },
        { stage: 'Qualified', count: qualified },
        { stage: 'Opportunity', count: opportunities.length },
        { stage: 'Proposal', count: reachedProposal },
        { stage: 'Negotiation', count: count(['Negotiation', 'Won']) },
        { stage: 'Won', count: won.length },
      ],
      leadsByStatus: {
        New: leads.filter((l) => l.status === 'New').length,
        Contacted: leads.filter((l) => l.status === 'Contacted').length,
        Qualified: leads.filter((l) => l.status === 'Qualified').length,
        Unqualified: leads.filter((l) => l.status === 'Unqualified').length,
        Converted: leads.filter((l) => l.status === 'Converted').length,
      },
      byStage: (
        ['Opportunity', 'Proposal', 'Negotiation', 'Won', 'Lost'] as const
      ).map((stage) => {
        const inStage = opportunities.filter((o) => o.stage === stage);
        return {
          stage,
          count: inStage.length,
          value: inStage.reduce((sum, o) => sum + o.value, 0),
        };
      }),
    };
  },

  async listLeads(query: LeadQuery = {}): Promise<Page<Lead>> {
    const items = readData().leads.filter(
      (lead) =>
        matches(query.search, lead.company, lead.contactName, lead.id) &&
        (!query.status || lead.status === query.status) &&
        (!query.source || lead.source === query.source) &&
        (!query.industry || lead.industry === query.industry) &&
        (!query.owner || lead.owner === query.owner),
    );
    return clone(paginate(items, query.page, query.pageSize));
  },

  async listOpportunities(
    query: OpportunityQuery = {},
  ): Promise<Opportunity[]> {
    return clone(
      readData().opportunities.filter(
        (o) =>
          matches(query.search, o.name, o.customerName, o.id, o.product) &&
          (!query.stage || o.stage === query.stage) &&
          (!query.owner || o.owner === query.owner),
      ),
    );
  },

  async getOpportunity(
    id: string,
  ): Promise<{ opportunity: Opportunity; customer: Customer } | null> {
    const data = readData();
    const opportunity = data.opportunities.find((o) => o.id === id);
    const customer =
      opportunity &&
      data.customers.find((c) => c.id === opportunity.customerId);
    return opportunity && customer ? clone({ opportunity, customer }) : null;
  },

  async customers(): Promise<Customer[]> {
    return clone(readData().customers);
  },

  /** Latest timeline entries across all opportunities. */
  async recentActivity(limit = 8): Promise<SalesActivity[]> {
    return readData()
      .opportunities.flatMap((o) =>
        o.timeline.map((entry) => ({
          ...entry,
          opportunityId: o.id,
          opportunityName: o.name,
          customerName: o.customerName,
        })),
      )
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, limit);
  },

  /** Sales executives who own leads or deals. */
  async owners(): Promise<string[]> {
    const { leads, opportunities } = readData();
    return [
      ...new Set([...leads, ...opportunities].map((r) => r.owner)),
    ].sort();
  },

  // ---------- Write side (the real backend checks `create:lead` / `edit:opportunity`) ----------

  async createLead(input: NewLead, actor: Actor): Promise<Lead> {
    return updateData((data) => {
      const lead: Lead = {
        ...input,
        id: nextId(data, 'LD', 2301),
        status: 'New',
        createdAt: new Date().toISOString(),
      };
      data.leads.unshift(lead);
      recordActivity(data, {
        appId: 'app-dealpulse',
        actor: actor.name,
        text: `New lead “${lead.company}” added`,
        link: '/deal-pulse/leads',
      });
      return clone(lead);
    });
  },

  async createOpportunity(
    input: NewOpportunity,
    actor: Actor,
  ): Promise<Opportunity> {
    return updateData((data) => {
      const customer = data.customers.find((c) => c.id === input.customerId);
      if (!customer) throw new Error(`Customer ${input.customerId} not found`);
      const now = new Date().toISOString();
      const id = nextId(data, 'OP', 1050);
      const opportunity: Opportunity = {
        id,
        name: input.name,
        customerId: customer.id,
        customerName: customer.name,
        product: input.product,
        value: input.value,
        stage: 'Opportunity',
        probability: 30,
        owner: input.owner,
        expectedClose: input.expectedClose,
        nextAction: 'Request a solution proposal from the Solutions team',
        nextActionDue: input.expectedClose,
        createdAt: now,
        summary:
          input.summary ||
          `${customer.name} (${customer.industry.toLowerCase()}, ${customer.city}) is evaluating a ${input.product.toLowerCase()} from NPST.`,
        requirements: [...(PRODUCTS[input.product] ?? [])],
        team: [{ name: input.owner, role: 'Account owner' }],
        timeline: [
          {
            id: `${id}-t0`,
            at: now,
            actor: actor.name,
            text: 'Opportunity created',
          },
        ],
        notes: [],
        documents: [],
      };
      data.opportunities.unshift(opportunity);
      recordActivity(data, {
        appId: 'app-dealpulse',
        actor: actor.name,
        text: `Opportunity “${customer.name} – ${input.name}” created`,
        link: `/deal-pulse/opportunities/${id}`,
      });
      sendNotification(data, {
        to: { team: 'ADMIN' },
        title: `New opportunity: ${customer.name}`,
        description: `${actor.name} created “${input.name}” (${id}) in Deal Pulse.`,
        kind: 'info',
        appId: 'app-dealpulse',
        link: `/deal-pulse/opportunities/${id}`,
      });
      return clone(opportunity);
    });
  },

  /**
   * Hands proposal work to the Solutions team: a task in their queue in
   * Projects & Delivery and a notification in their bell (both server side;
   * the two apps never talk to each other in the browser).
   */
  async requestSolutionProposal(
    opportunityId: string,
    request: ProposalRequest,
    actor: Actor,
  ): Promise<Task> {
    return updateData((data) => {
      const opportunity = data.opportunities.find(
        (o) => o.id === opportunityId,
      );
      if (!opportunity)
        throw new Error(`Opportunity ${opportunityId} not found`);
      const now = new Date().toISOString();
      const task: Task = {
        id: nextId(data, 'T', 3501),
        title: request.title,
        description:
          request.note ||
          `Prepare the solution proposal for ${opportunity.customerName} (${opportunity.product}).`,
        appId: 'projects',
        sourceAppId: 'app-dealpulse',
        assignee: { kind: 'team', team: 'SOLUTIONS' },
        priority: request.priority,
        status: 'To do',
        due: request.due,
        opportunityId,
        createdBy: actor.name,
        createdAt: now,
      };
      data.tasks.unshift(task);
      opportunity.timeline.unshift({
        id: nextId(data, 'TL', 1),
        at: now,
        actor: actor.name,
        text: `Solution proposal requested from the Solutions team (${task.id})`,
      });
      opportunity.nextAction = 'Solutions team to prepare the proposal';
      opportunity.nextActionDue = request.due;
      if (!opportunity.team.some((m) => m.role === 'Solutions team')) {
        opportunity.team.push({
          name: 'Solutions team',
          role: 'Proposal preparation',
        });
      }
      sendNotification(data, {
        to: { team: 'SOLUTIONS' },
        title: `Proposal task assigned: ${opportunity.customerName}`,
        description: `${actor.name} asked the Solutions team to “${request.title}” by ${request.due}.`,
        kind: 'info',
        appId: 'projects',
        link: `/projects/tasks?task=${task.id}`,
      });
      recordActivity(data, {
        appId: 'app-dealpulse',
        actor: actor.name,
        text: `Proposal work for “${opportunity.customerName}” assigned to the Solutions team`,
        link: `/deal-pulse/opportunities/${opportunityId}`,
      });
      return clone(task);
    });
  },

  async addNote(
    opportunityId: string,
    text: string,
    actor: Actor,
  ): Promise<Note> {
    return updateData((data) => {
      const opportunity = data.opportunities.find(
        (o) => o.id === opportunityId,
      );
      if (!opportunity)
        throw new Error(`Opportunity ${opportunityId} not found`);
      const note: Note = {
        id: nextId(data, 'NOTE', 1),
        at: new Date().toISOString(),
        author: actor.name,
        text,
      };
      opportunity.notes.unshift(note);
      return clone(note);
    });
  },
};
