import { toast } from '@/lib/toast';
import {
  BRAND_SERVER_URL,
  loadPublishedTheme,
  removePublishedThemes,
} from '@/services/runtime-theme';
import type { BrandingStyle } from '@/types';

/**
 * Branding module API (simulated brand server, Step 23). Used only by the
 * portal's admin area: publishing a branding stores a generated theme on the
 * brand server, which every user's portal then loads at runtime.
 *
 * Real system: an administrator-only, authenticated API of the branding
 * module; it records who published what (audit) before the theme goes live.
 */

/** The registry id of the portal itself: its branding restyles the whole portal. */
export const PORTAL_APP_ID = 'app-portal';

/** Sends the published branding to the brand server and applies it at once. */
export async function publishTheme(
  appId: string,
  style: BrandingStyle,
  version?: number,
): Promise<void> {
  const response = await fetch(
    `${BRAND_SERVER_URL}themes/${encodeURIComponent(appId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branding: style,
        version,
        publishedAt: new Date().toISOString(),
      }),
    },
  );
  if (!response.ok)
    throw new Error(`Brand server refused the theme: ${await response.text()}`);
  loadPublishedTheme(appId, true);
}

/**
 * Called when a branding becomes published (publish, approval, apply to all).
 * The configuration is already saved; if the brand server cannot be reached,
 * the administrator is told that the live theme did not change.
 */
export function publishThemeInBackground(
  appId: string,
  style: BrandingStyle,
  version?: number,
): void {
  publishTheme(appId, style, version).catch((error: unknown) => {
    console.warn('[shell] Theme not published to the brand server', error);
    toast.error(
      'Brand server not reachable: the theme was saved but is not live yet',
    );
  });
}

/** Removes every published theme (Settings → Reset demo data). */
export async function resetPublishedThemes(): Promise<void> {
  removePublishedThemes();
  try {
    await fetch(`${BRAND_SERVER_URL}themes`, { method: 'DELETE' });
  } catch {
    // Brand server down: nothing published there can be shown either.
  }
}
