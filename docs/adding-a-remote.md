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
