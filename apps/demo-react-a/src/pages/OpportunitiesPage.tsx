import { useCallback, useState } from 'react';
import { Link, useRouter } from '@/routing/router';
import { salesService, type OpportunityQuery } from '@/services/sales';
import { useLoad } from '@/services/useLoad';
import { Person } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import controls from '@/ui/controls.module.css';
import { dueInfo, formatDate, formatInr } from '@/ui/format';
import { Icon } from '@/ui/Icon';
import { Pagination } from '@/ui/Pagination';
import { Panel } from '@/ui/Panel';
import { ProgressBar } from '@/ui/ProgressBar';
import { STAGE } from '@/ui/status';
import styles from './pages.module.css';

type Stage = NonNullable<OpportunityQuery['stage']>;

const PAGE_SIZE = 10;

/** The pipeline as stages, then every opportunity in a table. */
export function OpportunitiesPage() {
  const { search: params } = useRouter();
  const initialStage = params.get('stage') ?? '';
  const [query, setQuery] = useState<OpportunityQuery>({
    search: '',
    owner: '',
    stage: (['Opportunity', 'Proposal', 'Negotiation', 'Won', 'Lost'].includes(
      initialStage,
    )
      ? initialStage
      : '') as Stage,
  });
  const [page, setPage] = useState(1);
  const [summary] = useLoad(salesService.summary);
  const [owners] = useLoad(salesService.owners);
  const [deals] = useLoad(
    useCallback(() => salesService.opportunities(query), [query]),
  );
  const s = summary.status === 'ready' ? summary.data : null;
  const stageCount = (stage: string) =>
    s?.byStage.find((row) => row.stage === stage);
  const changeQuery = (change: (q: OpportunityQuery) => OpportunityQuery) => {
    setQuery(change);
    setPage(1);
  };
  const toggleStage = (stage: Stage) =>
    changeQuery((q) => ({ ...q, stage: q.stage === stage ? '' : stage }));

  return (
    <>
      <Panel title="Sales pipeline">
        {s && (
          <ol className={styles.stages} aria-label="Pipeline stages">
            <li>
              <Link to="/leads?status=New" className={styles.stage}>
                <span className={styles.stageName}>Lead</span>
                <span className={styles.stageCount}>
                  {s.leadsByStatus.New + s.leadsByStatus.Contacted}
                </span>
                <span className={styles.stageMeta}>New and contacted</span>
              </Link>
            </li>
            <li>
              <Link to="/leads?status=Qualified" className={styles.stage}>
                <span className={styles.stageName}>Qualified</span>
                <span className={styles.stageCount}>
                  {s.leadsByStatus.Qualified}
                </span>
                <span className={styles.stageMeta}>Ready to convert</span>
              </Link>
            </li>
            {(['Opportunity', 'Proposal', 'Negotiation'] as const).map(
              (stage) => (
                <li key={stage}>
                  <button
                    type="button"
                    className={styles.stage}
                    aria-pressed={query.stage === stage}
                    onClick={() => toggleStage(stage)}
                  >
                    <span className={styles.stageName}>{stage}</span>
                    <span className={styles.stageCount}>
                      {stageCount(stage)?.count ?? 0}
                    </span>
                    <span className={styles.stageMeta}>
                      {formatInr(stageCount(stage)?.value ?? 0)}
                    </span>
                  </button>
                </li>
              ),
            )}
            <li>
              <div className={styles.stageSplit}>
                {(['Won', 'Lost'] as const).map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    className={styles.stage}
                    aria-pressed={query.stage === stage}
                    onClick={() => toggleStage(stage)}
                  >
                    <span className={styles.stageName}>{stage}</span>
                    <span className={styles.stageCount}>
                      {stageCount(stage)?.count ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            </li>
          </ol>
        )}
      </Panel>

      <Panel title={query.stage ? `${query.stage} stage` : 'All opportunities'}>
        <div className={controls.toolbar} role="search">
          <label className={controls.searchBox}>
            <Icon name="search" size={16} />
            <input
              className={controls.input}
              type="search"
              placeholder="Search opportunity, customer or ID"
              aria-label="Search opportunities"
              value={query.search}
              onChange={(e) =>
                changeQuery((q) => ({ ...q, search: e.target.value }))
              }
            />
          </label>
          <select
            className={controls.select}
            aria-label="Stage"
            value={query.stage}
            onChange={(e) =>
              changeQuery((q) => ({ ...q, stage: e.target.value as Stage }))
            }
          >
            <option value="">All stages</option>
            {['Opportunity', 'Proposal', 'Negotiation', 'Won', 'Lost'].map(
              (stage) => (
                <option key={stage}>{stage}</option>
              ),
            )}
          </select>
          <select
            className={controls.select}
            aria-label="Sales executive"
            value={query.owner}
            onChange={(e) =>
              changeQuery((q) => ({ ...q, owner: e.target.value }))
            }
          >
            <option value="">All sales executives</option>
            {owners.status === 'ready' &&
              owners.data.map((owner) => <option key={owner}>{owner}</option>)}
          </select>
          <span className={controls.spacer} />
          {deals.status === 'ready' && (
            <span className={controls.muted}>
              {deals.data.length} opportunities ·{' '}
              {formatInr(deals.data.reduce((sum, o) => sum + o.value, 0))}
            </span>
          )}
        </div>

        {deals.status === 'loading' && (
          <p role="status">Loading opportunities…</p>
        )}
        {deals.status === 'error' && (
          <p role="alert">Could not load opportunities.</p>
        )}
        {deals.status === 'ready' && (
          <div className={controls.tableWrap}>
            <table className={controls.table}>
              <thead>
                <tr>
                  <th scope="col">Opportunity</th>
                  <th scope="col" className={controls.numeric}>
                    Est. value
                  </th>
                  <th scope="col">Stage</th>
                  <th scope="col">Sales executive</th>
                  <th scope="col">Expected close</th>
                  <th scope="col">Probability</th>
                  <th scope="col">Next action</th>
                </tr>
              </thead>
              <tbody>
                {deals.data
                  .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                  .map((deal) => {
                    const closed =
                      deal.stage === 'Won' || deal.stage === 'Lost';
                    const due = dueInfo(deal.nextActionDue);
                    return (
                      <tr key={deal.id}>
                        <td>
                          <Link
                            to={`/opportunities/${deal.id}`}
                            className={controls.primaryText}
                          >
                            {deal.customerName}
                          </Link>
                          <span className={controls.subText}>
                            {deal.id} · {deal.name}
                          </span>
                        </td>
                        <td className={controls.numeric}>
                          {formatInr(deal.value)}
                        </td>
                        <td>
                          <Badge variant={STAGE[deal.stage] ?? 'neutral'}>
                            {deal.stage}
                          </Badge>
                        </td>
                        <td>
                          <Person name={deal.owner} />
                        </td>
                        <td className={controls.muted}>
                          {formatDate(deal.expectedClose)}
                        </td>
                        <td>
                          <span className={controls.muted}>
                            {deal.probability}%
                          </span>
                          <ProgressBar
                            value={deal.probability}
                            variant={
                              deal.stage === 'Lost'
                                ? 'bad'
                                : deal.probability >= 70
                                  ? 'good'
                                  : 'primary'
                            }
                            label={`Probability ${deal.probability}%`}
                          />
                        </td>
                        <td>
                          {closed ? (
                            <span className={controls.muted}>
                              {deal.stage === 'Won'
                                ? 'Handed over to delivery'
                                : deal.lostReason}
                            </span>
                          ) : (
                            <>
                              {deal.nextAction}
                              <span
                                className={
                                  due.state === 'overdue' ||
                                  due.state === 'today'
                                    ? `${controls.subText} ${controls.urgent}`
                                    : controls.subText
                                }
                              >
                                {due.state === 'overdue'
                                  ? `Overdue · ${formatDate(deal.nextActionDue)}`
                                  : due.label}
                              </span>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {deals.data.length === 0 && (
              <p className={controls.empty}>
                No opportunities match these filters.
              </p>
            )}
            <Pagination
              label="Opportunities"
              page={page}
              pageSize={PAGE_SIZE}
              total={deals.data.length}
              onPage={setPage}
            />
          </div>
        )}
      </Panel>
    </>
  );
}
