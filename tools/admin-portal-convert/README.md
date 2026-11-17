# Admin Portal converter (Step 18)

One-off tool used to move the Admin Portal UI (`reference/admin-portal-original/`) onto the NPST
frontend standards **without changing how it looks**: no UI library, no Tailwind at runtime,
CSS variables only, no inline styles.

It is not part of any build. It is kept so reviewers can see how the CSS was produced and so it
can be re-run if the original changes.

## What it does

1. Compiles the original `src/index.css` with **Tailwind's own compiler** (from the original
   app's `node_modules`), so every generated rule is exactly what Tailwind would have produced.
2. For every `className` (and `cn()` / `cva()` argument) in the original `.tsx` files, creates
   one class in a `<File>.module.css` next to the file and replaces the string with
   `styles.<name>`. The original Tailwind classes stay as a comment above each rule.
3. Replaces fixed colours with tokens (`--fixed-*`) and font names with `--font-heading`,
   `--font-sans`, `--font-mono`.
4. Shared components (`components/ui`) are wrapped in the `ui` cascade layer, so a page's own
   classes win over them (what `tailwind-merge` did in the original).
5. Writes the global pieces: `theme-tokens.css` (added to `libs/design-tokens/src/theme.css`)
   and `base.css` (`apps/shell/src/styles/admin-portal-base.css`).

Imports are rewritten to in-house modules: `lucide-react` → `@/components/icons`,
`class-variance-authority` → `@/lib/variants`, `sonner` → `@/lib/toast`,
`react-router-dom` → `react-router`.

## What is done by hand afterwards

- Components that used Base UI behaviour (dialog, sheet, select, menu, popover, checkbox, tabs)
  are written in-house in `apps/shell/src/components/ui/`, reusing the generated CSS modules.
- Remaining inline styles (dynamic colours in the Branding preview, avatars, colour picker) are
  replaced with CSS variables set from code, page by page (`report.json` lists them).
- Wiring to the platform (session, `PlatformApi`, toasts, bell) is done per page.

## Run

```bash
# 1. a copy of the original with its own dependencies (outside the repo)
cp -R reference/admin-portal-original <copy> && (cd <copy> && npm install --ignore-scripts)
# 2. convert
node tools/admin-portal-convert/convert.mjs <copy> <outDir>
```

`<outDir>/report.json` lists converted files, kept global classes and items needing manual work.
