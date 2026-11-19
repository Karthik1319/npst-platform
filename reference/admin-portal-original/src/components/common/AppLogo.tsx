import { cn } from '@/lib/utils';

export function AppLogo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img src="/npst.png" alt="NPST" className="h-9 w-auto max-w-36 shrink-0 object-contain" />
      {!collapsed && (
        <div className="leading-tight">
          <p className="font-heading text-sm font-bold tracking-tight text-white">NPST Shared Services</p>
        </div>
      )}
    </div>
  );
}
