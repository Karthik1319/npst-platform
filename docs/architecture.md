# NPST Shared Platform Architecture (Branding Layer)

**Recommendation: Nx + Module Federation + Runtime CSS**

| Decision area                      | Recommendation                                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Repository and build orchestration | Nx monorepo for the host, MFEs and shared platform libraries                                               |
| Runtime application composition    | Module Federation (MF) for loading independently deployed remotes                                          |
| Branding and theming               | Versioned runtime `theme.css` generated from design tokens                                                 |
| Framework mix                      | React host and React remotes; Angular MFE integrated through a mount/unmount contract                      |
| Shared UI widgets                  | React packages for React apps first; Web Components only where cross-framework reuse is genuinely required |

## 1. Summary

Nx, Module Federation and runtime CSS each solve a different problem:

- **Nx** manages the codebase and build workflow.
- **Module Federation** composes independently deployed frontend apps at runtime.
- **Runtime CSS** lets branding changes reach every app without rebuilding it.

The target is a React host with several React MFEs and one Angular MFE. React apps share compatible React dependencies through MF. The Angular app exposes a framework-neutral mount/unmount interface: the React host provides a DOM container and Angular renders inside it.

Nx is recommended only if NPST is ready to bring the apps and shared libraries into one monorepo. If teams keep separate repositories, MF and runtime CSS still work without Nx.

**Scope:** portal shell and MFE integration, centralised authentication and session, shared branding tokens and theme delivery, shared shell elements (header, notification bell/panel, app launcher), repository strategy and runtime remote loading.

## 2. Architecture

| Layer               | Technology                            | Responsibility                                                                                                                 | What it does not do                                                                                           |
| ------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Development/build   | Nx                                    | Monorepo, project graph, shared libraries, affected builds/tests, caching                                                      | No runtime remote loading; does not remove MF runtime risks                                                   |
| Runtime composition | Module Federation                     | Loads remotes at runtime, manages entry points, shares compatible dependencies (React as a singleton with version constraints) | Does not turn a React component into an Angular one; each framework still needs its own rendering integration |
| Branding            | Design tokens + versioned `theme.css` | Delivers colours, fonts, logos and light/dark themes without app rebuilds; bundled fallback if the brand server is down        | No widget behaviour or layout changes                                                                         |

```
                    ┌──────────────────────────────┐
                    │   NPST Portal (React host)   │
                    └──────────────┬───────────────┘
                                   │
                         Module Federation runtime
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
 ┌────────┴────────┐      ┌────────┴────────┐      ┌────────┴────────┐
 │   React MFEs    │      │   React MFEs    │      │   Angular MFE   │
 │ (native React)  │      │ (native React)  │      │ (mount contract)│
 └────────┬────────┘      └────────┬────────┘      └────────┬────────┘
          └────────────────────────┼────────────────────────┘
                                   │
                    ┌──────────────┴───────────────┐
                    │  Shared platform libraries   │
                    │ (tokens, auth, types, shell) │
                    └──────────────────────────────┘
          Nx workspace manages projects, dependencies and builds

 Brand admin ──► token build ──► brand server ──► versioned theme.css + assets
                                                  (loaded by portal and every MFE)
```

## 3. Framework integration

The topology below is illustrative (a React host, four React MFEs and one Angular MFE);

| Application type         | Integration approach                                                     | Key considerations                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| React host + React MFE   | Load remote React modules through MF                                     | Align React/React DOM versions; configure shared dependencies carefully; test singleton behaviour                    |
| React host + Angular MFE | Angular remote exposes `mount(element, props)` and `unmount(element)`    | Angular bootstraps inside the supplied element; host manages container lifecycle, routing hand-off and communication |
| Future Vue or other MFE  | Framework-specific mount contract, or Web Components for a common widget | MF alone does not make framework components interchangeable                                                          |

### Angular mount contract

The React host creates a container and calls `mount`; Angular renders inside it. On navigation away, the host calls `unmount` so Angular cleans up.

```ts
// Angular remote (illustrative)
export async function mount(element, props) {
  // Bootstrap Angular and render inside `element`.
}
export async function unmount(element) {
  // Destroy the Angular application and release resources.
}

// React host (illustrative; see "Loading remotes without changing their build tooling")
const remote = await loadEsmRemote('https://angular-mfe.example/');
await remote.mount(containerElement, props);
```

MF does not supply this contract; We must define and test inputs (props), outputs (platform calls), error reporting, authentication context, navigation and cleanup.

