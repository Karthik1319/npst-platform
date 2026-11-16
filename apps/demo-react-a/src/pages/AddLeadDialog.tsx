import { useState, type FormEvent } from 'react';
import { usePortal } from '@/portal';
import { salesService, type NewLead } from '@/services/sales';
import controls from '@/ui/controls.module.css';
import { Dialog } from '@/ui/Dialog';

export const SOURCES = [
  'Website',
  'Referral',
  'Event',
  'Partner',
  'LinkedIn',
  'RFP portal',
  'Cold outreach',
] as const;
export const INDUSTRIES = [
  'Private bank',
  'Co-operative bank',
  'Small finance bank',
  'Payments bank',
  'Regional rural bank',
  'NBFC',
  'Fintech',
] as const;
const PRODUCTS = [
  'Digital Banking Platform',
  'UPI Switch',
  'Video KYC Onboarding',
  'Merchant Acquiring (UPI + Soundbox)',
  'Fraud Risk Management',
  'Payment Gateway',
  'BBPS Integration',
  'Mobile Banking App',
  'API Banking Platform',
  'Loan Origination System',
] as const;

interface AddLeadDialogProps {
  owners: readonly string[];
  onClose: () => void;
  onAdded: () => void;
}

/** Form for a new lead. The portal shows a confirmation toast when it is saved. */
export function AddLeadDialog({
  owners,
  onClose,
  onAdded,
}: AddLeadDialogProps) {
  const { user, platform } = usePortal();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? '').trim();
    const input: NewLead = {
      company: text('company'),
      contactName: text('contactName'),
      contactTitle: text('contactTitle'),
      email: text('email'),
      phone: text('phone'),
      source: text('source') as NewLead['source'],
      industry: text('industry') as NewLead['industry'],
      city: text('city'),
      owner: text('owner'),
      interest: text('interest'),
      estimatedValue: Math.round(Number(text('valueLakh') || '0') * 100_000),
    };
    setSaving(true);
    setError(null);
    try {
      const lead = await salesService.createLead(input, user);
      // MFE → portal: the portal shows the confirmation.
      platform.notify.toast(`Lead “${lead.company}” added (${lead.id})`, {
        kind: 'success',
      });
      onAdded();
    } catch {
      setError('The lead could not be saved. Please try again.');
      setSaving(false);
    }
  }

  return (
    <Dialog title="Add lead" onClose={onClose}>
      <form className={controls.form} onSubmit={submit}>
        <label className={`${controls.field} ${controls.full}`}>
          Company
          <input
            className={controls.input}
            name="company"
            required
            placeholder="e.g. Harbor Urban Co-op Bank"
          />
        </label>
        <label className={controls.field}>
          Contact person
          <input className={controls.input} name="contactName" required />
        </label>
        <label className={controls.field}>
          Designation
          <input
            className={controls.input}
            name="contactTitle"
            placeholder="e.g. Head of IT"
          />
        </label>
        <label className={controls.field}>
          Email
          <input className={controls.input} name="email" type="email" />
        </label>
        <label className={controls.field}>
          Phone
          <input className={controls.input} name="phone" type="tel" />
        </label>
        <label className={controls.field}>
          Source
          <select
            className={controls.select}
            name="source"
            defaultValue="Website"
          >
            {SOURCES.map((source) => (
              <option key={source}>{source}</option>
            ))}
          </select>
        </label>
        <label className={controls.field}>
          Industry
          <select
            className={controls.select}
            name="industry"
            defaultValue="Co-operative bank"
          >
            {INDUSTRIES.map((industry) => (
              <option key={industry}>{industry}</option>
            ))}
          </select>
        </label>
        <label className={controls.field}>
          City
          <input className={controls.input} name="city" />
        </label>
        <label className={controls.field}>
          Interested in
          <select className={controls.select} name="interest">
            {PRODUCTS.map((product) => (
              <option key={product}>{product}</option>
            ))}
          </select>
        </label>
        <label className={controls.field}>
          Sales executive
          <select
            className={controls.select}
            name="owner"
            defaultValue={owners[0]}
          >
            {owners.map((owner) => (
              <option key={owner}>{owner}</option>
            ))}
          </select>
        </label>
        <label className={controls.field}>
          Estimated value (₹ lakh)
          <input
            className={controls.input}
            name="valueLakh"
            type="number"
            min="0"
            step="1"
            defaultValue="50"
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
          <button type="submit" className={controls.button} disabled={saving}>
            {saving ? 'Saving…' : 'Add lead'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
