# Adding an application to the NPST Portal

A checklist for plugging an existing (or new) application into the portal as a **remote**: an app that is built and deployed on its own, and that the portal loads at runtime into its content area. The next real one is the HRMS ("Keka").

Working examples in this repository:

| App                 | Folder              | Framework                    | How the portal loads it                  |
| ------------------- | ------------------- | ---------------------------- | ---------------------------------------- |
| Sales Hub           | `apps/demo-react-a` | React                        | Module Federation (`./App` component)    |
| Projects & Delivery | `apps/demo-react-b` | React                        | Module Federation (`./App` component)    |
| People & HR         | `apps/demo-angular` | Angular (standard CLI build) | Plain ES module with `mount` / `unmount` |

Background: `docs/architecture.md` (sections 3–5) and `docs/PROGRESS.md` (Steps 4–14).

## 1. Choose the route

| Your app                                            | Route                                                              | What changes in your build                                              |
| --------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| React (18/19) built with Vite                       | **A. Module Federation**                                           | Add the `@module-federation/vite` plugin; share `react` and `react-dom` |
| Angular, Vue or any other framework, any build tool | **B. Mount contract**                                              | Nothing. Only `main.ts` exports `mount` / `unmount`                     |
| React with another bundler (webpack, Rspack)        | A with that bundler's official `@module-federation/*` plugin, or B | Same rules as A                                                         |

Route B also works for React apps; route A is preferred for React because the app then uses the portal's single React copy (smaller download, one React instance).

## 2. What every app receives and may do (both routes)

The portal passes the same props to every app (`libs/shared-contracts/src/mount-contract.ts`):

```ts
interface MfeProps {
  user: PlatformUser; // signed-in user: id, name, email, roles
  basePath: string; // where the app lives, e.g. '/keka'
  platform: PlatformApi; // portal features, see below
}
```

**Communication rules:**

- **Portal → app:** only these props.
- **App → portal:** only calls on `platform`:
  - `platform.notify.toast(message, { kind })`: the portal shows a confirmation.
  - `platform.permissions.can(action, resource)`: show or hide UI.
  - `platform.audit.history(entity, id)`: read change history, permission-gated.
- **App → app:** never directly. Work that crosses applications goes through backends and the Notification Service, and the user moves between apps through portal links. See `docs/architecture.md`, "Work across applications".
- **Never** import code from the portal or from another app.
- **Never** read, store or send session ids or tokens; the browser sends the portal's session cookie.
- **Never** build your own login screen.
- **Never** send email, SMS or OTP, or write audit events from the browser. Your backend calls the platform APIs server to server.
- **Something new needed from the portal?** It is added to `PlatformApi` as a versioned change, for a real use case only. Ask the platform team; do not add a side channel.

## 3. Route A: React through Module Federation

Reference: `apps/demo-react-a/vite.config.ts`.

1. **Add the federation plugin** with exact versions (no `^` / `~`): `@module-federation/vite` 1.23.11.
2. **Expose one component** that takes `MfeProps`:

   ```ts
   federation({
     name: 'keka', // unique, valid JS identifier
     filename: 'remoteEntry.js',
     manifest: true, // the portal reads mf-manifest.json
     exposes: { './App': './src/App.tsx' },
     shared: {
       react: { singleton: true, requiredVersion: '^19.3.1' },
       'react-dom': { singleton: true, requiredVersion: '^19.3.1' },
     },
     shareStrategy: 'loaded-first',
     dts: false,
   });
   ```

   Share only `react` and `react-dom`. Do **not** share a router: your router and the portal's would see each other's context.

3. **Load assets from your own server,** not the portal's, when your code runs on the portal's page. In development set `server.origin` to your own address (see the reference config), and check images and fonts on a production build served from another port.
4. **`src/App.tsx`** exports the component (named and default), wraps it in your own router with `basePath` and renders your pages.
5. **In the portal, register the remote:**
   - `apps/shell/vite.config.ts`: add `federation.remotes.keka` with `type: 'module'` and its `mf-manifest.json` URL, plus a test alias to `src/test/RemoteStub.tsx`.
   - `apps/shell/src/remotes/remote-modules.d.ts`: declare `keka/App`.
   - `apps/shell/src/remotes/registry.ts`: add `keka: { kind: 'react', load: () => import('keka/App') }`.

## 4. Route B: any framework through the mount contract

Reference: `apps/demo-angular/src/main.ts`. The build setup stays the standard one (`ng build`, the default `@angular/build:application` builder). No federation tooling, no custom webpack.

