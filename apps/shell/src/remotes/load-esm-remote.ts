import type { MountableMfe } from '@npst/shared-contracts';

type ImportModule = (url: string) => Promise<Partial<MountableMfe>>;

const importModule: ImportModule = (url) => import(/* @vite-ignore */ url);

/**
 * Loads a remote that is a plain ES module exposing `mount` / `unmount`
 * (e.g. a standard Angular CLI build), without Module Federation: such
 * remotes share nothing with the shell, so they need no shared scope.
 *
 * Build tools give entry files hashed names (`main-WPOOLGHV.js`) that change
 * on every build, so the shell reads the current names from the remote's own
 * `index.html`, which the build already produces. Nothing extra is needed
 * from the remote team.
 */
export async function loadEsmRemote(
  baseUrl: string,
  load: ImportModule = importModule,
): Promise<MountableMfe> {
  const response = await fetch(new URL('index.html', baseUrl), {
    cache: 'no-cache',
  });
  if (!response.ok) {
    throw new Error(`Remote index.html: HTTP ${response.status}`);
  }

  const mountables: MountableMfe[] = [];
  // In page order: e.g. Angular's `polyfills` (zone.js) must run before `main`.
  for (const url of entryModuleUrls(await response.text(), baseUrl)) {
    const module = await load(url);
    if (
      typeof module.mount === 'function' &&
      typeof module.unmount === 'function'
    ) {
      mountables.push({ mount: module.mount, unmount: module.unmount });
    }
  }
  const [mountable] = mountables;
  if (mountables.length !== 1 || !mountable) {
    throw new Error(
      `Remote must have exactly one entry exporting mount() and unmount(), found ${mountables.length}`,
    );
  }
  return mountable;
}

/**
 * The remote's entry modules from its `index.html`, as absolute URLs, in page
 * order. Dev servers add their own client (e.g. `/@vite/client`); skip those.
 */
export function entryModuleUrls(html: string, baseUrl: string): string[] {
  const page = new DOMParser().parseFromString(html, 'text/html');
  return [...page.querySelectorAll('script[type="module"][src]')]
    .map((script) => script.getAttribute('src') ?? '')
    .filter((src) => src && !src.startsWith('/@'))
    .map((src) => new URL(src, baseUrl).href);
}
