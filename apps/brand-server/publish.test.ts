import { EventEmitter } from 'node:events';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createThemeEndpoint, listPublished } from './theme-endpoint.mjs';
import {
  PORTAL_APP_ID,
  themeCss,
  validateBranding,
} from './theme-generator.mjs';

const branding = {
  primary: '#7c3aed',
  accent: '#22d3ee',
  bg: '#faf5ff',
  sidebarBg: '#2e1065',
  cardBg: '#ffffff',
  text: '#1e1b4b',
  borderColor: '#e9d5ff',
  fontFamily: 'Manrope',
  radius: 14,
  // Fields a theme does not use are ignored.
  shadow: 'md',
  logo: 'data:image/png;base64,AAAA',
};

describe('theme generator', () => {
  it('restyles the whole portal for NPST Portal, light mode colours only', () => {
    const css = themeCss(PORTAL_APP_ID, branding, { version: 3 });
    expect(css).toContain('(v3)');
    expect(css).toMatch(
      /:root \{\n {2}--radius: 14px;\n {2}--font-heading: 'Manrope Variable'/,
    );
    expect(css).toContain(':root:not(.dark):not(.high-contrast) {');
    expect(css).toContain('--primary: #7C3AED;');
    expect(css).toContain('--sidebar: #2E1065;');
    // Body text keeps the portal font.
    expect(css).not.toContain('--font-sans');
  });

  it("scopes an application's theme to its area in the portal", () => {
    const css = themeCss('app-keka', branding);
    expect(css).toContain('[data-app-theme="app-keka"] {');
    expect(css).toContain(
      ':root:not(.dark):not(.high-contrast) [data-app-theme="app-keka"] {',
    );
    expect(css).not.toMatch(/^:root \{/m);
    // The NPST tokens the applications use are declared again inside the area.
    expect(css).toContain('--npst-color-action-primary: var(--primary);');
  });

  it('never contains a logo or anything that is not a validated value', () => {
    const css = themeCss('app-keka', branding);
    expect(css).not.toMatch(/logo|url\(|data:/i);
  });

  it.each([
    [{ ...branding, primary: 'red' }, 'primary must be a colour'],
    [
      { ...branding, primary: '#fff;}body{display:none' },
      'primary must be a colour',
    ],
    [{ ...branding, fontFamily: 'Comic Sans MS' }, 'not an offered font'],
    [{ ...branding, radius: 99 }, 'radius must be between 0 and 32'],
  ])('rejects invalid values (%#)', (input, message) => {
    expect(() => validateBranding(input)).toThrow(message);
  });

  it('rejects ids that cannot name a theme file', () => {
    expect(() => themeCss('../theme', branding)).toThrow(
      'Invalid application id',
    );
  });
});

/** Minimal request/response doubles for the endpoint (Node http shapes). */
function call(
  handler: ReturnType<typeof createThemeEndpoint>,
  method: string,
  url: string,
  body?: unknown,
) {
  const request = Object.assign(new EventEmitter(), { method, url });
  const response = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: '',
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
    },
    end(text: string) {
      this.body = text;
    },
  };
  const done = handler(request as never, response as never, () => undefined);
  if (body !== undefined)
    request.emit('data', Buffer.from(JSON.stringify(body)));
  request.emit('end');
  return done.then(() => response);
}

describe('publish endpoint', () => {
  it('stores a published theme and serves it; delete resets', async () => {
    const dir = join(mkdtempSync(join(tmpdir(), 'brand-')), 'published');
    const handle = createThemeEndpoint(dir);

    expect(
      (await call(handle, 'GET', '/themes/app-portal.css')).statusCode,
    ).toBe(404);

    const published = await call(handle, 'PUT', '/themes/app-portal', {
      branding,
      version: 2,
    });
    expect(published.statusCode).toBe(200);
    expect(published.headers['access-control-allow-origin']).toBe('*');

    const served = await call(handle, 'GET', '/themes/app-portal.css');
    expect(served.statusCode).toBe(200);
    expect(served.headers['content-type']).toContain('text/css');
    expect(served.body).toContain('--primary: #7C3AED;');
    expect(await listPublished(dir)).toEqual(['app-portal']);

    expect((await call(handle, 'DELETE', '/themes')).statusCode).toBe(204);
    expect(await listPublished(dir)).toEqual([]);
  });

  it('refuses invalid values without storing anything', async () => {
    const dir = join(mkdtempSync(join(tmpdir(), 'brand-')), 'published');
    const handle = createThemeEndpoint(dir);
    const response = await call(handle, 'PUT', '/themes/app-keka', {
      branding: { ...branding, bg: 'url(x)' },
    });
    expect(response.statusCode).toBe(400);
    expect(await listPublished(dir)).toEqual([]);
  });
});
