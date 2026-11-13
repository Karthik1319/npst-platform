// @vitest-environment node
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/*
 * Builds React A for production (same config as `nx build demo-react-a`) into
 * a temporary folder and checks the output: it must still be a Module
 * Federation remote, and must not contain the standalone harness or mock users.
 */
const appDir = fileURLToPath(new URL('..', import.meta.url));
let outDir = '';
let files: string[] = [];
let allJs = '';

beforeAll(async () => {
  outDir = mkdtempSync(join(tmpdir(), 'demo-react-a-build-'));
  const previousEnv = { ...process.env };
  process.env['NODE_ENV'] = 'production';
  // The federation plugin switches itself off under Vitest; this documented
  // flag keeps it on for this real production build.
  process.env['MFE_VITE_NO_TEST_ENV_CHECK'] = 'true';
  try {
    await build({
      root: appDir,
      configFile: join(appDir, 'vite.config.ts'),
      mode: 'production',
      logLevel: 'silent',
      build: { outDir, emptyOutDir: true },
    });
  } finally {
    process.env = previousEnv;
  }
  files = readdirSync(outDir, { recursive: true }).map(String);
  allJs = files
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(join(outDir, file), 'utf8'))
    .join('\n');
}, 120_000);

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

describe('production build of React A', () => {
  it('is still a Module Federation remote (manifest + remoteEntry exposing ./App)', () => {
    expect(files).toContain('remoteEntry.js');
    expect(files).toContain('mf-manifest.json');
    const manifest = JSON.parse(
      readFileSync(join(outDir, 'mf-manifest.json'), 'utf8'),
    ) as {
      metaData: { remoteEntry: { name: string } };
      exposes: { path: string }[];
    };
    expect(manifest.metaData.remoteEntry.name).toBe('remoteEntry.js');
    expect(manifest.exposes.map((expose) => expose.path)).toContain('./App');
  });

  it('contains no mock users and no standalone harness', () => {
    expect(allJs.length).toBeGreaterThan(0);
    for (const leaked of [
      'Admin User',
      'u-admin',
      '@example.com',
      'Standalone mode',
    ]) {
      expect(allJs, `build output contains "${leaked}"`).not.toContain(leaked);
    }
  });

  it('shows the portal notice when opened directly', () => {
    expect(allJs).toContain(
      'is part of the NPST Portal and opens only inside it.',
    );
  });
});