### Loading remotes without changing their build tooling

Federation is new to NPST, so app teams must not have to migrate their build tooling to join the portal. The contract an app follows (mount/unmount, props, routing, cleanup) is fixed; how its files are delivered depends on what the app shares with the host:

| Remote type                      | Delivery                                                                                                                                         | Why                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| React MFE                        | Module Federation remote (`mf-manifest.json`, `remoteEntry.js`), using the `@module-federation/*` plugin for its bundler (Vite, Rspack, webpack) | Must share the host's single React copy, which only MF provides                                    |
| Angular (or other non-React) MFE | Plain ES module from the app's **standard build** (e.g. Angular CLI `ng build`, default builder); the entry file exports `mount` and `unmount`   | Shares nothing with the React host, so MF adds no value; no build-tool change or federation plugin |

For a plain ES-module remote, the host reads the current (hashed) entry file names from the remote's own built `index.html`, imports the entry modules in page order (e.g. Angular `polyfills` before `main`), and calls `mount` with the same props as React remotes. Errors show the same fallback as any remote. Verified with Angular 22 (zoneless and zone.js apps), in development (`ng serve`) and production builds.

What an Angular team changes (app code only, see the integration guide):

- `main.ts` exports `mount(element, props)` and `unmount(element)`, and still starts on its own when opened directly (development).
- Props reach components through an injection token; the router uses `APP_BASE_HREF = basePath` and a catch-all route for URLs outside the app.
- Styles live in components and use the theme variables; the app's global stylesheet is not loaded inside the portal.
- The server allows the portal's origin (CORS), as for any remote.

The host fires the standard `popstate` event after its own navigation, so the router inside any MFE (Angular or React) follows URL changes made by the portal.

### Communication

Loading an MFE (Module Federation: remote entry, manifest, shared dependencies) and communicating with it are separate concerns. This section covers communication only.

**Current scope: parent–child (Shell ↔ MFE), two-way.** The NPST MFEs (e.g. Keka, Salesforce, LMS, NPST DealDesk) are independent applications that do not depend on each other, so the only communication needed is between the Host Portal (parent) and each MFE (child). It uses the typed contract in `shared-contracts`, the same for React and Angular:

| Direction   | How                                                                     | Examples                                                                                          |
| ----------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Shell → MFE | Props: `{ user, basePath, platform }` (React props, or Angular `mount`) | Signed-in user; route prefix; `platform.permissions.can()` to show or hide UI                     |
| MFE → Shell | Calls on the `platform` object (`PlatformApi`)                          | `platform.notify.toast()` shows a toast in the Host Portal; `platform.audit.history()` reads data |

```ts
// shared-contracts (simplified)
interface MfeProps {
  user: PlatformUser;
  basePath: string; // e.g. '/keka'
  platform: PlatformApi; // versioned; additive changes only
}
```

Rules:

- Each MFE manages its own internal pages and navigation below `basePath`; the Host Portal only routes `basePath/*` to it.
- No extra channel (event bus, global state, `window` messages) is added for the current scope. If an MFE needs something new from the Host Portal, it is added to `PlatformApi` as a versioned change, only for a real use case. Example to settle during the real authentication work: when an API call reports an expired session, the Host Portal sends the user to its login page.
- MFEs never import the Host Portal or each other.

**Future scope (not implemented): MFE ↔ MFE.** Some future MFEs may need to exchange information, for example OpenProject and Keka (an OpenProject task referring to an employee or leave in Keka). Recommended approach when such a case is confirmed:

- **Deep links first:** "open this item in the other app" is a portal URL (e.g. `/keka/leave/42`); the target MFE reads its own route. No runtime coupling.
- **Shared data through backends:** data one app needs from another is fetched server-to-server through the owning app's API, with the user's permissions checked there. This also covers other users and persistence, which browser messages cannot.
- **Live in-browser notifications only if needed:** a typed, versioned, shell-mediated channel added to `PlatformApi` (the Host Portal relays messages and owns the message types), not a free-form global bus. Each message type has one owner, a version and contract tests.

The decision, message types and owners are agreed per use case before any implementation.

**Work across applications, as the POC shows it.** One business process can span several applications without any MFE-to-MFE channel. Example (Sales Hub → Projects & Delivery):

1. A sales user asks for a solution proposal on an opportunity in Sales Hub. Sales Hub calls **its own backend**.
2. That backend creates the task in the Solutions team's queue (server to server) and asks the **Notification Service** to notify the team.
3. The Host Portal's bell shows the notification; its link is a **deep link** (`/projects/tasks?task=T-…`) that opens the task in Projects & Delivery.
4. When the Solutions team completes the task, the delivery backend updates the opportunity's timeline and notifies the Sales team the same way.

