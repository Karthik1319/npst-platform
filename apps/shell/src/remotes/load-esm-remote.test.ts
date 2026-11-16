import { afterEach, describe, expect, it, vi } from 'vitest';
import { entryModuleUrls, loadEsmRemote } from '@/remotes/load-esm-remote';

const BASE = 'http://localhost:4203/';

const builtIndex = `<!doctype html><html><head>
<link rel="stylesheet" href="styles-5INURTSO.css"></head><body>
<div data-npst-standalone="demo-angular"></div>
<script src="polyfills-3MVT5DV7.js" type="module"></script>
<script src="main-WPOOLGHV.js" type="module"></script></body></html>`;

const devIndex = `<!doctype html><html><head>
<script type="module" src="/@vite/client"></script></head><body>
<script src="main.js" type="module"></script></body></html>`;

function serveIndex(html: string, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(html, { status })),
  );
}

const mountable = { mount: async () => {}, unmount: async () => {} };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('entryModuleUrls', () => {
  it('returns the built entry modules in page order, as absolute URLs', () => {
    expect(entryModuleUrls(builtIndex, BASE)).toEqual([
      'http://localhost:4203/polyfills-3MVT5DV7.js',
      'http://localhost:4203/main-WPOOLGHV.js',
    ]);
  });

  it("skips the dev server's own client script", () => {
    expect(entryModuleUrls(devIndex, BASE)).toEqual([
      'http://localhost:4203/main.js',
    ]);
  });
});

describe('loadEsmRemote', () => {
  it('imports every entry in order and returns the one exporting mount/unmount', async () => {
    serveIndex(builtIndex);
    const imported: string[] = [];
    const load = vi.fn(async (url: string) => {
      imported.push(url);
      return url.includes('main-') ? mountable : {};
    });

    const result = await loadEsmRemote(BASE, load);

    expect(imported).toEqual([
      'http://localhost:4203/polyfills-3MVT5DV7.js',
      'http://localhost:4203/main-WPOOLGHV.js',
    ]);
    expect(result.mount).toBe(mountable.mount);
    expect(result.unmount).toBe(mountable.unmount);
  });

  it('fails when index.html cannot be loaded', async () => {
    serveIndex('Not found', 404);
    await expect(loadEsmRemote(BASE, vi.fn())).rejects.toThrow(
      'Remote index.html: HTTP 404',
    );
  });

  it('fails when no entry exports mount() and unmount()', async () => {
    serveIndex(devIndex);
    await expect(
      loadEsmRemote(BASE, async () => ({ mount: mountable.mount })),
    ).rejects.toThrow('exactly one entry exporting mount() and unmount()');
  });
});
