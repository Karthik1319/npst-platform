import { cn } from '@/lib/utils';

const TONES: Record<string, string> = {
  // success
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  published: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  integrated: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  configured: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  // info
  'pending-approval': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  medium: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  // warning
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  draft: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  partial: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  high: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  // destructive
  failed: 'bg-red-50 text-red-700 ring-red-600/20',
  overdue: 'bg-red-50 text-red-700 ring-red-600/20',
  critical: 'bg-red-50 text-red-700 ring-red-600/20',
  destructive: 'bg-red-50 text-red-700 ring-red-600/20',
  // neutral
  inactive: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  'not-configured': 'bg-slate-100 text-slate-600 ring-slate-500/20',
  'not-integrated': 'bg-slate-100 text-slate-600 ring-slate-500/20',
  low: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  'one-time': 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export function statusTone(value: string): string {
  return TONES[value] ?? TONES.neutral;
}

interface StatusBadgeProps {
  value: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ value, label, className }: StatusBadgeProps) {
  const pretty =
    label ?? value.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        statusTone(value),
        className,
      )}
      data-testid={`status-badge-${value}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {pretty}
    </span>
  );
}
