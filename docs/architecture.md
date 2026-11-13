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

**Scope:** portal shell and MFE integration, shared branding tokens and theme delivery, shared shell elements (header, notification bell/panel, app launcher), repository strategy and runtime remote loading.

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

// React host (illustrative)
const remote = await loadRemote('angularMfe/entry');
await remote.mount(containerElement, props);
```

MF does not supply this contract; We must define and test inputs, outputs/events, error reporting, authentication context, navigation and cleanup.

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

## 5. Options considered

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

## 6. Why Nx + MF + runtime CSS

- Each need gets its own tool: Nx for engineering workflow, MF for runtime composition, CSS tokens for branding.
- It fits a React host with several React MFEs, which share one compatible React copy through MF.
- The Angular MFE stays Angular, rendering inside the React host through the mount contract.
- Visual brand changes are separated from code releases.
- Nx gives one project graph and affected-only builds once apps are in the monorepo.

## 7. Risks and controls

| Risk                                        | Why it matters                                                  | Control                                                                                                       |
| ------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Remote unavailable or slow                  | Part of the portal could go blank                               | Bundled fallback for critical shell UI; bounded retries and timeouts; health monitoring; remote-offline tests |
| React version mismatch or duplicate runtime | Runtime errors                                                  | Pin compatible versions; singleton sharing; enforce required versions; test exact host/remote combinations    |
| Angular lifecycle leaks                     | Repeated mounting leaves listeners, subscriptions or DOM behind | Documented mount/unmount contract; automated lifecycle tests; destroy resources on unmount                    |
| Remote code security                        | Runtime-loaded code runs in the app's context                   | Internal origins only; CSP; protected CI publishing; access and integrity reviews                             |
| Non-atomic releases and version drift       | Apps may get incompatible remote versions                       | Immutable versions, controlled pointers, staged rollout, compatibility checks, rollback                       |
| Brand server unavailable                    | Apps miss the latest theme                                      | Bundled fallback CSS/assets; resilient hosting; deliberate cache policy                                       |
| Monorepo migration and ownership            | Workflows and release responsibilities change                   | Pilot migration; code owners, access boundaries, independent pipelines, contribution standards                |
| Nx cache strategy                           | Remote caching adds infrastructure and security concerns        | Start with local caching; assess an approved remote-cache option separately                                   |

## 8. Repository structure (example)

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

## 9. Roadmap

| Phase                   | Work                                                                                                          | Exit condition                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1. Validate topology    | Confirm app inventory, framework versions, deployment ownership, repos, routing and identity flow             | Agreed target topology and migration boundary                                   |
| 2. Nx proof of concept  | Small workspace with React host, one React remote, one Angular remote; test orchestration and affected builds | Developers run and test the pilot consistently                                  |
| 3. MF proof of concept  | React sharing, remote entry points, version compatibility, failure handling, Angular mount/unmount            | Host loads React and Angular remotes; navigation, props/events and cleanup work |
| 4. Branding foundation  | Token layers, `theme.css` build, versioned hosting, fallback CSS, cache policy                                | A brand change appears in host and pilot remote without rebuilding              |
| 5. Shell widget pilot   | One shared widget with API integration, loading states, fallback, telemetry, contract tests                   | Widget updates independently and rolls back safely                              |
| 6. Production hardening | Security controls, CI gates, visual regression, browser tests, runbooks, monitoring                           | Operational readiness sign-off                                                  |
| 7. Incremental adoption | Migrate further apps and libraries in planned waves                                                           | Adoption driven by pilot results, no big-bang migration                         |

### Pilot acceptance criteria

- The host and required remotes start with documented Nx commands.
- A change to one MFE doesn't trigger builds of unrelated projects.
- The React host loads at least one React remote with the agreed MF configuration.
- The React host mounts and unmounts the Angular MFE without duplicate instances or leaks.
- A published `theme.css` change updates the host and pilot MFE without rebuilding either.
- With the brand server down, apps render using the bundled fallback theme.
- With a remote down, the host shows a defined fallback or error state, not a blank shell.
- A remote version can be rolled back through a controlled release mechanism.
- Authentication, routing, communication, logging and error behaviour are documented and tested.