The two MFEs never load, import or message each other; the browser only carries the user from one app to the other through portal URLs. In the POC the backends and the Notification Service are simulated by `libs/mock-backend`, which keeps its data in the browser's `localStorage` so the flow can be shown by signing in as different users.

## 4. Centralised branding

### What is centralised

| Central platform owns                                                                                                                                                       | Each MFE keeps                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Primary, secondary and status colours; typography and type scale; logos, favicons, brand images; light/dark theme values; shared shell appearance; button/input/link tokens | Business screens and workflows; domain components; module data and APIs; module-specific validation and behaviour |

### Token layers

| Layer     | Example                                      | Purpose                                        |
| --------- | -------------------------------------------- | ---------------------------------------------- |
| Primitive | `color.blue.600`, `color.orange.600`         | Raw palette values; used only to define themes |
| Semantic  | `color.action.primary`, `color.text.default` | Meaning-based values consumed by apps          |
| Component | `button.primary.bg`, `notification.badge.bg` | Values for shared components                   |

Apps use semantic and component tokens only; a lint rule blocks hard-coded colours.

### Publish flow

1. A branding admin edits a draft in the portal admin area.
2. The platform validates token names and values and checks colour contrast.
3. A second authorised person approves.
4. The token build produces a new, immutable `theme.css` version and brand assets.
5. The brand server moves the current-version pointer; apps load the new theme on their next page load.
6. Rollback moves the pointer back to an earlier version.

Never overwrite a published file, bundle fallback CSS with every app, and set and test the cache policy so the time for a change to appear is known.

## 5. Centralised authentication and session

The NPST Host Portal is the single entry point for user authentication. Individual MFEs must not implement their own login mechanisms.

### Authentication flow

1. The user logs in through the Host Portal.
2. The backend authenticates the user.
3. The backend creates a central session and sets a secure session cookie in the browser.
4. The Host Portal loads the authorised MFEs.
5. All MFEs make backend API requests using the same browser-managed session cookie.
6. The backend validates the session on every protected API request.
7. Logging out from the Host Portal invalidates the central session, affecting all MFEs.

```
 User ──► Host Portal login ──► Backend: authenticate, create central session
                                         │
                                         └─► Set-Cookie: secure session cookie (browser-managed)

 Host Portal ──► loads authorised MFEs (user + platform passed as props)
 MFE A / MFE B / Angular MFE ──► API requests (browser sends the same cookie)
                                         │
                                         └─► Backend validates session + permissions on every request

 Logout in Host Portal ──► Backend invalidates the central session ──► every MFE loses access
```

### Implementation rules

| Rule                        | Meaning                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------- |
| Central authentication      | Authentication and session creation are managed centrally (Host Portal + backend).  |
| No MFE login                | MFEs do not maintain independent login sessions.                                    |
| No session handling in MFEs | MFEs do not manually manage or store session identifiers.                           |
| Browser-managed cookies     | Authenticated API requests use browser-managed cookies.                             |
| Backend enforcement         | Backend APIs independently validate sessions and permissions.                       |
| UI checks are not security  | Frontend permission checks only control UI visibility.                              |
| Central logout              | Logging out invalidates access across all MFEs.                                     |
| POC                         | The POC may use mock authentication, but must follow this centralised architecture. |

Actual cookie configuration, CSRF protection, CORS and backend integration will be decided during authentication implementation.

### How the POC follows this

| Flow step   | POC (mock)                                                                                                                                                      | Later (real)                                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Login       | Host Portal login page; the user picks a mock user (no password)                                                                                                | Host Portal login backed by the authentication backend                                                             |
| Session     | The Host Portal keeps the mock user's id in tab storage, standing in for the backend session; MFEs never see or store it                                        | Secure, browser-managed session cookie set by the backend; the Host Portal reads the current user from the backend |
| MFEs        | Receive `user` and `platform` from the Host Portal as props; no login screens or session code; standalone mode (development only) uses mock users without login | Same props; API calls carry the session cookie automatically                                                       |
| Permissions | `platform.permissions.can()` shows or hides UI only                                                                                                             | Backend validates session and permissions on every request                                                         |
| Logout      | Clears the mock session and removes all MFEs from the page                                                                                                      | Invalidates the central session for all MFEs                                                                       |

