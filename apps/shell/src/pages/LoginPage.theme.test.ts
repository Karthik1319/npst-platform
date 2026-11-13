// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

/*
 * The login page must use the shared NPST theme only, so a runtime theme.css
 * can restyle it. These checks read the CSS source, because the test browser
 * (jsdom) does not compute CSS.
 */
const require = createRequire(import.meta.url);
const themeCss = readFileSync(
  require.resolve('@npst/design-tokens/theme.css'),
  'utf8',
);
const loginCss = readFileSync(
  new URL('./LoginPage.module.css', import.meta.url),
  'utf8',
);
const loginTsx = readFileSync(
  new URL('./LoginPage.tsx', import.meta.url),
  'utf8',
);
const mainTsx = readFileSync(new URL('../main.tsx', import.meta.url), 'utf8');

const themeVariables = new Set(
  [...themeCss.matchAll(/(--npst-[\w-]+)\s*:/g)].map((match) => match[1]),
);
/** Helper variables declared inside the login CSS, e.g. `--login-tone-bg`. */
const localVariables = new Map(
  [...loginCss.matchAll(/^\s*(--[\w-]+)\s*:\s*([^;]+);/gm)].map((match) => [
    match[1] ?? '',
    match[2] ?? '',
  ]),
);
const usedVariables = [...loginCss.matchAll(/var\((--[\w-]+)\)/g)].map(
  (match) => match[1],
);
const declarations = [
  ...loginCss.matchAll(/^\s*([a-z][\w-]*)\s*:\s*([^;]+);/gm),
].map((match) => ({ property: match[1] ?? '', value: match[2] ?? '' }));

describe('login page theme', () => {
  it('uses only variables from the design-tokens theme (or local helpers built from them)', () => {
    expect(usedVariables.length).toBeGreaterThan(0);
    for (const name of usedVariables) {
      if (name && localVariables.has(name)) {
        expect(
          localVariables.get(name),
          `${name} must take a theme value`,
        ).toMatch(/^var\(--npst-[\w-]+\)$/);
      } else {
        expect(themeVariables, `${name} is not in theme.css`).toContain(name);
      }
    }
  });

  it('takes colours, backgrounds, waves, fonts and spacing from variables', () => {
    const themed = [
      'color',
      'background',
      'background-image',
      'border-color',
      'fill',
      'stroke',
      'font-family',
      'font-size',
      'box-shadow',
      'border-radius',
      'padding',
      'gap',
    ];
    for (const { property, value } of declarations) {
      if (themed.includes(property) && value !== '0' && value !== 'none') {
        expect(value, `${property}: ${value}`).toMatch(/var\(--/);
      }
    }
  });

  it('has no hard-coded colour values in the CSS or the SVG markup', () => {
    expect(loginCss).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
    expect(loginTsx).not.toMatch(/(fill|stroke)="(?!none|currentColor)[^"]*"/);
  });

  it('shows no logo: none in the theme, the login CSS or the login page', () => {
    // Intentional design decision: the portal displays no company logo.
    // Comments are ignored; only real CSS and code are checked.
    const withoutComments = (source: string) =>
      source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(withoutComments(themeCss)).not.toMatch(/logo/i);
    expect(withoutComments(loginCss)).not.toMatch(/logo|url\(/i);
    expect(withoutComments(loginTsx)).not.toMatch(/<img|logo/i);
  });

  it('shares the theme with the portal: loaded once at the app entry', () => {
    expect(mainTsx).toContain("import '@npst/design-tokens/theme.css';");
  });
});
