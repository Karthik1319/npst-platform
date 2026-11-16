import { readData } from '../store';
import type {
  Customer,
  Lead,
  LeadStatus,
  Opportunity,
  OpportunityStage,
} from '../types';
import { clone, matches, paginate, type Page } from './common';

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

/** Simulated Sales Hub backend (read side). */
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
};
