/* global console, process, URL -- Node.js script */
// One-off migration tool (Step 18): converts the Admin Portal's Tailwind class
// strings into CSS modules that use only CSS variables, using Tailwind's own
// compiler so the generated CSS is exactly what Tailwind would emit.
// Not part of any build. See README.md in this folder.
//
// Usage: node convert.mjs <adminPortalDir> <outDir>
//   <adminPortalDir> needs its own node_modules (npm install --ignore-scripts).
//   <outDir>/src/**         converted .ts/.tsx + .module.css files (same tree as his src)
//   <outDir>/theme-tokens.css  theme variables (Tailwind theme + his :root/.dark/.high-contrast + literal colours)
//   <outDir>/base.css       global base: preflight, @property, keyframes, his base layer
//   <outDir>/report.json    what was converted, kept or needs manual work
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { createRequire } from 'node:module';

const [appDir, outDir] = process.argv.slice(2);
const srcDir = join(appDir, 'src');
const hisRequire = createRequire(join(appDir, 'package.json'));
const ts = createRequire(new URL('../../package.json', import.meta.url))(
  'typescript',
);
const postcss = hisRequire('postcss');
const { compile } = await import(
  join(appDir, 'node_modules/@tailwindcss/node/dist/index.mjs')
);

// ---------- Tailwind compiler (his own index.css, minus font imports) ----------
const indexCss = readFileSync(join(srcDir, 'index.css'), 'utf8').replace(
  /^@import "@fontsource[^\n]*\n/gm,
  '',
);
const compiler = await compile(indexCss, { base: srcDir, onDependency() {} });

// CSS.escape (spec algorithm), as Tailwind uses for class selectors.
function cssEscape(value) {
  let out = '';
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    const code = value.charCodeAt(i);
    if (code === 0) {
      out += '�';
      continue;
    }
    if (
      (code >= 0x1 && code <= 0x1f) ||
      code === 0x7f ||
      (i === 0 && code >= 0x30 && code <= 0x39) ||
      (i === 1 && code >= 0x30 && code <= 0x39 && value.charCodeAt(0) === 0x2d)
    ) {
      out += '\\' + code.toString(16) + ' ';
      continue;
    }
    if (i === 0 && value.length === 1 && code === 0x2d) {
      out += '\\' + ch;
      continue;
    }
    if (
      code >= 0x80 ||
      code === 0x2d ||
      code === 0x5f ||
      (code >= 0x30 && code <= 0x39) ||
      (code >= 0x41 && code <= 0x5a) ||
      (code >= 0x61 && code <= 0x7a)
    ) {
      out += ch;
      continue;
    }
    out += '\\' + ch;
  }
  return out;
}

const utilityCss = (css) => {
  const i = css.indexOf('@layer utilities');
  if (i < 0) return '';
  let depth = 0,
    j = css.indexOf('{', i);
  for (let k = j; k < css.length; k++) {
    if (css[k] === '{') depth++;
    else if (css[k] === '}') {
      depth--;
      if (depth === 0) return css.slice(j + 1, k);
    }
  }
  return '';
};
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
// Tailwind's build() is cumulative: it returns every class seen so far. Select rules by exact class.
const classRe = (token) =>
  new RegExp('\\.' + escRe(cssEscape(token)) + '(?![A-Za-z0-9_\\\\-])');
