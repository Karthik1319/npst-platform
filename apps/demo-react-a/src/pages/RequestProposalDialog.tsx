import { useState, type FormEvent } from 'react';
import { usePortal } from '@/portal';
import { salesService, type Opportunity } from '@/services/sales';
import controls from '@/ui/controls.module.css';
import { Dialog } from '@/ui/Dialog';

interface RequestProposalDialogProps {
  opportunity: Opportunity;
  onClose: () => void;
  onSent: () => void;
}

const inDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/**
 * Asks the Solutions team to prepare the proposal. The Sales Hub backend
 * creates the task in the Solutions queue (Projects & Delivery) and the
 * Notification Service tells the team; nothing passes between the two apps
 * in the browser.
 */
export function RequestProposalDialog({
  opportunity,
  onClose,
  onSent,
}: RequestProposalDialogProps) {
  const { user, platform } = usePortal();
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? '').trim();
    setSaving(true);
    const task = await salesService.requestProposal(
      opportunity.id,
      {
        title: text('title'),
        due: text('due'),
        priority: text('priority') as 'High' | 'Medium' | 'Low',
        note: text('note'),
      },
      user,
    );
    platform.notify.toast(
      `Proposal task ${task.id} sent to the Solutions team`,
      { kind: 'success' },
    );
    onSent();
  }

  return (
    <Dialog title="Request solution proposal" onClose={onClose}>
      <form className={controls.form} onSubmit={submit}>
        <p className={`${controls.full} ${controls.subText}`}>
          The Solutions team gets this task in Projects &amp; Delivery and a
          notification in the portal.
        </p>
        <label className={`${controls.field} ${controls.full}`}>
          Task
          <input
            className={controls.input}
            name="title"
            required
            defaultValue={`Prepare solution proposal – ${opportunity.customerName}`}
          />
        </label>
        <label className={controls.field}>
          Assign to
          <input className={controls.input} value="Solutions team" readOnly />
        </label>
        <label className={controls.field}>
          Due
          <input
            className={controls.input}
            name="due"
            type="date"
            required
            defaultValue={inDays(5)}
          />
        </label>
        <label className={controls.field}>
          Priority
          <select
            className={controls.select}
            name="priority"
            defaultValue="High"
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </label>
        <label className={`${controls.field} ${controls.full}`}>
          Notes for the Solutions team
          <textarea
            className={controls.textarea}
            name="note"
            defaultValue={`Customer: ${opportunity.customerName}. Product: ${opportunity.product}. Key requirements are listed on ${opportunity.id}.`}
          />
        </label>
        <div className={controls.formActions}>
          <button
            type="button"
            className={controls.secondary}
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className={controls.button} disabled={saving}>
            {saving ? 'Sending…' : 'Send to Solutions team'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
