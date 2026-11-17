import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { assertAppId, themeCss } from './theme-generator.mjs';

/*
 * Publish endpoint of the simulated brand server (Step 23):
 *   PUT    /themes/<appId>      body: branding values (JSON) → stores the generated CSS
 *   GET    /themes/<appId>.css  the published theme (404 when nothing is published)
 *   DELETE /themes              removes every published theme (demo reset)
 *
 * The real branding module would require an authenticated administrator and
 * an approval record before publishing; this PoC only validates the values.
 */
const MAX_BODY = 16 * 1024;

export function createThemeEndpoint(directory) {
  return async function handle(request, response, next) {
    const url = new URL(request.url ?? '/', 'http://brand-server');
    if (!url.pathname.startsWith('/themes')) return next?.();
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader(
      'Access-Control-Allow-Methods',
      'GET, PUT, DELETE, OPTIONS',
    );
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    const send = (status, body, type = 'text/plain') => {
      response.statusCode = status;
      response.setHeader('Content-Type', `${type}; charset=utf-8`);
      response.setHeader('Cache-Control', 'no-cache');
      response.end(body);
    };
    try {
      if (request.method === 'OPTIONS') return send(204, '');
      if (request.method === 'DELETE' && url.pathname === '/themes') {
        await rm(directory, { recursive: true, force: true });
        return send(204, '');
      }
      const match = /^\/themes\/([^/]+?)(\.css)?$/.exec(url.pathname);
      if (!match) return send(404, 'Not found');
      const [, appId, isCss] = match;
      assertAppId(appId);
      const file = join(directory, `${appId}.css`);
      if (request.method === 'GET' && isCss) {
        const css = await readFile(file, 'utf8').catch(() => null);
        return css === null
          ? send(404, '/* nothing published */', 'text/css')
          : send(200, css, 'text/css');
      }
      if (request.method === 'PUT' && !isCss) {
        const body = await readBody(request);
        const { branding, version, publishedAt } = JSON.parse(body);
        const css = themeCss(appId, branding, { version, publishedAt });
        await mkdir(directory, { recursive: true });
        await writeFile(file, css, 'utf8');
        return send(200, css, 'text/css');
      }
      return send(405, 'Method not allowed');
    } catch (error) {
      return send(400, error instanceof Error ? error.message : 'Bad request');
    }
  };
}

/** Published theme ids (for tests and diagnostics). */
export async function listPublished(directory) {
  const files = await readdir(directory).catch(() => []);
  return files.filter((f) => f.endsWith('.css')).map((f) => f.slice(0, -4));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) reject(new Error('Body too large'));
      else chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}