const validCache = new Map();
function isUtility(token) {
  if (!validCache.has(token))
    validCache.set(
      token,
      classRe(token).test(utilityCss(compiler.build([token]))),
    );
  return validCache.get(token);
}
// Rules (with their @media/@supports wrappers) whose selector names one of `tokens`.
function rulesFor(tokens) {
  const res = tokens.map(classRe);
  const root = postcss.parse(utilityCss(compiler.build(tokens)));
  root.walkRules((rule) => {
    if (!res.some((re) => re.test(rule.selector))) {
      // keep nested rules inside a matching parent (e.g. "&:hover"); drop unrelated top-level ones
      let p = rule.parent;
      let inside = false;
      while (p && p.type !== 'root') {
        if (p.type === 'rule' && res.some((re) => re.test(p.selector))) {
          inside = true;
          break;
        }
        p = p.parent;
      }
      if (!inside) rule.remove();
    }
  });
  // remove now-empty at-rules
  let changed = true;
  while (changed) {
    changed = false;
    root.walkAtRules((at) => {
      if (!at.nodes || at.nodes.length === 0) {
        at.remove();
        changed = true;
      }
    });
  }
  return root.toString();
}
const MARKER = /^(group|peer)(\/[\w-]+)?$/;
const markerName = (t) =>
  t
    .replace(/^group/, 'npst-g')
    .replace(/^peer/, 'npst-p')
    .replace('/', '-');
const HIS_CLASSES = new Set(
  [...indexCss.matchAll(/\.([a-z][\w-]*)/g)].map((m) => m[1]),
);
HIS_CLASSES.add('toaster');
HIS_CLASSES.add('cn-toast');
HIS_CLASSES.add('sr-only-x');

// Unprefixed font-size utilities (text-sm, text-2xl, text-[10px], …).
const FONT_SIZE = /^text-(?:xs|sm|base|lg|[2-9]?xl|\[[\d.]+(?:px|rem|em)\])$/;

// ---------- fonts → tokens ----------
const FONT_TOKENS = [
  ["'Plus Jakarta Sans Variable', sans-serif", '--font-heading'],
  ["'Inter Variable', sans-serif", '--font-sans'],
  ["'JetBrains Mono Variable', monospace", '--font-mono'],
];
const fontsAsTokens = (css) =>
  FONT_TOKENS.reduce(
    (text, [value, name]) =>
      text.split(`font-family: ${value}`).join(`font-family: var(${name})`),
    css,
  );

// ---------- literal colours → tokens ----------
const literalTokens = new Map(); // literal → var name
const COLOR_RE =
  /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\([^()]*\)/g;
// Readable names for the fixed colours the original styles use directly.
const FIXED_NAMES = {
  '#cbd5e1': 'slate-300',
  '#e2e8f0': 'slate-200',
  '#f8fafc': 'slate-50',
  '#f87171': 'red-400',
  '#fbbf24': 'amber-400',
  '#34d399': 'emerald-400',
  '#64748b': 'slate-500',
  'rgb(0 0 0 / 0.1)': 'black-a10',
  '#0000': 'transparent',
  '#2563eb': 'blue-600',
  '#ffffff': 'white',
  '#fff': 'white',
  '#94a3b8': 'slate-400',
};
function tokenFor(literal) {
  if (!literalTokens.has(literal)) {
    const known = FIXED_NAMES[literal.toLowerCase()];
    literalTokens.set(
      literal,
      known ? `--fixed-${known}` : `--fixed-${literalTokens.size + 1}`,
    );
  }
  return `var(${literalTokens.get(literal)})`;
}
function variablesOnly(root) {
  // Drop literal-colour fallbacks where a var() version exists in @supports (color-mix).
  root.walkAtRules('supports', (at) => {
    if (!/color-mix/.test(at.params)) return;
    const parent = at.parent;
    const props = new Set();
    at.walkDecls((d) => props.add(d.prop));
    parent.each((n) => {
      if (n.type === 'decl' && props.has(n.prop) && COLOR_RE.test(n.value))
        n.remove();
      COLOR_RE.lastIndex = 0;
    });
    at.replaceWith(at.nodes);
  });
  root.walkDecls((d) => {
    if (d.prop.startsWith('--fixed-')) return;
    // @property initial values must be fixed values (CSS forbids var() there).
    if (d.parent?.type === 'atrule' && d.parent.name === 'property') return;
    if (d.value.includes('url(')) return;
    d.value = d.value.replace(COLOR_RE, (m) => tokenFor(m));
  });
}

