import { useCallback, useState } from 'react';
import { usePortal } from '@/portal';
import { useRouter } from '@/routing/router';
import { salesService, type LeadQuery } from '@/services/sales';
import { useLoad } from '@/services/useLoad';
import { Person } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import controls from '@/ui/controls.module.css';
import { formatDate, formatInr } from '@/ui/format';
import { Icon } from '@/ui/Icon';
import { Pagination } from '@/ui/Pagination';
import { Panel } from '@/ui/Panel';
import { LEAD_STATUS } from '@/ui/status';
import { AddLeadDialog, INDUSTRIES, SOURCES } from './AddLeadDialog';

const STATUSES = [
  'New',
  'Contacted',
  'Qualified',
  'Unqualified',
  'Converted',
] as const;
const PAGE_SIZE = 10;

/** All leads with search, filters and pagination. Sales users can add a lead. */
export function LeadsPage() {
  const { platform } = usePortal();
  const { search: params } = useRouter();
  const canCreate = platform.permissions.can('create', 'lead');
  const [query, setQuery] = useState<LeadQuery>(() => ({
    search: '',
    status: (STATUSES as readonly string[]).includes(params.get('status') ?? '')
      ? (params.get('status') as LeadQuery['status'])
      : '',
    source: '',
    industry: '',
    owner: '',
    page: 1,
  }));
  const [adding, setAdding] = useState(false);
  const [leads, reload] = useLoad(
    useCallback(
      () => salesService.leads({ ...query, pageSize: PAGE_SIZE }),
      [query],
    ),
  );
  const [owners] = useLoad(salesService.owners);
  const update = (change: Partial<LeadQuery>) =>
    setQuery((current) => ({ ...current, page: 1, ...change }));
  const filtered = Boolean(
    query.search ||
    query.status ||
    query.source ||
    query.industry ||
    query.owner,
  );

  return (
    <Panel
      title="All leads"
      actions={
        canCreate && (
          <button
            type="button"
            className={controls.button}
            onClick={() => setAdding(true)}
          >
            <Icon name="plus" size={18} /> Add lead
          </button>
        )
      }
    >
      <div className={controls.toolbar} role="search">
        <label className={controls.searchBox}>
          <Icon name="search" size={16} />
          <input
            className={controls.input}
            type="search"
            placeholder="Search company, contact or ID"
            aria-label="Search leads"
            value={query.search}
            onChange={(event) => update({ search: event.target.value })}
          />
        </label>
        <select
          className={controls.select}
          aria-label="Status"
          value={query.status}
          onChange={(e) =>
            update({ status: e.target.value as LeadQuery['status'] })
          }
        >
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <select
          className={controls.select}
          aria-label="Source"
          value={query.source}
          onChange={(e) => update({ source: e.target.value })}
        >
          <option value="">All sources</option>
          {SOURCES.map((source) => (
            <option key={source}>{source}</option>
          ))}
        </select>
        <select
          className={controls.select}
          aria-label="Industry"
          value={query.industry}
          onChange={(e) => update({ industry: e.target.value })}
        >
          <option value="">All industries</option>
          {INDUSTRIES.map((industry) => (
            <option key={industry}>{industry}</option>
          ))}
        </select>
        <select
          className={controls.select}
          aria-label="Sales executive"
          value={query.owner}
          onChange={(e) => update({ owner: e.target.value })}
        >
          <option value="">All sales executives</option>
          {owners.status === 'ready' &&
            owners.data.map((owner) => <option key={owner}>{owner}</option>)}
        </select>
        {filtered && (
          <button
            type="button"
            className={controls.ghost}
            onClick={() =>
              setQuery({
                search: '',
                status: '',
                source: '',
                industry: '',
                owner: '',
                page: 1,
              })
            }
          >
            Clear filters
          </button>
        )}
      </div>

      {leads.status === 'loading' && <p role="status">Loading leads…</p>}
      {leads.status === 'error' && <p role="alert">Could not load leads.</p>}
      {leads.status === 'ready' && (
        <>
          <div className={controls.tableWrap}>
            <table className={controls.table}>
              <thead>
                <tr>
                  <th scope="col">Lead</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Source</th>
                  <th scope="col">Industry</th>
                  <th scope="col">Sales executive</th>
                  <th scope="col">Status</th>
                  <th scope="col" className={controls.numeric}>
                    Est. value
                  </th>
                  <th scope="col">Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.data.items.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <span className={controls.primaryText}>
                        {lead.company}
                      </span>
                      <span className={controls.subText}>
                        {lead.id} · {lead.city}
                      </span>
                    </td>
                    <td>
                      {lead.contactName}
                      <span className={controls.subText}>
                        {lead.contactTitle}
                      </span>
                    </td>
                    <td>{lead.source}</td>
                    <td>{lead.industry}</td>
                    <td>
                      <Person name={lead.owner} />
                    </td>
                    <td>
                      <Badge variant={LEAD_STATUS[lead.status] ?? 'neutral'}>
                        {lead.status}
                      </Badge>
                    </td>
                    <td className={controls.numeric}>
                      {formatInr(lead.estimatedValue)}
                    </td>
                    <td className={controls.muted}>
                      {formatDate(lead.createdAt.slice(0, 10))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {leads.data.total === 0 && (
            <p className={controls.empty}>No leads match these filters.</p>
          )}
          <Pagination
            label="Leads"
            page={leads.data.page}
            pageSize={PAGE_SIZE}
            total={leads.data.total}
            onPage={(page) => setQuery((current) => ({ ...current, page }))}
          />
        </>
      )}

      {adding && (
        <AddLeadDialog
          owners={owners.status === 'ready' ? owners.data : []}
          onClose={() => setAdding(false)}
          onAdded={() => {
            setAdding(false);
            setQuery({
              search: '',
              status: '',
              source: '',
              industry: '',
              owner: '',
              page: 1,
            });
            reload();
          }}
        />
      )}
    </Panel>
  );
}
