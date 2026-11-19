# Deep linking: task list (one application at a time)

Work items for `docs/deep-linking.md`. Each step has a prompt for the coding assistant, the files involved and how to check it. Do the steps in order for one application; review and commit each step (`<app-id> N: <summary>`), then repeat for the next application.

## Before starting

```bash
git pull
pnpm install
pnpm nx run-many -t lint test typecheck build   # must pass before any change
pnpm nx run-many -t dev -p shell brand-server demo-react-a demo-angular --parallel=4
# http://localhost:4200, admin@npst.com / Admin@123 → Applications → Deal Pulse / Keka HR open in-app
```

## Prompt 0: project context (paste first in every new chat)

```text
You are working in the NPST Platform repository (Nx monorepo, pnpm, TypeScript strict).
Read docs/architecture.md, docs/adding-a-remote.md, docs/deep-linking.md and the latest steps of
docs/PROGRESS.md before changing anything.

Architecture: apps/shell is the NPST Portal (React 19, Vite, react-router 8). Internal
applications open INSIDE the portal (never a new tab) as micro-frontends:
- React apps through Module Federation (@module-federation/vite, React shared as a singleton,
  shareStrategy 'loaded-first'); example apps/demo-react-a.
- Other frameworks through the mount contract: the app's entry exports mount(element, props) and
  unmount(element); the portal loads its built ES module; example apps/demo-angular.
Every app receives props { user, basePath, platform } (libs/shared-contracts: MfeProps,
PlatformApi), owns its routes below basePath, has no login of its own (the portal's central
session), and calls the portal only through `platform` (notify.toast, permissions.can,
audit.history). Apps never import each other or the portal.
Registration: apps/shell/src/remotes/registry.ts, apps/shell/vite.config.ts (React remotes),
libs/platform-mocks/src/mock-data.ts (app catalogue and access).

Rules:
- One small step at a time. Before changing files, list what you will change and wait for "go".
- No new dependencies without asking (name, reason, exact version).
- CSS variables from the theme only, no inline styles, API calls only in services/.
- Do not change PlatformApi (libs/shared-contracts) unless I ask.
- Do not delete files or folders; no destructive git commands.
- After each step: run `pnpm nx run-many -t lint test typecheck build`, list the files changed,
  and update docs/PROGRESS.md (done, decisions, open issues, next step).
```

## Step 1: inventory (no code)

Collect the answers in `docs/deep-linking.md` section 4 for the application. Then:

```text
Here is the information about <APP NAME>: <paste framework/version, build tool, router, login,
frame, global CSS, backend URLs, needed platform features, pages to link>.
1. Tell me which route it takes (A: React via Module Federation, B: mount contract) and why,
   following docs/adding-a-remote.md section 1.
2. List the changes needed in the app and in the portal, as a numbered plan of small steps.
3. Add the app to the table in docs/deep-linking.md section 1 (id, path, route, framework).
Do not change code yet.
```

## Step 2: bring the app into the monorepo

```text
<APP NAME> step 2. The source is in <path or repository>. Bring it into this monorepo as
apps/<app-id> so that it builds and runs ON ITS OWN, unchanged otherwise:
- an Nx project (package.json "nx": { "name": "<app-id>" } like apps/demo-react-a or
  apps/demo-angular), scripts dev/build/lint/test;
- dev server on fixed port <port> (strictPort);
- its dependencies in its own package.json with exact versions (list any that are new to the
  workspace and wait for my approval before installing).
Show the plan first and wait for my go. Check: `pnpm nx run <app-id>:build` and its dev server.
```

## Step 3: make it a remote

**Route A (React):**

