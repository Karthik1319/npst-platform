import type { AuditEntry } from '@npst/shared-contracts';
import { useCallback, useState, type FormEvent } from 'react';
import { usePortal } from '@/portal';
import { Link } from '@/routing/router';
import { salesService, type Task } from '@/services/sales';
import { useLoad } from '@/services/useLoad';
import { Person } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import controls from '@/ui/controls.module.css';
import { dueInfo, formatDate, formatInr, timeAgo } from '@/ui/format';
import { Icon } from '@/ui/Icon';
import { Panel } from '@/ui/Panel';
import { PRIORITY, STAGE, TASK_STATUS } from '@/ui/status';
import { assigneeName, canWorkOn } from '@/ui/tasks';
import styles from './pages.module.css';

const STEPS = ['Opportunity', 'Proposal', 'Negotiation', 'Won'] as const;

/** One opportunity: customer, scope, team, activity, notes, tasks and documents. */
export function OpportunityDetailsPage({ id }: { id: string }) {
  const { user, platform } = usePortal();
  const canEdit = platform.permissions.can('edit', 'opportunity');
  const canAudit = platform.permissions.can('view', 'audit');
  const [found, reload] = useLoad(
    useCallback(() => salesService.opportunity(id), [id]),
  );
  const [tasks, reloadTasks] = useLoad(
    useCallback(() => salesService.tasksFor(id), [id]),
  );
  const [history] = useLoad(
    useCallback(
      (): Promise<readonly AuditEntry[]> =>
        canAudit
          ? platform.audit.history('opportunity', id)
          : Promise.resolve([]),
      [canAudit, platform, id],
    ),
  );

  if (found.status === 'loading')
    return <p role="status">Loading opportunity…</p>;
  if (found.status === 'error')
    return <p role="alert">Could not load this opportunity.</p>;
  if (found.data === null) {
    return (
      <div className={styles.notFound}>
        <h2>Opportunity {id} was not found</h2>
        <Link to="/opportunities" className={styles.back}>
          <Icon name="arrowLeft" size={16} /> Back to opportunities
        </Link>
      </div>
    );
  }

  const { opportunity: deal, customer } = found.data;
  const stepIndex = STEPS.indexOf(deal.stage as (typeof STEPS)[number]);

  async function completeTask(task: Task) {
    await salesService.setTaskStatus(task.id, 'Done', user);
    platform.notify.toast(`Task completed: ${task.title}`, { kind: 'success' });
    reloadTasks();
    reload();
  }

  return (
    <>
      <Link to="/opportunities" className={styles.back}>
        <Icon name="arrowLeft" size={16} /> Opportunities
      </Link>

      <div className={styles.hero}>
        <div>
          <div className={styles.heroMeta}>
            <span>{deal.id}</span>
            <Badge variant={STAGE[deal.stage] ?? 'neutral'}>{deal.stage}</Badge>
          </div>
          <h2 className={styles.heroTitle}>
            {deal.customerName} – {deal.name}
          </h2>
          <div className={styles.heroMeta}>
            <Icon name="building" size={16} /> {customer.industry},{' '}
            {customer.city}
          </div>
        </div>
        <dl className={styles.heroFacts}>
          <div>
            <dt>Est. value</dt>
            <dd>{formatInr(deal.value)}</dd>
          </div>
          <div>
            <dt>Probability</dt>
            <dd>{deal.probability}%</dd>
          </div>
          <div>
            <dt>Expected close</dt>
            <dd>{formatDate(deal.expectedClose)}</dd>
          </div>
          <div>
            <dt>Owner</dt>
            <dd>{deal.owner}</dd>
          </div>
        </dl>
      </div>

      <Panel title="Current stage">
        <ol className={styles.steps} aria-label="Stage progress">
          {STEPS.map((step, index) => {
            let state = '';
            if (deal.stage === 'Lost' && index === 1)
              state = styles.stepLost ?? '';
            else if (deal.stage === 'Won')
              state =
                index === 3 ? (styles.stepWon ?? '') : (styles.stepDone ?? '');
            else if (index < stepIndex) state = styles.stepDone ?? '';
            else if (index === stepIndex) state = styles.stepCurrent ?? '';
            return (
              <li
                key={step}
                className={state}
                aria-current={index === stepIndex ? 'step' : undefined}
              >
                {deal.stage === 'Lost' && index === 1
                  ? 'Lost after proposal'
                  : step}
              </li>
            );
          })}
        </ol>
      </Panel>

      <div className={styles.detailGrid}>
        <div className={styles.column}>
          <Panel title="Overview">
            <p className={styles.summary}>{deal.summary}</p>
            <dl className={styles.facts}>
              <dt>Product</dt>
              <dd>{deal.product}</dd>
              <dt>Created</dt>
              <dd>{formatDate(deal.createdAt.slice(0, 10))}</dd>
              <dt>Next action</dt>
              <dd>
                {deal.nextAction} ·{' '}
                <strong>{dueInfo(deal.nextActionDue).label}</strong>
              </dd>
              {deal.lostReason && (
                <>
                  <dt>Lost reason</dt>
                  <dd>{deal.lostReason}</dd>
                </>
              )}
            </dl>
          </Panel>

          <Panel title="Requirements">
            <ul className={styles.checklist}>
              {deal.requirements.map((requirement) => (
                <li key={requirement}>
                  <Icon name="checkCircle" size={18} />
                  {requirement}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Activity timeline">
            <ul className={styles.timeline}>
              {deal.timeline.map((entry) => (
                <li
                  key={entry.id}
                  className={entry.appId ? styles.fromOtherTeam : undefined}
                >
                  <span className={styles.timelineText}>{entry.text}</span>
                  <span className={styles.timelineMeta}>
                    {entry.actor}
                    {entry.appId === 'projects'
                      ? ' (Projects & Delivery)'
                      : ''}{' '}
                    · {timeAgo(entry.at)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <NotesPanel
            id={deal.id}
            notes={deal.notes}
            canEdit={canEdit}
            onAdded={reload}
          />
        </div>

        <div className={styles.column}>
          <Panel title="Customer">
            <dl className={styles.facts}>
              <dt>Name</dt>
              <dd>{customer.name}</dd>
              <dt>Type</dt>
              <dd>{customer.industry}</dd>
              <dt>Location</dt>
              <dd>{customer.city}</dd>
              <dt>Relationship</dt>
              <dd>
                {customer.customerSince
                  ? `Customer since ${customer.customerSince}`
                  : 'Prospect'}
              </dd>
              <dt>Contact</dt>
              <dd>
                {customer.contactName}
                <span className={controls.subText}>
                  {customer.contactTitle}
                </span>
              </dd>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${customer.email}`}>{customer.email}</a>
              </dd>
              <dt>Phone</dt>
              <dd>{customer.phone}</dd>
            </dl>
          </Panel>

          <Panel title="Assigned team">
            <ul className={styles.list}>
              {deal.team.map((member) => (
                <li key={member.name}>
                  <Person name={member.name} detail={member.role} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Related tasks">
            {tasks.status === 'ready' && tasks.data.length === 0 && (
              <p className={controls.empty}>No tasks yet.</p>
            )}
            <ul className={styles.list}>
              {tasks.status === 'ready' &&
                tasks.data.map((task) => {
                  const due = dueInfo(task.due);
                  const open = task.status !== 'Done';
                  return (
                    <li key={task.id}>
                      <Badge variant={TASK_STATUS[task.status] ?? 'neutral'}>
                        {task.status}
                      </Badge>
                      <span className={styles.listTitle}>
                        {task.title}
                        <span className={controls.subText}>
                          {assigneeName(task)} ·{' '}
                          <Badge variant={PRIORITY[task.priority] ?? 'neutral'}>
                            {task.priority}
                          </Badge>{' '}
                          {open
                            ? `due ${due.label.toLowerCase()}`
                            : task.completedBy
                              ? `done by ${task.completedBy}`
                              : 'completed'}
                        </span>
                      </span>
                      {open &&
                      canEdit &&
                      task.appId === 'sales-hub' &&
                      canWorkOn(task, user) ? (
                        <button
                          type="button"
                          className={controls.ghost}
                          onClick={() => void completeTask(task)}
                        >
                          <Icon name="check" size={16} /> Done
                        </button>
                      ) : (
                        <span />
                      )}
                    </li>
                  );
                })}
            </ul>
          </Panel>

          <Panel title="Documents and proposals">
            <ul className={styles.list}>
              {deal.documents.map((doc) => (
                <li key={doc.id}>
                  <span className={styles.docIcon}>
                    <Icon name="file" size={16} />
                  </span>
                  <span className={styles.listTitle}>
                    <span className={controls.primaryText}>{doc.name}</span>
                    <span className={controls.subText}>
                      {doc.kind} ·{' '}
                      {doc.sizeKb >= 1024
                        ? `${(doc.sizeKb / 1024).toFixed(1)} MB`
                        : `${doc.sizeKb} KB`}{' '}
                      · {doc.uploadedBy},{' '}
                      {formatDate(doc.uploadedAt.slice(0, 10))}
                    </span>
                  </span>
                  <span />
                </li>
              ))}
            </ul>
          </Panel>

          {canAudit && (
            <Panel title="Change history">
              {history.status === 'ready' && history.data.length === 0 && (
                <p className={controls.empty}>No recorded changes.</p>
              )}
              <ul className={styles.timeline}>
                {history.status === 'ready' &&
                  history.data.map((entry) => (
                    <li key={entry.id}>
                      <span className={styles.timelineText}>
                        {entry.summary}
                      </span>
                      <span className={styles.timelineMeta}>
                        {entry.changedBy} ·{' '}
                        {formatDate(entry.changedAt.slice(0, 10))}
                      </span>
                    </li>
                  ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

function NotesPanel({
  id,
  notes,
  canEdit,
  onAdded,
}: {
  id: string;
  notes: readonly { id: string; at: string; author: string; text: string }[];
  canEdit: boolean;
  onAdded: () => void;
}) {
  const { user } = usePortal();
  const [text, setText] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    await salesService.addNote(id, text.trim(), user);
    setText('');
    onAdded();
  }

  return (
    <Panel title="Comments and notes">
      {notes.map((note) => (
        <div key={note.id} className={styles.note}>
          <p>{note.text}</p>
          <span className={styles.timelineMeta}>
            {note.author} · {timeAgo(note.at)}
          </span>
        </div>
      ))}
      {canEdit && (
        <form className={styles.noteForm} onSubmit={submit}>
          <textarea
            className={controls.textarea}
            aria-label="New note"
            placeholder="Add a note for the team…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            className={controls.button}
            disabled={!text.trim()}
          >
            <Icon name="send" size={16} /> Add note
          </button>
        </form>
      )}
    </Panel>
  );
}
