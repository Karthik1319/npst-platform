# Deep linking: every internal application inside the portal

**Meaning in this programme:** every internal application (PeopleOS, DealPulse, SkillUp Hub, Helpdesk, Teamwise and later ones) opens **inside** the NPST Portal, never in another tab or window. The portal loads it at its own path, as a micro-frontend in this Nx monorepo. Portal and application talk to each other in both directions.

**Already proven in this repository** (Steps 4–23, `docs/PROGRESS.md`):

| Part                                                        | Where                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Portal (host) with sidebar, top bar, login, central session | `apps/shell`                                                                                |
| React application loaded in-app (Module Federation)         | Deal Pulse stand-in: `apps/demo-react-a`                                                    |
| Non-React application loaded in-app (mount contract)        | PeopleOS stand-in, Angular: `apps/demo-angular`                                             |
| Two-way communication                                       | Props `{ user, basePath, platform }` down; calls on `platform` up (`libs/shared-contracts`) |
| Failure handling (timeout, retry, fallback)                 | `apps/shell/src/remotes/`                                                                   |
| One session, one theme, role-based access to each app       | `services/auth.ts`, brand server, `permissions.can('access', appId)`                        |
| Step-by-step guide for adding an existing app               | `docs/adding-a-remote.md` (section 7 is a worked example)                                   |

**The task:** do the same for each **real** application, one at a time, and make every way of reaching an application stay in-app.

## 1. Target

| Application | Replaces / purpose                       | Portal path (proposal) | Route | Framework  |
| ----------- | ---------------------------------------- | ---------------------- | ----- | ---------- |
| PeopleOS    | Keka: attendance, leave, payroll, PMS    | `/peopleos`            | ?     | to collect |
| DealPulse   | Salesforce: CRM, pipeline, RFP hub       | `/dealpulse`           | ?     | to collect |
| SkillUp Hub | In-house LMS                             | `/skillup`             | ?     | to collect |
| Helpdesk    | OpenProject: ticketing for 5 departments | `/helpdesk`            | ?     | to collect |
| Teamwise    | Operations / customer-care dashboard     | `/teamwise`            | ?     | to collect |

**Route** (from `docs/adding-a-remote.md` section 1):

- **A: React application.** Module Federation; it shares the portal's single React copy. The app's React version must match the portal's (19.x).
- **B: any other framework** (Angular, Vue, plain JS, a different React major). The app keeps its own build and exports `mount(element, props)` / `unmount(element)`; the portal loads its built module.

## 2. What "in-app" means for every application

1. **Opens inside the portal frame.** The portal's sidebar, top bar and bell stay; the application renders in the content area at `/<app-path>/…`.
2. **No own login, header or sidebar.** The portal is the only login (central session cookie). The application removes its sign-in page and its outer frame when running in the portal; it receives the signed-in user as a prop.
3. **Owns its pages below its path.** `/<app-path>/…` belongs to the application (its router uses `basePath`). Reload and direct links to inner pages work.
4. **Every way in stays in the portal:**
   - sidebar "Applications";
   - the Dashboard registry cards;
   - bell notifications and reminders;
   - search results;
   - links from another application.

   All of them use the **portal path** (`/dealpulse/opportunities/OP-1043`), never the app's own host, never `target="_blank"`. Links between applications are normal links to portal paths; applications never import each other.

5. **Two-way communication only through the contract:**
   - **portal → application:** `user`, `basePath`, `platform`;
   - **application → portal:** `platform.notify.toast()`, `platform.permissions.can()`, `platform.audit.history()`.

   Anything new an application needs from the portal is added to `PlatformApi` as a versioned change, for a real use case only.

6. **Same look:** theme CSS variables from the portal (light, dark, high contrast); application styles scoped so they do not leak into the portal.
7. **Own backend through the gateway:** relative `/api/<service>/…` calls on the portal origin; the browser sends the session cookie; no tokens in the frontend.
8. **Fails safely:** if the application cannot load, only its area shows "not available" with "Try again".

