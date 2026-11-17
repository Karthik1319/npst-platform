import { useCssVars } from '@/lib/css-vars';
import { cn } from '@/lib/utils';
import { initialsOf } from '@/utils/format';
import styles from './AppAvatar.module.css';

interface AppAvatarProps {
  name: string;
  color: string;
  src?: string;
  className?: string;
}

/** Rendered application logo: uploaded asset when present, generated initials mark otherwise. */
export function AppAvatar({ name, color, src, className }: AppAvatarProps) {
  const ref = useCssVars<HTMLDivElement>({ '--app-avatar-color': color });
  if (src) {
    return (
      <div className={cn(styles.div, className)}>
        <img
          src={src}
          alt={`${name} logo`}
          className={`${styles.img} npst-sized`}
        />
      </div>
    );
  }
  return (
    <div
      ref={ref}
      className={cn(styles.div2, styles.color, className)}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </div>
  );
}