## 6. Options considered

Branding delivery is separate from the repository and runtime-composition decisions. Nx can be combined with several options; it does not replace MF.

| Option                                   | Description                                                                | Strengths                                                                                | Limitations                                                                                                            |
| ---------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **A. Runtime theme.css + npm packages**  | Brand CSS loaded at runtime; widgets ship as npm packages inside each MFE  | Simple; fallback is bundled; widget versions fixed at build                              | Widget changes need package upgrades and redeploys; may need per-framework packages                                    |
| **B. Module Federation + runtime CSS**   | Widgets or MFEs loaded as remotes; theme CSS separate                      | Runtime code updates; independent remote deployment; good for React host + React remotes | Remote availability, versioning, security and React sharing need controls; other frameworks need rendering integration |
| **C. Nx monorepo without MF**            | Apps and shared libraries in one Nx workspace; shared code built into apps | Project graph, shared tooling, affected builds/tests; no runtime remote dependency       | No runtime widget updates; shared-code changes rebuild consumers; all apps must be in the monorepo                     |
| **D. Nx + MF**                           | Nx manages workspace and builds; MF loads remotes at runtime               | Nx orchestration plus runtime composition; suits a multi-MFE workspace                   | Needs monorepo adoption and MF safeguards; Nx does not remove MF runtime risks                                         |
| **E. Web Components + version registry** | Widgets are custom elements; a registry and loader pick versions           | One widget works in React, Vue and Angular; Shadow DOM isolates styles                   | NPST owns the loader, retries, timeouts, fallback and registry; needs Web Components/Lit skills                        |
| **F. Web Components through MF**         | Web Components exposed as MF remotes                                       | Framework-independent widget contract plus MF runtime tooling                            | Complexity of both; still needs fallback, version governance and remote security                                       |

### Combinations with Nx

| Combination | What it adds                                                    | Trade-off                                                                      |
| ----------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Nx + A      | Monorepo orchestration, runtime branding, npm-delivered widgets | Simpler runtime; widget changes still need redeployment                        |
| **Nx + B**  | Monorepo orchestration, MF remote loading, runtime branding     | **Recommended** for the React-host/MFE model; needs monorepo and MF governance |
| Nx + E      | Monorepo plus framework-independent widgets                     | Good for cross-framework widgets; NPST owns the loader                         |
| Nx + F      | Nx plus MF delivery of Web Components                           | Most capability, highest operational and learning cost                         |

### Comparison

| Criterion                     | A                | B                     | C                                | D (Nx + MF)        | E                       | F                            |
| ----------------------------- | ---------------- | --------------------- | -------------------------------- | ------------------ | ----------------------- | ---------------------------- |
| Runtime branding changes      | Yes              | Yes                   | With CSS added                   | Yes                | Yes                     | Yes                          |
| Runtime widget/code updates   | No               | Yes                   | No                               | Yes                | Yes                     | Yes                          |
| Monorepo orchestration        | Optional         | Optional              | Yes                              | Yes                | Optional                | Optional                     |
| Framework-independent widgets | No               | No                    | No                               | No                 | Yes                     | Yes                          |
| MF runtime dependency         | No               | Yes                   | No                               | Yes                | No                      | Yes                          |
| Custom loader needed          | No               | No                    | No                               | No                 | Yes                     | No                           |
| Best fit                      | Simple shared UI | Runtime React remotes | Central repo, no runtime remotes | Multi-MFE monorepo | Cross-framework widgets | Cross-framework widgets + MF |

Framework independence comes from the component contract, not from MF: MF can load code from any framework, but a React component still needs React to render. A Web Component is a browser standard that any framework can consume.

## 7. Why Nx + MF + runtime CSS

- Each need gets its own tool: Nx for engineering workflow, MF for runtime composition, CSS tokens for branding.
- It fits a React host with several React MFEs, which share one compatible React copy through MF.
- The Angular MFE stays Angular, rendering inside the React host through the mount contract.
- Visual brand changes are separated from code releases.
- Nx gives one project graph and affected-only builds once apps are in the monorepo.

## 8. Risks and controls

