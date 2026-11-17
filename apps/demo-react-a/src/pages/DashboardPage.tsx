import { useCallback } from 'react';
import { Link } from '@/routing/router';
import { salesService } from '@/services/sales';
import { useLoad } from '@/services/useLoad';
import { Badge } from '@/ui/Badge';
import controls from '@/ui/controls.module.css';
import { dueInfo, formatInr, timeAgo } from '@/ui/format';
import { Icon } from '@/ui/Icon';
import { Kpi, kpiListClass } from '@/ui/Kpi';
import { Panel } from '@/ui/Panel';
import { ProgressBar } from '@/ui/ProgressBar';
import { STAGE } from '@/ui/status';
import { ACTIVITY_ICON, assigneeName } from '@/ui/tasks';
import styles from './pages.module.css';

/** Deal Pulse home: pipeline figures, stage breakdown, follow-ups and recent activity. */
export function DashboardPage() {
  const [summary] = useLoad(salesService.summary);
  const [activity] = useLoad(
    useCallback(() => salesService.recentActivity(7), []),
  );
  const [tasks] = useLoad(salesService.tasks);
  const [deals] = useLoad(useCallback(() => salesService.opportunities(), []));

  const s = summary.status === 'ready' ? summary.data : null;
  const followUps =
    tasks.status === 'ready'
      ? tasks.data
          .filter((t) => t.status !== 'Done')
          .sort((a, b) => a.due.localeCompare(b.due))
          .slice(0, 6)
      : [];
  const topDeals =
    deals.status === 'ready'
      ? deals.data
          .filter((o) =>
            ['Opportunity', 'Proposal', 'Negotiation'].includes(o.stage),
          )
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
      : [];
  const openStages = s?.byStage ?? [];
  const maxValue = Math.max(1, ...openStages.map((row) => row.value));

  return (
    <>
      {summary.status === 'error' && (
        <p role="alert">Could not load the sales figures.</p>
      )}
      {s && (
        <ul className={kpiListClass} aria-label="Sales figures">
          <Kpi
            label="Total leads"
            value={String(s.totalLeads)}
            icon="leads"
            tone={1}
            note={`${s.leadsByStatus.New} new this period`}
          />
          <Kpi
            label="Qualified leads"
            value={String(s.qualifiedLeads)}
            icon="checkCircle"
            tone={2}
            note={`${Math.round((s.qualifiedLeads / Math.max(1, s.totalLeads)) * 100)}% of all leads`}
          />
          <Kpi
            label="Active opportunities"
            value={String(s.activeOpportunities)}
            icon="opportunity"
            tone={3}
            note="Opportunity to negotiation"
          />
          <Kpi
            label="Proposals submitted"
            value={String(s.proposalsSubmitted)}
            icon="file"
            tone={4}
            note="Including won and lost"
          />
          <Kpi
            label="Won deals"
            value={String(s.wonDeals)}
            icon="trophy"
            tone={2}
            note={`${formatInr(s.wonValue)} contracted`}
          />
          <Kpi
            label="Pipeline value"
            value={formatInr(s.pipelineValue)}
            icon="rupee"
            tone={1}
            note={`${s.pipelineChangePercent >= 0 ? '+' : ''}${s.pipelineChangePercent}% vs last quarter`}
          />
        </ul>
      )}

      <div className={styles.grid2}>
        <Panel
          title="Pipeline by stage"
          link={{ to: '/opportunities', label: 'All opportunities' }}
        >
          <ul className={styles.stageRows}>
            {openStages.map((row) => (
              <li key={row.stage} className={styles.stageRow}>
                <Badge variant={STAGE[row.stage] ?? 'neutral'}>
                  {row.stage}
                </Badge>
                <ProgressBar
                  value={(row.value / maxValue) * 100}
                  variant={
                    row.stage === 'Won'
                      ? 'good'
                      : row.stage === 'Lost'
                        ? 'bad'
                        : 'primary'
                  }
                  label={`${row.stage}: ${formatInr(row.value)}`}
                />
                <span className={styles.stageValue}>
                  {formatInr(row.value)}{' '}
                  <span className={controls.muted}>· {row.count}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Follow-ups due"
          link={{ to: '/tasks', label: 'All tasks' }}
        >
          {followUps.length === 0 && tasks.status === 'ready' && (
            <p className={controls.empty}>No open follow-ups.</p>
          )}
          <ul className={styles.list}>
            {followUps.map((task) => {
              const due = dueInfo(task.due);
              return (
                <li key={task.id}>
                  <span className={styles.listIcon}>
                    <Icon
                      name={ACTIVITY_ICON[task.activity ?? ''] ?? 'tasks'}
                      size={16}
                    />
                  </span>
                  <span className={styles.listTitle}>
                    {task.opportunityId ? (
                      <Link
                        to={`/opportunities/${task.opportunityId}`}
                        className={controls.primaryText}
                      >
                        {task.title}
                      </Link>
                    ) : (
                      <span className={controls.primaryText}>{task.title}</span>
                    )}
                    <span className={controls.subText}>
                      {assigneeName(task)}
                    </span>
                  </span>
                  <span
                    className={`${styles.due} ${due.state === 'overdue' || due.state === 'today' ? styles.dueUrgent : ''}`}
                  >
                    {due.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <div className={styles.grid2}>
        <Panel title="Top open opportunities">
          <div className={controls.tableWrap}>
            <table className={controls.table}>
              <thead>
                <tr>
                  <th scope="col">Opportunity</th>
                  <th scope="col">Stage</th>
                  <th scope="col" className={controls.numeric}>
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {topDeals.map((deal) => (
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
                    <td>
                      <Badge variant={STAGE[deal.stage] ?? 'neutral'}>
                        {deal.stage}
                      </Badge>
                    </td>
                    <td className={controls.numeric}>
                      {formatInr(deal.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Recent sales activities">
          <ul className={styles.timeline}>
            {activity.status === 'ready' &&
              activity.data.map((entry) => (
                <li
                  key={entry.id}
                  className={entry.appId ? styles.fromOtherTeam : undefined}
                >
                  <span className={styles.timelineText}>
                    {entry.text} ·{' '}
                    <Link
                      to={`/opportunities/${entry.opportunityId}`}
                      className={controls.primaryText}
                    >
                      {entry.customerName}
                    </Link>
                  </span>
                  <span className={styles.timelineMeta}>
                    {entry.actor} · {timeAgo(entry.at)}
                  </span>
                </li>
              ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
