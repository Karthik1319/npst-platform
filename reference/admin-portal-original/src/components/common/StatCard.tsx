import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type StatTone = 'blue' | 'sky' | 'green' | 'amber' | 'red' | 'slate';

const TONE_CLASSES: Record<StatTone, string> = {
  blue: 'bg-blue-50 text-blue-600',
  sky: 'bg-sky-50 text-sky-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  slate: 'bg-slate-100 text-slate-600',
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: StatTone;
  foot?: ReactNode;
  testId?: string;
}

export function StatCard({ label, value, icon: Icon, tone = 'blue', foot, testId }: StatCardProps) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      data-testid={testId}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={cn('grid size-9 shrink-0 place-items-center rounded-lg', TONE_CLASSES[tone])}>
          <Icon className="size-[18px]" />
        </div>
      </div>
      <p className="mt-3 font-heading text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {foot && <div className="mt-1.5 text-xs text-muted-foreground">{foot}</div>}
    </div>
  );
}
