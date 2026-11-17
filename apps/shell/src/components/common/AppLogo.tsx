import { cn } from '@/lib/utils';
import styles from './AppLogo.module.css';

/**
 * Portal name in the sidebar. The original also showed an "N" logo mark; the
 * portal intentionally shows no logo, so only the name remains.
 */
export function AppLogo({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(styles.div, className)}>
      {!collapsed && (
        <div className={styles.div3}>
          <p className={styles.p}>NPST Shared Services</p>
          <p className={styles.p2}>Admin Portal</p>
        </div>
      )}
    </div>
  );
}
