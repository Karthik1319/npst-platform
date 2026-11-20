import { cn } from '@/lib/utils';
import styles from './AppLogo.module.css';

export function AppLogo({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(styles.div, className)}>
      <img src="/npst.png" alt="NPST" className={styles.img} />
      {!collapsed && (
        <div className={styles.div2}>
          <p className={styles.p}>NPST Shared Services</p>
        </div>
      )}
    </div>
  );
}
