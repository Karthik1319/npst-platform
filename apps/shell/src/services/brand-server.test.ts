import { afterEach, describe, expect, it, vi } from 'vitest';
import { subscribeToasts } from '@/lib/toast';
import {
  publishTheme,
  PORTAL_APP_ID,
  resetPublishedThemes,
} from '@/services/brand-server';
import { brandingService } from '@/services/brandingService';
import { BRAND_SERVER_URL, loadPublishedTheme } from '@/services/runtime-theme';
import { NPST_DEFAULT_STYLE } from '@/utils/branding';

const publishedLinks = () => [
  ...document.querySelectorAll<HTMLLinkElement>('link[data-published-theme]'),
];

afterEach(() => {
  publishedLinks().forEach((link) => link.remove());
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Branding Publish → brand server (Step 23)', () => {
  it('sends the branding to the brand server and loads the new theme at once', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response('/* css */', { status: 200 }));
    vi.stubGlobal('fetch', fetch);

    await publishTheme(PORTAL_APP_ID, NPST_DEFAULT_STYLE, 4);

    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BRAND_SERVER_URL}themes/app-portal`);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(String(init.body))).toMatchObject({
      branding: { primary: '#1E40AF' },
      version: 4,
    });
    const [link] = publishedLinks();
    expect(link?.href).toMatch(/\/themes\/app-portal\.css\?v=\d+$/);
  });

  it("publishing in the Branding module publishes the theme (the editor's Publish)", () => {
    const fetch = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetch);

    brandingService.publish(
      'app-keka',
      { ...NPST_DEFAULT_STYLE, primary: '#7C3AED' },
      {},
    );

    expect(fetch).toHaveBeenCalledWith(
      `${BRAND_SERVER_URL}themes/app-keka`,
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('saving a draft does not publish', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    brandingService.saveDraft('app-keka', NPST_DEFAULT_STYLE, {});
    expect(fetch).not.toHaveBeenCalled();
  });

  it('tells the administrator when the brand server is down', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    );
    const toasts: string[] = [];
    const stop = subscribeToasts((toast) => toasts.push(toast.message));

    brandingService.publish('app-portal', NPST_DEFAULT_STYLE, {});
    await vi.waitFor(() =>
      expect(toasts[0]).toContain('Brand server not reachable'),
    );
    stop();
  });

  it('loads a published theme once; nothing published (404) leaves no link', () => {
    loadPublishedTheme('app-dealpulse');
    loadPublishedTheme('app-dealpulse');
    expect(publishedLinks()).toHaveLength(1);
    publishedLinks()[0]?.dispatchEvent(new Event('error'));
    expect(publishedLinks()).toHaveLength(0);
  });

  it('reset removes the published themes from the page and the brand server', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    loadPublishedTheme(PORTAL_APP_ID);

    await resetPublishedThemes();

    expect(publishedLinks()).toHaveLength(0);
    expect(fetch).toHaveBeenCalledWith(`${BRAND_SERVER_URL}themes`, {
      method: 'DELETE',
    });
  });
});