| Risk                                                | Why it matters                                                       | Control                                                                                                                                                                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Remote unavailable or slow                          | Part of the portal could go blank                                    | Bundled fallback for critical shell UI; bounded retries and timeouts; health monitoring; remote-offline tests                                                                                                        |
| React version mismatch or duplicate runtime         | Runtime errors                                                       | Pin compatible versions; singleton sharing; enforce required versions; test exact host/remote combinations                                                                                                           |
| Angular lifecycle leaks                             | Repeated mounting leaves listeners, subscriptions or DOM behind      | Documented mount/unmount contract; automated lifecycle tests; destroy resources on unmount                                                                                                                           |
| Remote code security                                | Runtime-loaded code runs in the app's context                        | Internal origins only; CSP; protected CI publishing; access and integrity reviews                                                                                                                                    |
| Non-atomic releases and version drift               | Apps may get incompatible remote versions                            | Immutable versions, controlled pointers, staged rollout, compatibility checks, rollback                                                                                                                              |
| Brand server unavailable                            | Apps miss the latest theme                                           | Bundled fallback CSS/assets; resilient hosting; deliberate cache policy                                                                                                                                              |
| Monorepo migration and ownership                    | Workflows and release responsibilities change                        | Pilot migration; code owners, access boundaries, independent pipelines, contribution standards                                                                                                                       |
| MFE handles its own login or session                | Inconsistent sessions; logout does not end access everywhere         | Host Portal is the only login; MFEs never store session identifiers; browser-managed session cookie; backend validates every request                                                                                 |
| Global CSS or scripts from an MFE affect the portal | A non-React MFE's global styles or polyfills apply to the whole page | Only component styles inside the portal; theme variables only; zoneless Angular for new apps (zone.js patches browser APIs for the whole page and cannot be unloaded); test with two zone.js MFEs before allowing it |
| Hidden coupling between MFEs                        | One app's change silently breaks another                             | Shell ↔ MFE contract only; no global event bus; future MFE ↔ MFE needs agreed per use case with typed, versioned, owned contracts                                                                                    |
| Nx cache strategy                                   | Remote caching adds infrastructure and security concerns             | Start with local caching; assess an approved remote-cache option separately                                                                                                                                          |

## 9. Repository structure (example)

```
npst-platform/
├── apps/
│   ├── portal-host/        # React host
│   ├── react-mfe/          # React remote
│   ├── react-mfe/        # React remote
│   ├── react-mfe/     # React remote
│   ├── react-mfe/      # React remote
│   └── angular-mfe/        # Angular remote with mount contract
├── libs/
│   ├── design-tokens/      # Token source and generated fallback CSS
│   ├── shared-types/       # Framework-neutral contracts and types
│   ├── shared-auth/        # Framework-neutral auth helpers
│   ├── react-ui/           # React-only shared components
│   └── app-shell/          # Header, bell, launcher (React first)
├── tools/
├── nx.json
└── package.json
```

Keep framework-specific libraries separate.

## 10. Roadmap

| Phase                   | Work                                                                                                          | Exit condition                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1. Validate topology    | Confirm app inventory, framework versions, deployment ownership, repos, routing and identity flow             | Agreed target topology and migration boundary                                            |
| 2. Nx proof of concept  | Small workspace with React host, one React remote, one Angular remote; test orchestration and affected builds | Developers run and test the pilot consistently                                           |
| 3. MF proof of concept  | React sharing, remote entry points, version compatibility, failure handling, Angular mount/unmount            | Host loads React and Angular remotes; navigation, props, platform calls and cleanup work |
| 4. Branding foundation  | Token layers, `theme.css` build, versioned hosting, fallback CSS, cache policy                                | A brand change appears in host and pilot remote without rebuilding                       |
| 5. Shell widget pilot   | One shared widget with API integration, loading states, fallback, telemetry, contract tests                   | Widget updates independently and rolls back safely                                       |
| 6. Production hardening | Security controls, CI gates, visual regression, browser tests, runbooks, monitoring                           | Operational readiness sign-off                                                           |
| 7. Incremental adoption | Migrate further apps and libraries in planned waves                                                           | Adoption driven by pilot results, no big-bang migration                                  |

### Pilot acceptance criteria

- The host and required remotes start with documented Nx commands.
- A change to one MFE doesn't trigger builds of unrelated projects.
- The React host loads at least one React remote with the agreed MF configuration.
- The React host mounts and unmounts the Angular MFE without duplicate instances or leaks.
- A published `theme.css` change updates the host and pilot MFE without rebuilding either.
- With the brand server down, apps render using the bundled fallback theme.
- With a remote down, the host shows a defined fallback or error state, not a blank shell.
- Users log in only through the Host Portal; logging out ends access in every MFE.
- A remote version can be rolled back through a controlled release mechanism.
- Authentication, routing, Shell ↔ MFE communication, logging and error behaviour are documented and tested.
