import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';

/*
 * A very small router for the pages inside this app (no extra dependency).
 * The URL is the source of truth: `${basePath}/leads`, `${basePath}/opportunities/OP-1043`.
 * It listens to `popstate`, which the browser fires on back/forward and the
 * portal fires after its own navigation, so it stays in step with the portal.
 */

interface RouterValue {
  /** Path inside this app, always starting with `/` (e.g. `/opportunities/OP-1043`). */
  path: string;
  search: URLSearchParams;
  /** Full URL for a path inside this app. */
  href(to: string): string;
  navigate(to: string): void;
}

const RouterContext = createContext<RouterValue | null>(null);

const trimBase = (basePath: string) =>
  basePath === '/' ? '' : basePath.replace(/\/$/, '');

function readLocation() {
  return { pathname: window.location.pathname, search: window.location.search };
}

export function Router({
  basePath,
  children,
}: {
  basePath: string;
  children: ReactNode;
}) {
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    const onPopState = () => setLocation(readLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const base = trimBase(basePath);
  const href = useCallback(
    (to: string) => `${base}${to === '/' ? '' : to}` || '/',
    [base],
  );
  const navigate = useCallback(
    (to: string) => {
      const url = href(to);
      if (url === window.location.pathname + window.location.search) return;
      window.history.pushState(null, '', url);
      // Tell every router on the page (this app's and the portal's).
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo?.(0, 0);
    },
    [href],
  );

  const value = useMemo<RouterValue>(() => {
    const inside = location.pathname.startsWith(base)
      ? location.pathname.slice(base.length)
      : '/';
    return {
      path: inside === '' ? '/' : inside,
      search: new URLSearchParams(location.search),
      href,
      navigate,
    };
  }, [location, base, href, navigate]);

  return <RouterContext value={value}>{children}</RouterContext>;
}

export function useRouter(): RouterValue {
  const router = useContext(RouterContext);
  if (!router) throw new Error('useRouter() must be used inside <Router>');
  return router;
}

interface LinkProps {
  to: string;
  className?: string;
  children: ReactNode;
  'aria-current'?: 'page' | undefined;
}

/** A normal link (works with new tab, copy link, etc.) that navigates inside the app. */
export function Link({ to, className, children, ...rest }: LinkProps) {
  const { href, navigate } = useRouter();
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    navigate(to);
  }
  return (
    <a href={href(to)} className={className} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}
