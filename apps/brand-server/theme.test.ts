import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

/** Custom properties a stylesheet defines (NPST and Admin Portal tokens). */
const definedVariables = (css: string) =>
  new Set(
    [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:/g)].map(
      (match) => match[1],
    ),
  );

describe('published theme (brand server)', () => {
  const published = read('./public/theme.css');
  const bundled = read('../../libs/design-tokens/src/theme.css');

  it('defines exactly the variables of the bundled theme, so it can replace it at runtime', () => {
    expect([...definedVariables(published)].sort()).toEqual(
      [...definedVariables(bundled)].sort(),
    );
  });

  it('defines no logo', () => {
    const code = published.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(code).not.toMatch(/logo/i);
  });
});