## 3. How one application is brought in (summary)

Details and code: `docs/adding-a-remote.md` sections 3–7. Task-by-task prompts: `docs/deep-linking-tasks.md`.

1. **Bring the source into the monorepo** as `apps/<app-id>` (or keep its repository and deploy it as a remote; decide per app). It must build and run on its own first.
2. **Make it a remote:**
   - route A: expose `./App` with `@module-federation/vite`, React shared as a singleton;
   - route B: export `mount` / `unmount` from its entry and build a plain ES module.
3. **Strip the outer frame and login** when running in the portal; keep a development-only standalone mode with the mock platform.
4. **Wire the contract:** user from props, permissions through `platform.permissions.can()`, toasts through `platform.notify.toast()`.
5. **Route below `basePath`;** inner links relative to it.
6. **Theme:** map the app's colours to the portal's CSS variables; scope its global styles.
7. **Register it in the portal:**
   - app registry and access (`libs/platform-mocks`);
   - remote registry (`apps/shell/src/remotes/registry.ts`);
   - for route A, the remote entry in `apps/shell/vite.config.ts`;
   - a fixed dev port.
8. **Tests:** the portal loads it with the host props, unmounts it on leave, shows the fallback when it is down; the app's own tests still pass.

## 4. Information to collect

**From each application team:**

| Question                                                                             | Why                                            |
| ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Repository access and branch to integrate                                            | To bring it into the monorepo                  |
| Framework and version (React 19? Angular? other), build tool, router                 | Decides route A or B and what changes          |
| How it signs in today and where the login code is                                    | It must use the portal session instead         |
| Its outer frame (header, sidebar) and global CSS (resets, fonts, UI library)         | Removed or scoped in the portal                |
| Backend base URL(s), how it calls APIs, how it sends auth                            | Must become relative calls through the gateway |
| What it needs from the portal: user fields, roles/permissions, toasts, anything else | Defines what it uses from `PlatformApi`        |
| Pages other apps or notifications must open (record type, id, route)                 | In-app links from the bell and other apps      |
| Environment variables and secrets it expects in the browser                          | Moved to the backend or the portal config      |

**From the platform owners:**

| Owner                     | Question                                                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| API gateway / NGINX       | Portal origin per environment; where each app's built files are served (`/apps/<app-id>/`); API paths per backend; SPA fallback for app paths |
| RBAC / auth / sessions    | Real login and session flow; app-access permission per application; user fields the portal receives                                           |
| Notifications / reminders | Links in messages use portal paths (`/<app-path>/…`)                                                                                          |
| UI branding               | Theme variables the applications must use                                                                                                     |
| Lead                      | Final app ids, names and paths; the order to integrate; done criteria in the programme tracker                                                |

## 5. Order

1. Agree the app list, ids and portal paths (section 1).
2. Integrate **one** application end to end (the most ready one), following section 3.
3. Point the bell, search and Dashboard links of that app to its portal paths and check they open in-app.
4. Repeat for the next application; replace the stand-ins (Deal Pulse → the real DealPulse, the PeopleOS stand-in → the real PeopleOS) when the real app arrives.

## 6. Done criteria per application

| Check                                                             | Expected                                                    |
| ----------------------------------------------------------------- | ----------------------------------------------------------- |
| Open from the sidebar, a Dashboard card, a bell item, another app | Opens in the portal content area, same tab                  |
| Reload and direct address of an inner page                        | Same page, inside the portal                                |
| Signed-in user and permissions                                    | Come from the portal (no own login)                         |
| Toast or other request from the app                               | Shown by the portal                                         |
| Leaving the app                                                   | App unmounted (no duplicate instances)                      |
| App server down                                                   | Fallback with "Try again"; portal works                     |
| Sign-out in the portal (any tab)                                  | App closed, login page                                      |
| Light / dark mode                                                 | App follows the portal                                      |
| Production build                                                  | One React copy (route A); lint, test, typecheck, build pass |
