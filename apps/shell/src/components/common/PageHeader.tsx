import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  testId?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  testId,
}: PageHeaderProps) {
  return (
    <div className={styles.div}>
      <div className={styles.div2}>
        <h1 className={styles.h1} data-testid={testId}>
          {title}
        </h1>
        {description && <p className={styles.p}>{description}</p>}
      </div>
      {actions && <div className={styles.div3}>{actions}</div>}
    </div>
  );
}
