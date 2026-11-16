import { readData } from '../store';
import type { AppId } from '../types';
import { matches } from './common';

export interface SearchResult {
  appId: AppId;
  kind: 'Opportunity' | 'Lead' | 'Project' | 'Employee';
  title: string;
  subtitle: string;
  link: string;
}

/**
 * Simulated portal search service: one query across the business apps.
 * It only searches apps the user may open (the real service checks the
 * user's permissions itself).
 */
export const searchApi = {
  async search(
    query: string,
    appIds: readonly string[],
    perKind = 4,
  ): Promise<SearchResult[]> {
    if (query.trim().length < 2) return [];
    const data = readData();
    const results: SearchResult[] = [];
    if (appIds.includes('sales-hub')) {
      results.push(
        ...data.opportunities
          .filter((o) =>
            matches(query, o.id, o.name, o.customerName, o.product),
          )
          .slice(0, perKind)
          .map((o): SearchResult => ({
            appId: 'sales-hub',
            kind: 'Opportunity',
            title: `${o.customerName} – ${o.name}`,
            subtitle: `${o.id} · ${o.stage}`,
            link: `/sales/opportunities/${o.id}`,
          })),
        ...data.leads
          .filter((l) => matches(query, l.id, l.company, l.contactName))
          .slice(0, perKind)
          .map((l): SearchResult => ({
            appId: 'sales-hub',
            kind: 'Lead',
            title: l.company,
            subtitle: `${l.id} · ${l.contactName} · ${l.status}`,
            link: '/sales/leads',
          })),
      );
    }
    if (appIds.includes('projects')) {
      results.push(
        ...data.projects
          .filter((p) =>
            matches(query, p.id, p.name, p.customerName, p.manager),
          )
          .slice(0, perKind)
          .map((p): SearchResult => ({
            appId: 'projects',
            kind: 'Project',
            title: p.name,
            subtitle: `${p.id} · ${p.customerName} · ${p.status}`,
            link: `/projects/${p.id}`,
          })),
      );
    }
    if (appIds.includes('people-hr')) {
      results.push(
        ...data.employees
          .filter((e) => matches(query, e.id, e.name, e.designation))
          .slice(0, perKind)
          .map((e): SearchResult => ({
            appId: 'people-hr',
            kind: 'Employee',
            title: e.name,
            subtitle: `${e.id} · ${e.designation}, ${e.department}`,
            link: `/people/employees/${e.id}`,
          })),
      );
    }
    return results;
  },
};
