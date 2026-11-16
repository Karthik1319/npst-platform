import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router';

/**
 * Keeps MFE routers in step with the shell's navigation.
 *
 * The shell's router changes the URL with `history.pushState`, which browsers
 * do not announce to other routers on the page (they only hear `popstate`,
 * fired for back/forward). Without this, clicking "Angular" in the nav while
 * Angular shows /angular/page-2 changes the URL but not Angular's page.
 * After each shell navigation we fire the standard `popstate` event, so any
 * MFE router (Angular, React, …) re-reads the URL. No contract change needed.
 */
export function useNotifyMfeRouters(): void {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // POP = back/forward or first load: the browser already announced it.
    if (navigationType !== 'POP') {
      window.dispatchEvent(
        new PopStateEvent('popstate', { state: window.history.state }),
      );
    }
  }, [location, navigationType]);
}
