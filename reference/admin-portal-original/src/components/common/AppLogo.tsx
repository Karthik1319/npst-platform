import { cn } from '@/lib/utils';

export function AppLogo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 shadow-md shadow-blue-950/30">
        <span className="font-heading text-lg font-extrabold tracking-tight text-white">N</span>
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <p className="font-heading text-sm font-bold tracking-tight text-white">NPST Shared Services</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-sky-300/80">Admin Portal</p>
        </div>
      )}
    </div>
  );
}
