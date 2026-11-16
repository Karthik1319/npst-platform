import type { PortalApp } from '@npst/shared-contracts';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { useNavigate } from 'react-router';
import { businessData, type SearchResult } from '@/services/business';
import { appVisual } from '@/ui/app-visuals';
import { Icon } from '@/ui/Icon';
import { useDismiss } from '@/ui/useDismiss';
import styles from './HeaderSearch.module.css';

interface Hit {
  key: string;
  title: string;
  subtitle: string;
  kind: string;
  appId: string;
  link: string;
}

/** Shown in the box; Ctrl K (and the Command key equivalent) focuses it. */
const SHORTCUT = 'Ctrl K';

/**
 * One search box for the whole portal: applications, opportunities, leads,
 * projects and people, only from apps the user may open.
 */
export function HeaderSearch({ apps }: { apps: readonly PortalApp[] }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<readonly SearchResult[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const appIds = apps.map((app) => app.id).join(',');
  useEffect(() => {
    let active = true;
    businessData
      .search(query, appIds ? appIds.split(',') : [])
      .then((found) => {
        if (active) setRecords(found);
      });
    return () => {
      active = false;
    };
  }, [query, appIds]);

  // Ctrl K (or Command K) focuses the search from anywhere in the portal.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const needle = query.trim().toLowerCase();
  const appHits: Hit[] =
    needle.length < 2
      ? []
      : apps
          .filter((app) =>
            `${app.name} ${app.description}`.toLowerCase().includes(needle),
          )
          .map((app) => ({
            key: app.id,
            title: app.name,
            subtitle: app.description,
            kind: 'Application',
            appId: app.id,
            link: app.path,
          }));
  const hits: Hit[] = [
    ...appHits,
    ...records.map((r) => ({
      key: `${r.kind}-${r.link}-${r.title}`,
      title: r.title,
      subtitle: r.subtitle,
      kind: r.kind,
      appId: r.appId,
      link: r.link,
    })),
  ];

  function go(hit: Hit) {
    navigate(hit.link);
    setQuery('');
    setOpen(false);
    input.current?.blur();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && hits[0]) go(hits[0]);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      ref.current
        ?.querySelector<HTMLButtonElement>(`#${CSS.escape(listId)} button`)
        ?.focus();
    }
    if (event.key === 'Escape') {
      setOpen(false);
      input.current?.blur();
    }
  }

  function onResultKey(event: KeyboardEvent<HTMLButtonElement>) {
    const item = event.currentTarget.parentElement;
    if (event.key === 'ArrowDown')
      (
        item?.nextElementSibling?.querySelector('button') as HTMLElement | null
      )?.focus();
    if (event.key === 'ArrowUp')
      (
        (item?.previousElementSibling?.querySelector(
          'button',
        ) as HTMLElement | null) ?? input.current
      )?.focus();
    if (event.key === 'Escape') input.current?.focus();
  }

  return (
    <div className={styles.search} ref={ref} role="search">
      <Icon name="search" size={18} className={styles.icon} />
      <input
        ref={input}
        className={styles.input}
        type="search"
        placeholder="Search applications, opportunities, projects, people…"
        aria-label="Search the portal"
        aria-controls={listId}
        aria-expanded={open && needle.length >= 2}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      <kbd className={styles.shortcut}>{SHORTCUT}</kbd>
      {open && needle.length >= 2 && (
        <div className={styles.panel}>
          {hits.length === 0 ? (
            <p className={styles.empty}>No results for “{query.trim()}”.</p>
          ) : (
            <ul
              id={listId}
              className={styles.results}
              aria-label="Search results"
            >
              {hits.slice(0, 10).map((hit) => {
                const visual = appVisual(hit.appId);
                return (
                  <li key={hit.key}>
                    <button
                      type="button"
                      className={styles.result}
                      onClick={() => go(hit)}
                      onKeyDown={onResultKey}
                    >
                      <span
                        className={`${styles.resultIcon} ${styles[`tone${visual.tone}`]}`}
                      >
                        <Icon name={visual.icon} size={16} />
                      </span>
                      <span className={styles.resultText}>
                        <span className={styles.resultTitle}>{hit.title}</span>
                        <span className={styles.resultSub}>{hit.subtitle}</span>
                      </span>
                      <span className={styles.kind}>{hit.kind}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
