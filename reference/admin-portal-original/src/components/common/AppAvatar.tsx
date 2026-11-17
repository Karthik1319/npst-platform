import { cn } from '@/lib/utils';
import { initialsOf } from '@/utils/format';

interface AppAvatarProps {
  name: string;
  color: string;
  src?: string;
  className?: string;
}

/** Rendered application logo: uploaded asset when present, generated initials mark otherwise. */
export function AppAvatar({ name, color, src, className }: AppAvatarProps) {
  if (src) {
    return (
      <div className={cn('grid shrink-0 place-items-center overflow-hidden rounded-xl border border-border/60 bg-white', className)}>
        <img src={src} alt={`${name} logo`} className="size-full object-contain p-1" />
      </div>
    );
  }
  return (
    <div
      className={cn('grid shrink-0 place-items-center rounded-xl font-heading font-bold text-white shadow-sm', className)}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </div>
  );
}
