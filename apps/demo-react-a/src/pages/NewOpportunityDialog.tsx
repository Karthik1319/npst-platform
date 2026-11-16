import { useCallback, useState, type FormEvent } from 'react';
import { usePortal } from '@/portal';
import { salesService } from '@/services/sales';
import { useLoad } from '@/services/useLoad';
import controls from '@/ui/controls.module.css';
import { Dialog } from '@/ui/Dialog';
import { PRODUCT_OPTIONS } from './AddLeadDialog';

interface NewOpportunityDialogProps {
  onClose: () => void;
  onCreated: (id: string) => void;
}

const inDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Form for a new opportunity with an existing customer or prospect. */
export function NewOpportunityDialog({
  onClose,
  onCreated,
}: NewOpportunityDialogProps) {
  const { user, platform } = usePortal();
  const [customers] = useLoad(salesService.customers);
  const [owners] = useLoad(useCallback(() => salesService.owners(), []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? '').trim();
    setSaving(true);
    setError(null);
    try {
      const opportunity = await salesService.createOpportunity(
        {
          customerId: text('customerId'),
          name: text('name'),
          product: text('product'),
          value: Math.round(Number(text('valueLakh') || '0') * 100_000),
          expectedClose: text('expectedClose'),
          owner: text('owner'),
          summary: text('summary'),
        },
        user,
      );
      platform.notify.toast(
        `Opportunity ${opportunity.id} created for ${opportunity.customerName}`,
        { kind: 'success' },
      );
      onCreated(opportunity.id);
    } catch {
      setError('The opportunity could not be saved. Please try again.');
      setSaving(false);
    }
  }

  return (
    <Dialog title="New opportunity" onClose={onClose}>
      <form className={controls.form} onSubmit={submit}>
        <label className={`${controls.field} ${controls.full}`}>
          Customer
          <select
            className={controls.select}
            name="customerId"
            required
            defaultValue="C-101"
          >
            {customers.status === 'ready' &&
              customers.data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.customerSince ? 'customer' : 'prospect'})
                </option>
              ))}
          </select>
        </label>
        <label className={`${controls.field} ${controls.full}`}>
          Opportunity name
          <input
            className={controls.input}
            name="name"
            required
            placeholder="e.g. UPI Merchant Payments"
          />
        </label>
        <label className={controls.field}>
          Product
          <select className={controls.select} name="product">
            {PRODUCT_OPTIONS.map((product) => (
              <option key={product}>{product}</option>
            ))}
          </select>
        </label>
        <label className={controls.field}>
          Estimated value (₹ lakh)
          <input
            className={controls.input}
            name="valueLakh"
            type="number"
            min="1"
            step="1"
            required
            defaultValue="250"
          />
        </label>
        <label className={controls.field}>
          Expected close
          <input
            className={controls.input}
            name="expectedClose"
            type="date"
            required
            defaultValue={inDays(60)}
          />
        </label>
        <label className={controls.field}>
          Sales executive
          <select className={controls.select} name="owner">
            {owners.status === 'ready' &&
              owners.data.map((owner) => <option key={owner}>{owner}</option>)}
          </select>
        </label>
        <label className={`${controls.field} ${controls.full}`}>
          Summary
          <textarea
            className={controls.textarea}
            name="summary"
            placeholder="What does the customer want to achieve?"
          />
        </label>
        {error && (
          <p role="alert" className={`${controls.urgent} ${controls.full}`}>
            {error}
          </p>
        )}
        <div className={controls.formActions}>
          <button
            type="button"
            className={controls.secondary}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={controls.button}
            disabled={saving || customers.status !== 'ready'}
          >
            {saving ? 'Saving…' : 'Create opportunity'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
