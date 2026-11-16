import { Icon } from '@/ui/Icon';
import styles from './controls.module.css';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  label: string;
  onPage: (page: number) => void;
}

/** "Showing 1–10 of 124" with previous/next and page numbers. */
export function Pagination({
  page,
  pageSize,
  total,
  label,
  onPage,
}: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);
  // Up to five page numbers around the current page.
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const numbers = Array.from(
    { length: Math.min(5, pages) },
    (_, i) => start + i,
  );

  return (
    <nav className={styles.pagination} aria-label={`${label} pages`}>
      <span>
        Showing {first}–{last} of {total}
      </span>
      <span className={styles.pages}>
        <button
          type="button"
          className={styles.pageButton}
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <Icon name="chevronLeft" size={16} />
        </button>
        {numbers.map((n) => (
          <button
            key={n}
            type="button"
            className={styles.pageButton}
            aria-current={n === page ? 'page' : undefined}
            onClick={() => onPage(n)}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          className={styles.pageButton}
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          <Icon name="chevronRight" size={16} />
        </button>
      </span>
    </nav>
  );
}
