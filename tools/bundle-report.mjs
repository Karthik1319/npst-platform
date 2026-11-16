// Bundle report: sizes of every app's production build, grouped by what the
// files are. Run after `pnpm nx run-many -t build`:  pnpm bundle-report
// (No dependencies: Node's own zlib estimates the gzip transfer size.)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const APPS = {
  shell: 'apps/shell/dist',
  'demo-react-a': 'apps/demo-react-a/dist',
  'demo-react-b': 'apps/demo-react-b/dist',
  'demo-angular': 'apps/demo-angular/dist/demo-angular/browser',
};

const GROUPS = [
  [
    'React (shared; the shell provides it)',
    (f, app) => app === 'shell' && /loadShare__react/.test(f),
  ],
  [
    'React fallback (not downloaded in the portal)',
    (f) =>
      /prebuild__react|\/react-[\w-]+\.js$|\/react-dom-[\w-]+\.js$/.test(f),
  ],
  [
    'Module Federation runtime',
    (f) =>
      /(^|\/)(dist|hostInit|mf-entry-bootstrap|pendingShares|rolldown-runtime|vite-preload-helper)-|remoteEntry|_virtual_mf|loadShare__shared/.test(
        f,
      ),
  ],
  ['CSS', (f) => f.endsWith('.css')],
  ['App code (incl. bundled libs)', () => true],
];

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`.padStart(9);

for (const [app, dir] of Object.entries(APPS)) {
  if (!existsSync(dir)) {
    console.log(`\n${app}: no build found in ${dir} (run the build first)`);
    continue;
  }
  const totals = new Map(GROUPS.map(([name]) => [name, [0, 0]]));
  let raw = 0;
  let gzip = 0;
  for (const path of walk(dir).filter((f) => /\.(js|css)$/.test(f))) {
    const file = relative(dir, path);
    const bytes = readFileSync(path);
    const zipped = gzipSync(bytes).length;
    const [group] = GROUPS.find(([, match]) => match(file, app));
    const sum = totals.get(group);
    sum[0] += bytes.length;
    sum[1] += zipped;
    raw += bytes.length;
    gzip += zipped;
  }
  console.log(
    `\n${app}  (total ${kb(raw).trim()} raw, ${kb(gzip).trim()} gzip)`,
  );
  for (const [group, [r, z]] of totals) {
    if (r > 0) console.log(`  ${group.padEnd(46)} ${kb(r)} raw ${kb(z)} gzip`);
  }
}