```text
<APP NAME> step 3 (route A). Following docs/adding-a-remote.md section 3 and apps/demo-react-a:
- add @module-federation/vite to apps/<app-id>/vite.config.* exactly as in apps/demo-react-a
  (name, exposes './App', shared react and react-dom as singletons with requiredVersion,
  shareStrategy 'loaded-first', dts false);
- create src/App.tsx exporting the app as a component that takes MfeProps
  { user, basePath, platform } and renders the app's routes below basePath;
- keep a development-only standalone entry with the mock platform, like
  apps/demo-react-a/src/standalone/.
List the files first and wait for my go.
```

**Route B (other frameworks):**

```text
<APP NAME> step 3 (route B). Following docs/adding-a-remote.md sections 4 and 7 and
apps/demo-angular:
- the app's entry exports mount(element, props) and unmount(element) (types MountableMfe and
  MfeProps from libs/shared-contracts); mount renders the app into `element` with the props;
  unmount destroys it completely;
- the router works below props.basePath;
- keep a development-only standalone start with the mock platform, like
  apps/demo-angular/src/standalone/.
List the files first and wait for my go.
```

## Step 4: remove the own login and frame; use the contract

```text
<APP NAME> step 4. Inside the portal the app must not show its own login, header or sidebar.
- Take the signed-in user from props.user (no own session, no tokens in the browser).
- Replace its role checks with platform.permissions.can(action, resource).
- Replace its toasts/snackbars with platform.notify.toast(message, { kind }).
- Its API calls become relative (/api/<service>/...) in its services/ files; the browser sends
  the portal's session cookie.
- Its pages render in the portal's content area only.
Keep the standalone development mode working with the mock platform.
List the files first and wait for my go.
```

## Step 5: register it in the portal

```text
<APP NAME> step 5. Register the app in the portal so it opens in-app at /<app-path>:
- libs/platform-mocks/src/mock-data.ts: add { id: '<app-id>', name, description, path } to
  mockApps and give the right users access (MockUser.apps); update its tests;
- apps/shell/src/remotes/registry.ts: add the remote (route A: import('<remoteName>/App');
  route B: loadEsmRemote(<URL from an env variable>, default http://localhost:<port>/));
- route A only: add the remote to `remotes` in apps/shell/vite.config.ts and a test alias to the
  remote stub, like demoReactA;
- apps/shell/src/App.test.tsx: the app opens at /<app-path> with the host props, unmounts on
  leave, shows the fallback when it is down (copy the Deal Pulse / Keka HR tests).
If the app replaces a stand-in (Deal Pulse → DealPulse, Keka HR → PeopleOS), point the existing
id to the new remote instead of adding a second entry. List the files first and wait for my go.
```

**Check:** sign in, open the app from the sidebar, a Dashboard card and a bell item: it opens in the content area, same tab. Reload an inner page. Stop the app's dev server: the fallback shows, the portal keeps working.

## Step 6: in-app links everywhere

```text
<APP NAME> step 6. Make every way into the app stay inside the portal:
- notifications and reminders that point to this app use portal paths (/<app-path>/...);
  in this repository they come from libs/mock-backend (seed/platform.ts, api/*.ts);
- the Dashboard registry card links use the portal path (components/common/AppPortalLink.tsx
  already does this for apps in the catalogue);
- links from the app to another app are normal links to that app's portal path, without
  target="_blank";
- search results (top bar) point to portal paths.
Add a test that a bell item for this app opens it in-app. List the files first and wait for my go.
```

## Step 7: look and feel

```text
<APP NAME> step 7. Make the app look like the portal:
- map its colours, font and radius to the portal's CSS variables (libs/design-tokens/src/theme.css,
  section 5 shows how the stand-ins do it);
- scope its global CSS (resets, body styles, fonts) so nothing leaks into the portal;
- check light and dark mode (top bar → Accessibility → Dark).
No inline styles, no hard-coded colours. List the files first and wait for my go.
```

## Step 8: done check

Run the checks in `docs/deep-linking.md` section 6 with the production builds (`pnpm nx run-many -t build`, then preview), record the results in `docs/PROGRESS.md`, and move to the next application.
