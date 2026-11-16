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
