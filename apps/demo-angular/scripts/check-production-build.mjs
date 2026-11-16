// Production-build check: runs a real `ng build` into a temporary folder and
// checks what the portal relies on. Run by `pnpm nx run demo-angular:test`.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const ng = require.resolve('@angular/cli/bin/ng.js');
const outDir = mkdtempSync(join(tmpdir(), 'demo-angular-build-'));

try {
  execFileSync(process.execPath, [ng, 'build', '--output-path', outDir], {
    stdio: 'pipe',
  });
  const browser = join(outDir, 'browser');
  const html = readFileSync(join(browser, 'index.html'), 'utf8');
  const entries = [
    ...html.matchAll(/<script src="([^"]+)" type="module">/g),
  ].map((m) => m[1]);
  assert.equal(entries.length, 1, 'index.html has one module entry');
  const main = readFileSync(join(browser, entries[0]), 'utf8');
  const code = readdirSync(browser)
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(join(browser, file), 'utf8'))
    .join('\n');

  assert.match(main, /export\{[^}]*\bas mount\b[^}]*\}/, 'entry exports mount');
  assert.match(
    main,
    /export\{[^}]*\bas unmount\b[^}]*\}/,
    'entry exports unmount',
  );
  for (const secret of [
    'Admin User',
    'u-admin',
    '@example.com',
    'Standalone mode',
  ]) {
    assert.ok(
      !code.includes(secret),
      `production build must not contain "${secret}"`,
    );
  }
  assert.ok(
    code.includes('is part of the NPST Portal and opens only inside it'),
    'portal notice',
  );
  console.log(
    '✓ production build: exports mount/unmount, no mock data, portal notice present',
  );
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