1. **Export `mount` and `unmount`** from the normal entry file:

   ```ts
   export async function mount(
     element: HTMLElement,
     props: MfeProps,
   ): Promise<void> {
     // Angular: createApplication({ providers: [...appConfig.providers,
     //   { provide: MFE_PROPS, useValue: props },
     //   { provide: APP_BASE_HREF, useValue: props.basePath }] }),
     // then appRef.bootstrap(App, hostElementInside(element)).
   }

   export async function unmount(element: HTMLElement): Promise<void> {
     // appRef.destroy(); element.replaceChildren();
   }
   ```

   - `mount` must be safe to call twice for the same element (no second instance).
   - `unmount` must release everything: subscriptions, timers, listeners and DOM.

2. **Pass the props down** with an injection token (Angular: `MFE_PROPS`) or your framework's equivalent.
3. **Keep the app working on its own:** `main.ts` still starts the app when it is opened directly, for development (see "Standalone mode" below).
4. **In the portal, register the remote:** `apps/shell/src/remotes/registry.ts`, add `keka: { kind: 'mount', load: () => loadEsmRemote(KEKA_URL) }`, with the URL from an environment variable as for `VITE_DEMO_ANGULAR_URL`.
   - The portal reads the current hashed file names from your built `index.html`. Your `index.html` must contain **exactly one** module script that exports `mount` and `unmount`; other module scripts (e.g. polyfills) are loaded first, in page order.

## 5. Checklist for every app

### Identity, access and catalogue

- [ ] **App id and path** agreed with the platform team (e.g. `keka`, `/keka`), and added to the app catalogue (Portal Home shortcut, left navigation).
- [ ] **Access permission** `access:<app-id>` mapped to the right roles. The portal checks it before loading the app; your backend checks it again.
- [ ] **In-app permissions** named `action:resource` (e.g. `approve:leave`). Use them only through `platform.permissions.can()`, and only to show or hide UI.

### Routing