// ---------- CSS for one class string ----------
function cssForSite(tokens, localClass, sizedMarker) {
  let out = rulesFor(tokens);
  // Longest tokens first, so a token that is a prefix of another is not replaced inside it.
  for (const t of [...tokens].sort((a, b) => b.length - a.length))
    out = out.split('.' + cssEscape(t)).join('.' + localClass);
  out = out.replace(
    /\.(group|peer)(\\\/[\w-]+)?(?![\w\\-])/g,
    (_m, kind, name) =>
      `:global(.npst-${kind === 'group' ? 'g' : 'p'}${name ? '-' + name.slice(2) : ''})`,
  );
  out = out.replace(/\.dark(?![\w\\-])/g, ':global(.dark)');
  out = out.replace(
    /\[class\*=(['"])size-\1\]/g,
    `[class*=$1${sizedMarker}$1]`,
  );
  const root = postcss.parse(out);
  variablesOnly(root);
  // Merge consecutive rules with the same selector (Tailwind emits one rule per utility).
  const merge = (container) => {
    let prev = null;
    container.each((node) => {
      if (
        node.type === 'rule' &&
        prev &&
        prev.type === 'rule' &&
        prev.selector === node.selector
      ) {
        node.each((child) => {
          prev.append(child.clone());
        });
        node.remove();
        return;
      }
      if (node.nodes) merge(node);
      prev = node;
    });
  };
  merge(root);
  return root.toString().trim();
}

// ---------- source transform ----------
const report = { files: [], keptTokens: {}, manual: [] };
const isClassAttr = (name) => name === 'className' || /ClassName$/.test(name);
const tokenize = (s) => s.split(/\s+/).filter(Boolean);
const camel = (s) =>
  s
    .replace(/[^A-Za-z0-9]+(.)?/g, (_m, c) => (c ? c.toUpperCase() : ''))
    .replace(/^[0-9]/, (d) => '_' + d);

function convertFile(file) {
  const text = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const isUi = relative(srcDir, file).startsWith('components/ui/');
  const edits = [];
  const blocks = [];
  const names = new Map();
  const counters = new Map();
  const bySet = new Map();
  const relFile = relative(srcDir, file);

  function nameFor(hint) {
    const base = camel(hint || 'c') || 'c';
    const n = (counters.get(base) ?? 0) + 1;
    counters.set(base, n);
    return n === 1 && !names.has(base) ? base : `${base}${n}`;
  }
  // Returns replacement expression for static class text, or null if nothing to convert.
  function siteExpr(staticText, hint) {
    const tokens = tokenize(staticText);
    const utils = [];
    const keep = [];
    for (const t of tokens) {
      if (MARKER.test(t)) keep.push(markerName(t));
      else if (isUtility(t)) utils.push(t);
      else {
        keep.push(t);
        report.keptTokens[t] = (report.keptTokens[t] ?? 0) + 1;
      }
    }
    if (utils.length === 0) return null;
    const key = utils.join(' ');
    let local = bySet.get(key);
    if (!local) {
      local = nameFor(hint);
      names.set(local, true);
      bySet.set(key, local);
      const sized = utils.some((u) => /^(?:[a-z-]+:)*size-/.test(u));
      let css = cssForSite(utils, local, 'npst-sized');
      // tailwind-merge rule: a page's text size drops a component's `leading-*`
      // (e.g. CardTitle). Text-size utilities read --tw-leading, so reset it here.
      if (
        !isUi &&
        utils.some((u) => FONT_SIZE.test(u)) &&
        !utils.some((u) => /^leading-/.test(u))
      )
        css += `\n.${local} {\n  --tw-leading: initial;\n}`;
      blocks.push(`/* ${key} */\n${css}`);
      if (sized) report.sized = (report.sized ?? 0) + 1;
    }
    const sizedFlag = utils.some((u) => /^(?:[a-z-]+:)*size-/.test(u))
      ? ['npst-sized']
      : [];
    const extra = [...keep, ...sizedFlag];
    return extra.length
      ? '`${styles.' + local + '} ' + extra.join(' ') + '`'
      : 'styles.' + local;
  }
  function looksLikeClasses(s) {
    const tokens = tokenize(s);
    if (tokens.length === 0) return false;
    let utils = 0;
    for (const t of tokens) {
      if (MARKER.test(t) || HIS_CLASSES.has(t)) continue;
      if (!isUtility(t)) return false;
      utils++;
    }
    return utils > 0 && (tokens.length >= 2 || /[-:/[]/.test(s));
  }
  function hintFrom(node) {
    for (let p = node.parent; p; p = p.parent) {
      if (ts.isPropertyAssignment(p))
        return p.name.getText(sf).replace(/['"]/g, '');
      if (ts.isJsxAttribute(p)) {
        const el = p.parent.parent;
        const tag = el.tagName?.getText(sf) ?? 'el';
        return tag.replace(/\./g, '');
      }
      if (ts.isVariableDeclaration(p)) return p.name.getText(sf);
      if (ts.isFunctionDeclaration(p) && p.name) return p.name.text;
    }
    return 'c';
  }
  function convertLiteral(node, hint, inJsxAttr) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const expr = siteExpr(node.text, hint);
      if (expr)
        edits.push([
          node.getStart(sf),
          node.getEnd(),
          inJsxAttr ? `{${expr}}` : expr,
        ]);
      return;
    }
    if (ts.isTemplateExpression(node)) {
      const statics = [
        node.head.text,
        ...node.templateSpans.map((s) => s.literal.text),
      ].join(' ');
      const expr = siteExpr(statics, hint);
      if (!expr) return;
      const dyn = node.templateSpans
        .map((s) => '${' + s.expression.getText(sf) + '}')
        .join(' ');
      const inner = expr.startsWith('`')
        ? expr.slice(1, -1)
        : '${' + expr + '}';
      edits.push([
        node.getStart(sf),
        node.getEnd(),
        '`' + inner + ' ' + dyn + '`',
      ]);
      for (const s of node.templateSpans) visitClassExpr(s.expression, hint);
      return;
    }
  }
  function visitClassExpr(node, hint) {
    if (!node) return;
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateExpression(node)
    )
      return convertLiteral(node, hint, false);
    if (ts.isConditionalExpression(node)) {
      visitClassExpr(node.whenTrue, hint);
      visitClassExpr(node.whenFalse, hint);
      return;
    }
    if (
      ts.isBinaryExpression(node) &&
      [
        ts.SyntaxKind.AmpersandAmpersandToken,
        ts.SyntaxKind.BarBarToken,
        ts.SyntaxKind.QuestionQuestionToken,
      ].includes(node.operatorToken.kind)
    ) {
      visitClassExpr(node.right, hint);
      if (node.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken)
        visitClassExpr(node.left, hint);
      return;
    }
    if (ts.isParenthesizedExpression(node))
      return visitClassExpr(node.expression, hint);
    if (ts.isArrayLiteralExpression(node)) {
      node.elements.forEach((e) => visitClassExpr(e, hint));
      return;
    }
    if (ts.isObjectLiteralExpression(node)) {
      for (const p of node.properties)
        if (ts.isPropertyAssignment(p))
          visitClassExpr(
            p.initializer,
            p.name.getText(sf).replace(/['"]/g, ''),
          );
      return;
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      ['cn', 'cva', 'cx', 'clsx'].includes(node.expression.text)
    ) {
      node.arguments.forEach((a) => visitClassExpr(a, hint));
      return;
    }
  }
  const handled = new Set();
  function walk(node) {
    if (
      ts.isImportDeclaration(node) ||
      ts.isExportDeclaration(node) ||
      ts.isTypeNode(node)
    )
      return;
    if (
      ts.isJsxAttribute(node) &&
      isClassAttr(node.name.getText(sf)) &&
      node.initializer
    ) {
      const tag = node.parent.parent.tagName?.getText(sf) ?? 'el';
      const attr = node.name.getText(sf);
      const hint =
        (tag.charAt(0).toLowerCase() + tag.slice(1)).replace(/\./g, '') +
        (attr === 'className' ? '' : attr.replace(/ClassName$/, ''));
      if (ts.isStringLiteral(node.initializer)) {
        convertLiteral(node.initializer, hint, true);
        handled.add(node.initializer);
      } else if (ts.isJsxExpression(node.initializer)) {
        markHandled(node.initializer);
        visitClassExpr(node.initializer.expression, hint);
      }
      return;
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      ['cn', 'cva'].includes(node.expression.text)
    ) {
      markHandled(node);
      visitClassExpr(node, hintFrom(node));
      return;
    }
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      !handled.has(node)
    ) {
      const p = node.parent;
      const bad =
        (ts.isPropertyAssignment(p) && p.name === node) ||
        ts.isElementAccessExpression(p) ||
        ts.isCaseClause(p) ||
        ts.isJsxAttribute(p) ||
        ts.isLiteralTypeNode(p) ||
        (ts.isBinaryExpression(p) &&
          [
            ts.SyntaxKind.EqualsEqualsEqualsToken,
            ts.SyntaxKind.ExclamationEqualsEqualsToken,
            ts.SyntaxKind.EqualsEqualsToken,
          ].includes(p.operatorToken.kind)) ||
        (ts.isCallExpression(p) &&
          !['cn', 'cva', 'cx'].includes(p.expression.getText(sf)));
      if (!bad && looksLikeClasses(node.text))
        convertLiteral(node, hintFrom(node), false);
      return;
    }
    if (ts.isTemplateExpression(node) && !handled.has(node)) {
      const statics = [
        node.head.text,
        ...node.templateSpans.map((s) => s.literal.text),
      ].join(' ');
      if (looksLikeClasses(statics)) {
        report.manual.push(
          `${relFile}: template class string ${node.getText(sf).slice(0, 80)}`,
        );
      }
    }
    ts.forEachChild(node, walk);
  }
  function markHandled(n) {
    handled.add(n);
    ts.forEachChild(n, markHandled);
  }
  walk(sf);

  // Inline styles and arbitrary colours need manual work.
  for (const m of text.matchAll(/style=\{\{/g))
    report.manual.push(
      `${relFile}:${text.slice(0, m.index).split('\n').length}: inline style`,
    );

  let out = text;
  for (const [s, e, r] of edits.sort((a, b) => b[0] - a[0]))
    out = out.slice(0, s) + r + out.slice(e);
  // Imports: in-house replacements.
  out = out
    .replace(/from ["']lucide-react["']/g, "from '@/components/icons'")
    .replace(/from ["']class-variance-authority["']/g, "from '@/lib/variants'")
    .replace(/from ["']react-router-dom["']/g, "from 'react-router'")
    .replace(/from ["']sonner["']/g, "from '@/lib/toast'");
  if (blocks.length) {
    const base = file
      .split('/')
      .pop()
      .replace(/\.tsx?$/, '');
    // Insert after the last import (positions from the AST, adjusted for earlier edits above it: none, imports come first).
    const lastImport = [...sf.statements]
      .filter((st) => ts.isImportDeclaration(st))
      .pop();
    const at = lastImport
      ? out.indexOf('\n', out.indexOf(lastImport.getText(sf).split('\n').pop()))
      : 0;
    const importLine = `import styles from './${base}.module.css';`;
    // After the last import, or at the top (own line) when the file has none.
    out = lastImport
      ? out.slice(0, at) + `\n${importLine}` + out.slice(at)
      : `${importLine}\n\n${out}`;
    const cssText =
      `/* Generated from the original Tailwind classes (Step 18 converter); variables only. */\n` +
      (isUi
        ? `@layer ui {\n${blocks.join('\n\n')}\n}\n`
        : blocks.join('\n\n') + '\n');
    const cssOut = join(
      outDir,
      'src',
      dirname(relative(srcDir, file)),
      `${base}.module.css`,
    );
    mkdirSync(dirname(cssOut), { recursive: true });
    writeFileSync(cssOut, fontsAsTokens(cssText));
  }
  const fileOut = join(outDir, 'src', relative(srcDir, file));
  mkdirSync(dirname(fileOut), { recursive: true });
  writeFileSync(fileOut, out);
  report.files.push({
    file: relFile,
    sites: edits.length,
    classes: blocks.length,
  });
}

const files = [];
(function list(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) list(p);
    else if (/\.(tsx?)$/.test(f)) files.push(p);
  }
})(srcDir);
for (const f of files) convertFile(f);

// ---------- global theme + base from one build of every utility used ----------
const all = [...validCache].filter(([, ok]) => ok).map(([t]) => t);
const full = postcss.parse(compiler.build(all));
const theme = [];
const base = postcss.root();
full.each((node) => {
  if (
    node.type === 'atrule' &&
    node.name === 'layer' &&
    node.params === 'utilities'
  )
    return;
  if (
    node.type === 'atrule' &&
    node.name === 'layer' &&
    node.params === 'theme'
  ) {
    node.walkDecls((d) => theme.push(`  ${d.prop}: ${d.value};`));
    return;
  }
  if (
    node.type === 'rule' &&
    /^(:root|\.dark|\.high-contrast)$/.test(node.selector)
  ) {
    theme.push(`/* ${node.selector} */`);
    base.append(node.clone());
    return;
  }
  base.append(node.clone());
});
// His :root/.dark/.high-contrast blocks are tokens: keep their literal values; everything else variables only.
const tokensRoot = postcss.root();
const baseOnly = postcss.root();
base.each((n) => {
  if (n.type === 'rule' && /^(:root|\.dark|\.high-contrast)$/.test(n.selector))
    tokensRoot.append(n.clone());
  else baseOnly.append(n.clone());
});
variablesOnly(baseOnly);
writeFileSync(join(outDir, 'base.css'), fontsAsTokens(baseOnly.toString()));
const lit = [...literalTokens]
  .filter(([, name], i, all) => all.findIndex(([, n]) => n === name) === i)
  .map(([value, name]) => `  ${name}: ${value};`)
  .join('\n');
const themeLines = theme
  .filter((l) => !l.startsWith('/*'))
  .flatMap((l) =>
    l.startsWith('  --default-font-family:')
      ? [
          ...FONT_TOKENS.map(([value, name]) => `  ${name}: ${value};`),
          '  --default-font-family: var(--font-sans);',
        ]
      : l.startsWith('  --default-mono-font-family:')
        ? ['  --default-mono-font-family: var(--font-mono);']
        : [l],
  );
writeFileSync(
  join(outDir, 'theme-tokens.css'),
  `:root {\n  /* Tailwind theme values used by the Admin Portal */\n${themeLines.join('\n')}\n  /* Fixed colours used directly by the original styles */\n${lit}\n}\n\n${tokensRoot.toString()}\n`,
);
writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
console.log(
  'files',
  report.files.length,
  'sites',
  report.files.reduce((a, f) => a + f.sites, 0),
  'classes',
  report.files.reduce((a, f) => a + f.classes, 0),
);
console.log('kept tokens', JSON.stringify(report.keptTokens));
console.log('manual', report.manual.length);
for (const m of report.manual) console.log('  ', m);
console.log(
  'literal colour tokens',
  literalTokens.size,
  'sized sites',
  report.sized,
);
