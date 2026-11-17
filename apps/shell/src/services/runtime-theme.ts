/** Where the brand server publishes the current theme. */
export const RUNTIME_THEME_URL: string =
  import.meta.env['VITE_BRAND_THEME_URL'] ?? 'http://localhost:4204/theme.css';

export const RUNTIME_THEME_LINK_ID = 'npst-runtime-theme';

/**
 * Loads the brand server's `theme.css` at runtime, so a brand change applies
 * to the portal and every MFE inside it without rebuilding anything.
 *
 * - The bundled theme (imported in main.tsx) is already on the page and is
 *   the fallback. This link is added after it, so its values win.
 * - It is added by script, so it never blocks the first render: if the brand
 *   server is slow or down, the portal still shows at once with the bundled
 *   theme (a slow server may briefly show bundled colours first).
 * - MFEs render inside the portal's page and read the same CSS variables, so
 *   they follow the runtime theme too.
 */
export function loadRuntimeTheme(url: string = RUNTIME_THEME_URL): void {
  if (document.getElementById(RUNTIME_THEME_LINK_ID)) return;
  const link = document.createElement('link');
  link.id = RUNTIME_THEME_LINK_ID;
  link.rel = 'stylesheet';
  link.href = url;
  link.addEventListener('error', () => {
    console.warn(
      `[shell] Runtime theme not available (${url}); using the bundled theme`,
    );
    link.remove();
  });
  document.head.append(link);
}

/** Base address of the brand server (where `theme.css` and published themes are served). */
export const BRAND_SERVER_URL: string = new URL('.', RUNTIME_THEME_URL).href;

const publishedLinkId = (appId: string) => `npst-published-theme-${appId}`;

/**
 * Loads the theme published from the Branding module for one application
 * (Step 23): `app-portal` restyles the whole portal; any other application's
 * theme only applies inside its area (`data-app-theme`). Nothing published
 * yet (404) or brand server down: the link is removed and nothing changes.
 * Added after the main runtime theme, so its values win.
 */
export function loadPublishedTheme(appId: string, reload = false): void {
  const existing = document.getElementById(publishedLinkId(appId));
  if (existing && !reload) return;
  existing?.remove();
  const link = document.createElement('link');
  link.id = publishedLinkId(appId);
  link.rel = 'stylesheet';
  link.dataset['publishedTheme'] = appId;
  // A new address on reload, so the browser fetches the new version.
  link.href = `${BRAND_SERVER_URL}themes/${appId}.css${reload ? `?v=${Date.now()}` : ''}`;
  link.addEventListener('error', () => link.remove());
  document.head.append(link);
}

/** Reloads every published theme on the page (e.g. after a publish in another tab). */
export function reloadPublishedThemes(appIds: readonly string[] = []): void {
  const loaded = [
    ...document.querySelectorAll<HTMLLinkElement>('link[data-published-theme]'),
  ].map((link) => link.dataset['publishedTheme'] ?? '');
  for (const appId of new Set([...loaded, ...appIds]))
    if (appId) loadPublishedTheme(appId, true);
}

/** Removes every published theme from the page (demo reset). */
export function removePublishedThemes(): void {
  document
    .querySelectorAll('link[data-published-theme]')
    .forEach((link) => link.remove());
}