- [ ] **Your pages live below `basePath`** (`/keka/leave`, `/keka/employees/42`). The portal routes `basePath/*` to you and never into your pages.
- [ ] **Your router uses `basePath`** as its base (Angular: `APP_BASE_HREF`; React: the router's `basename`, or the small router in `apps/demo-react-a/src/routing/router.tsx`).
- [ ] **Your router listens to `popstate`.** The portal fires it after its own navigation, so your router follows when the user clicks the portal's navigation. Firing `popstate` after your own navigation lets the portal's highlight follow you.
- [ ] **A catch-all route** renders nothing for URLs outside your app (Angular: `{ path: '**', children: [] }`), because the URL changes before you are unmounted.
- [ ] **Deep links work.** Opening `/keka/employees/42` directly, or from a notification, shows that page.

### Look and feel

- [ ] **Use only theme variables** (`var(--npst-…)` from `libs/design-tokens/src/theme.css`): no hard-coded colours, no UI library, no inline styles. The brand server can change any value at runtime.
- [ ] **Do not load your own `theme.css` inside the portal.** The portal already has it; only your standalone page imports it.
- [ ] **No global CSS that can leak into the portal:**
  - React: CSS modules.
  - Angular: component styles, or root styles scoped below one class (see `apps/demo-angular/src/app/app.ts`) that Angular removes on destroy.
  - Your global stylesheet (`styles.css`) is not loaded inside the portal.
- [ ] **Page structure like the other apps:** an eyebrow with the app name, the page title (h1), page tabs, then cards. Copy the patterns from Sales Hub or People & HR.
- [ ] **No logo** anywhere.

### Data and backend

- [ ] **All data access in one place** (React: `src/services/*`; Angular: an injectable service). Calls carry the browser's session cookie and no tokens.
- [ ] **Backends validate the session and permissions on every request.**
- [ ] **Notifications to other users** (approvals, hand-overs) are sent by your backend through the Notification Service, never from the browser. Each one has a `link` to the related page (a portal URL).

### Failure, deployment and caching

- [ ] **Fast first load.** The portal allows **8 s** per attempt, retries **once** after 1 s, then shows "<App> is not available right now" with **Try again** in your area only (`apps/shell/src/remotes/load-with-retry.ts`).
- [ ] **CORS:** your server allows the portal's origin for your entry files and assets.
- [ ] **Cache headers** (otherwise users keep an old version after a release):
  - `no-cache` for `index.html`, `mf-manifest.json` and `remoteEntry.js`;
  - long-lived `immutable` caching for hashed files.
- [ ] **Release independently:** build and deploy only your app. The portal picks up the new version on the next page load without a rebuild (`docs/PROGRESS.md`, Step 8).

### Standalone mode (development only)

- [ ] **Opened directly in development,** the app runs with the mock platform (`createMockPlatform` from `@npst/platform-mocks`):
  - a non-admin default user;
  - `?user=<id>` to switch user;
  - the same `permissions.can('access', appId)` check as the portal.
- [ ] **Opened directly in production,** it only shows "<App> is part of the NPST Portal and opens only inside it" with a link.
- [ ] **A production-build test** proves the build contains no mock users and no standalone harness. Examples:
  - `apps/demo-react-a/src/production-build.test.ts`;
  - `apps/demo-angular/scripts/check-production-build.mjs`.

### Tests

- [ ] **The app's own tests:** pages, filters, permissions (shown/hidden), toasts through `platform.notify.toast`, routing below `basePath`, `popstate`, and standalone mode.
- [ ] **Mount contract (route B):**
  - mounting twice gives one instance;
  - `unmount` destroys it (live-instance count back to 0);
  - styles are removed from the page.
- [ ] **In the portal's tests** (`apps/shell/src/App.test.tsx`), the app is replaced by a stub:
  - `RemoteStub` for route A, `mountStub` for route B;
  - tests cover: access by role, props passed, fallback and Try again, unmount on leave.

## 6. In this monorepo

When the app lives in this Nx workspace (as the demo apps do):

1. **Create it in `apps/<name>`** with its own `package.json` (`"nx": { "name": "<name>" }`, scripts `dev`, `build`, `test`, `lint`) and a fixed port with `strictPort`.
2. **Workspace libraries** (`@npst/shared-contracts`, `@npst/platform-mocks`) are `workspace:*` dependencies; run `pnpm install` and `pnpm nx sync`.
3. **Angular CLI apps:**
   - exclude the app from the `@nx/js/typescript` plugin in `nx.json`;
   - add the workspace libraries to `prebundle.exclude` of the dev server in `angular.json`.
4. **Before merging,** check with `pnpm nx run-many -t lint test typecheck build` and `pnpm nx run-many -t dev`.

An app that stays in its own repository uses the published contract package and the same checklist; only the build pipeline differs.

## 7. Worked example: adding the HRMS ("Keka") to this portal

A step-by-step for this repository, with app id `keka` and path `/keka`. Replace the names for any other app.

### Before you start

1. **Confirm Keka is an application your team builds** (you have its source code and can change its `main.ts`).
   - If it is a commercial product you only use (for example a hosted HRMS service), neither route in this guide applies: you cannot add `mount` / `unmount` or Module Federation to another company's product.
   - The options are then a portal link that opens it with single sign-on, an embedded frame if the vendor allows it, or new portal screens that use its APIs. Agree on that with the architecture owner first.
2. **Find out:**
   - its framework and version (Angular, React, …);
   - how it is built (`ng build`, Vite, webpack, …);
   - which address and port it runs on in development.
3. **Choose the route** (section 1): Angular or anything not React → route B (mount contract). React → route A (Module Federation).

### Files to change in the portal (this repository)

| What                                                     | File                                                | Change                                                                                                                                                        |
| -------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App list (Portal Home shortcut, left navigation, search) | `libs/platform-mocks/src/mock-data.ts` → `mockApps` | Add `{ id: 'keka', name: 'Keka HRMS', description: '…', path: '/keka' }`                                                                                      |
| Who may open it                                          | same file → `mockRolePermissions`                   | Add `'access:keka'` to the roles that may use it (at least `ADMIN`)                                                                                           |
| Icon and colour                                          | `apps/shell/src/ui/app-visuals.ts` → `VISUALS`      | Add `keka: { icon: 'people', tone: 3, short: 'Keka' }`. The icon must be a name defined in `apps/shell/src/ui/Icon.tsx`                                       |
| How the portal loads it, route B                         | `apps/shell/src/remotes/registry.ts`                | `keka: { kind: 'mount', load: () => loadEsmRemote(KEKA_URL) }`, with `const KEKA_URL: string = import.meta.env['VITE_KEKA_URL'] ?? 'http://localhost:4205/';` |
| How the portal loads it, route A (React)                 | `apps/shell/vite.config.ts`                         | Add a `federation.remotes.keka` entry (`type: 'module'`, its `mf-manifest.json` URL) and a test alias `'keka/App'` → `src/test/RemoteStub.tsx`                |
|                                                          | `apps/shell/src/remotes/remote-modules.d.ts`        | Declare `keka/App` like `demoReactA/App`                                                                                                                      |
|                                                          | `apps/shell/src/remotes/registry.ts`                | `keka: { kind: 'react', load: () => import('keka/App') }`                                                                                                     |

The portal routes `/keka/*` to the app and checks `access:keka` automatically, once the app is in `mockApps`.

### Changes in the Keka app (route B, Angular)

Model them on `apps/demo-angular`. The build configuration stays the same.

1. **`src/main.ts`** exports `mount(element, props)` and `unmount(element)`:
   - `createApplication` with the app's providers;
   - `{ provide: MFE_PROPS, useValue: props }`;
   - `{ provide: APP_BASE_HREF, useValue: props.basePath }`;
   - then `appRef.bootstrap(App, host)`.

   `unmount` calls `appRef.destroy()`. When the app is opened directly, it still starts on its own.

2. **`MFE_PROPS` injection token** (copy `apps/demo-angular/src/app/mfe-props.ts`): components read `user` and `platform` from it.
3. **Routes:** add `{ path: '**', children: [] }` as the last route.
4. **Styles:**
   - use theme variables (`var(--npst-…)`) instead of fixed colours;
   - keep styles in components, or scope them below one root class (see `apps/demo-angular/src/app/app.ts`);
   - the global `styles.css` is not loaded inside the portal.
5. **Contract types:** add `@npst/shared-contracts`.
   - Inside this monorepo: `"@npst/shared-contracts": "workspace:*"`, then `pnpm install`, `pnpm nx sync`, plus the `angular.json` and `nx.json` changes from section 6.
   - Outside it: copy `libs/shared-contracts/src/` until the contract is published as a package.

### Tests to update in the portal

Adding an app changes the app lists these tests expect:

- `libs/platform-mocks/src/create-mock-platform.test.ts`: the allowed app ids per user, and the catalogue length (currently 4).
- `apps/shell/src/App.test.tsx`: "application visibility per role" (the expected app names per user).

Add a test that a role without `access:keka` gets **Access denied** at `/keka`, as for the other apps.

### Run and check

```bash
# Terminal 1: the portal and the demo apps
pnpm nx run-many -t dev
# Terminal 2: Keka's own dev server on a free port, e.g.
ng serve --port 4205
```

1. Open http://localhost:4200, sign in as **Admin User**: Keka appears on Portal Home and in the left navigation.
2. Open it: it renders in the content area with the portal's header and navigation around it.
3. Navigate inside Keka, use the browser's back button, then click **Home**. In the console, Keka is destroyed (no second instance when you open it again).
4. Sign in as a user without `access:keka`: Keka is not listed, and http://localhost:4200/keka shows **Access denied**.
5. Stop Keka's server and open it: **"Keka HRMS is not available right now"** with Try again; the rest of the portal works.
6. Run `pnpm nx run-many -t lint test typecheck build`.

### If it does not load

The portal shows "Keka HRMS is not available right now". The browser console (F12) says why:

| Console message                                                               | Cause                                                                   | Fix                                                                                                |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `Failed to fetch` / connection refused                                        | Wrong address or port, or Keka's server is not running                  | Check `VITE_KEKA_URL` (default `http://localhost:4205/`) and that Keka's dev server is up          |
| `blocked by CORS policy`                                                      | Keka's server does not allow the portal's address                       | Allow `http://localhost:4200` (and later the real portal address) for its `index.html` and scripts |
| `Remote must have exactly one entry exporting mount() and unmount(), found 0` | `main.ts` does not export them, or `index.html` points to another entry | Export both from the entry file that `index.html` loads                                            |
| `… found 2`                                                                   | Two module scripts export `mount` / `unmount`                           | Export them from one entry only                                                                    |
| `Remote did not load within 8000 ms`                                          | Keka's server is too slow or does not answer                            | Check the server; the first dev start can be slow, so click Try again                              |
| Keka shows but pages are wrong or blank                                       | Router does not use `basePath`, or no catch-all route                   | Set `APP_BASE_HREF` to `props.basePath`; add `{ path: '**', children: [] }`                        |
| Keka shows but colours or layout of the portal change                         | Global CSS from Keka leaks into the page                                | Move styles into components or scope them below Keka's root class                                  |
