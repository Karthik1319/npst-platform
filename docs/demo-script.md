# NPST Portal – demo script

A walkthrough for two audiences at once:

- **Business (CBO, Manager):** one portal for every employee, applications that open inside it, access by role, shared notifications, and work that flows between teams.
- **Technical (technical manager, CTO):** how it is built so that teams work and release independently, how failures stay contained, how branding and access are controlled centrally, and how existing applications join.

Part A is the main walkthrough (about 20 minutes). Each section says **what to show**, the **business message**, and **technical points** to add when the technical audience asks. Part B has short live technical demos (pick the ones you need). Part C prepares answers to likely questions.

Everything runs on sample data. Sign-in is simulated (pick a user, no password); the real portal uses the central login in `docs/architecture.md`, section 5.

## Before the demo

```bash
git pull
pnpm install
pnpm nx run-many -t dev
```

This starts five servers. Wait until all of them report they are ready, then open http://localhost:4200.

| Server              | Address                         | What it is                                                            |
| ------------------- | ------------------------------- | --------------------------------------------------------------------- |
| Portal (shell)      | http://localhost:4200           | Header, navigation, Portal Home, bell, search; loads the applications |
| Sales Hub           | http://localhost:4201           | React application                                                     |
| Projects & Delivery | http://localhost:4202           | React application                                                     |
| People & HR         | http://localhost:4203           | Angular application                                                   |
| Brand server        | http://localhost:4204/theme.css | Central theme (colours, fonts, spacing)                               |

**Clean start:** sign in as **Admin User** → account menu (top right) → **Reset demo data**.

**For the failure demo (B2)** start the servers in two terminals instead, so you can stop one application on its own:

```bash
# Terminal 1: everything except People & HR
pnpm nx run-many -t dev --exclude=demo-angular
# Terminal 2: People & HR on its own
pnpm nx run demo-angular:dev
```

| Demo user  | Role      | Sees                                                                        |
| ---------- | --------- | --------------------------------------------------------------------------- |
| Admin User | ADMIN     | All applications, approvals, change history, Admin Console, Reset demo data |
| User 1     | SALES     | Sales Hub, Projects & Delivery (view only)                                  |
| User 2     | SOLUTIONS | Projects & Delivery, People & HR                                            |
| User 3     | EMPLOYEE  | People & HR                                                                 |

---

# Part A – Walkthrough

## A1. One portal for everyone (Admin User, 3 min)

**Show:**

1. Sign in as **Admin User**.
2. **Portal Home:**
   - greeting and the four applications;
   - headline figures: sales pipeline, active projects, employees, pending approvals;
   - the sales funnel and project health;
   - notifications, my tasks, celebrations;
   - recent activity from all applications.
3. Open the **bell**: notifications from Sales Hub, Projects and People & HR in one list. Click "Project PRJ-221 is at risk": the project opens in Projects & Delivery.
4. Type **ABC** in the search box (or press Ctrl K): results from every application the user may open.

**Business message:** employees start the day in one place. Each application keeps its own screens, but the portal brings their updates, tasks and search together. No separate logins, no hunting through several tools.

**Technical points:**

- **Applications load at runtime.** The portal (shell) is a React app; each business application is a separate app on its own server.
- **One platform object.** The bell, toasts, search, access checks and app list belong to the portal. Every application reaches them through one typed contract (`PlatformApi` in `libs/shared-contracts`), which is versioned (now 1.1.0).
- **Notifications are sent by backends,** never by the browser. The bell only reads the user's inbox.

## A2. The applications (Admin User, 5 min)

**Show:**

- **Sales Hub** (left navigation):
  1. dashboard;
  2. **Leads**, with search and filters;
  3. **Opportunities**, the pipeline stages (click "Proposal");
  4. **ABC Bank – Digital Banking Platform**: customer, requirements, team, timeline, notes, documents, change history.
- **Projects & Delivery:**
  1. dashboard: projects needing attention, resource allocation with one over-allocated manager;
  2. **Projects** → **PRJ-221**: timeline, milestones, risks;
  3. the **Tasks** board.
- **People & HR:**
  1. dashboard: attendance today, approvals, birthdays;
  2. **Employee directory**, filtered by department;
  3. a profile;
  4. **Leave management**.

**Business message:** three applications for three departments look and work as one product. The same design, the same navigation, the same notifications.

**Technical points:**

- **Two technologies, one portal.** Sales Hub and Projects & Delivery are React apps loaded through **Module Federation**; they use the portal's single React copy. People & HR is a **standard Angular CLI app** loaded through a small **mount / unmount** contract. Its build was not changed: no federation tooling. This is how existing Angular teams can join.
- **Each app owns its pages** below its own path (`/sales/...`, `/projects/...`, `/people/...`). Deep links work: a notification can open `/projects/tasks?task=T-3101` directly.
- **One look without a shared UI library.** Every style uses the central theme variables (`var(--npst-…)`), so the brand server can restyle all apps at once (B1).

## A3. Access follows the role (2 min)

**Show:**

1. Account menu → **Sign out**, then sign in as **User 3** (Employee).
   - Portal Home shows only People & HR figures; Sales and Projects are not in the navigation.
   - Opening http://localhost:4200/sales directly shows **Access denied**.
2. Sign out, sign in as **User 1** (Sales). Projects & Delivery opens with a **View only** badge: no controls to move tasks.
3. As **Admin User**, opportunity **OP-1043** shows **Change history**; as User 1 it does not.

**Business message:** people see only what their role allows: approvals for managers, sales data for sales. Access is managed centrally, not app by app.

**Technical points:**

- **Every check is `platform.permissions.can(action, resource)`.** App access uses `access:<app-id>`; in-app permissions look like `approve:leave` or `update:project-task`. The RBAC module answers these centrally.
- **The browser only hides UI.** Every backend API checks the permission again (rule in `docs/architecture.md`).
- **Login is central.** The portal is the only login; apps never see passwords or tokens, and the browser sends the session cookie. Logout in the portal ends access in every app.

## A4. Work across teams (6 min)

**Story 1: Sales asks the Solutions team for a proposal.**

1. As **User 1**: Sales Hub → **Opportunities** → **New opportunity**.
   - Customer **ABC Bank**, name "UPI Merchant Payments", product "Merchant Acquiring (UPI + Soundbox)".
   - **Create opportunity**: the portal confirms it and the opportunity opens.
2. **Request solution proposal** → **Send to Solutions team**. The timeline and Related tasks show the request.
3. Sign in as **User 2** (Solutions). The bell shows **"Proposal task assigned: ABC Bank"**, and My Tasks lists it.
4. Click the notification: Projects & Delivery opens the board with the task highlighted and tagged **"From Sales Hub"**.
5. Move it to **In progress**, then **Done**.
6. Sign in as **User 1**. The bell shows **"Completed by User 2: …"**. Clicking it opens the opportunity; its timeline shows when the work started and finished.
7. As **Admin User**, Portal Home's **Recent activity** lists every step.

**Story 2: an employee asks for leave.**

1. As **User 3**: People & HR → **Leave management** → **Apply for leave**, pick dates and a reason → **Submit request**.
2. As **Admin User**: the bell shows "Leave request from User 3" → open it → **Approve**.
3. As **User 3**: the bell shows "Your leave request was approved", and the balance is updated.

**Business message:** work moves between departments through the platform, with tasks and notifications, instead of email and spreadsheets. Everyone sees the result where they work, and management sees the activity across the company.

**Technical points:**

- **The two apps never talk to each other in the browser.** Sales Hub calls its own backend. That backend creates the task in the delivery system and asks the **Notification Service** to notify the team. The user moves between apps through portal links. This keeps teams independent: either app can change or be released without the other.
- **What the demo simulates:** the backends and the Notification Service run in the browser (`libs/mock-backend`, saved in `localStorage`) so the flow works on one laptop. Real APIs replace that library without changing the screens; only each app's `services/` files change.
- **The bell updates as soon as a notification arrives** (simulated push). The real service would use WebSocket, server-sent events or polling.

## A5. Wrap-up (1 min)

- **For the business:** one entry point, consistent screens, role-based access, cross-team workflows, central branding.
- **For technology:**
  - independent apps and releases;
  - React and Angular side by side, with no build changes for Angular;
  - failures contained to one area;
  - one versioned contract between the portal and apps;
  - on-premises tooling only: Nx without Nx Cloud.
- **Next:** plug in the real HRMS ("Keka") using `docs/adding-a-remote.md`, and replace the first mocks with the real platform modules using `docs/integrating-a-platform-module.md`.

---

# Part B – Live technical demos

Each demo takes 1–3 minutes. After any file edit, undo it with the `git checkout` command given, so the repository stays clean.

## B1. Change the brand colour centrally (no rebuild)

**Where:** `apps/brand-server/public/theme.css`. This file is published by the (simulated) brand server and loaded by the portal at runtime. It defines the same variables as the bundled fallback theme, `libs/design-tokens/src/theme.css`.

| To change                  | Variable in `theme.css`               | Example value                    | What changes                                                                         |
| -------------------------- | ------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| Primary brand colour       | `--npst-blue-600` (default `#1d4ed8`) | `#0f766e` (teal)                 | Buttons, links, active tabs, progress bars, funnel, Sales Hub label, in **all** apps |
| Header colour              | `--npst-navy-900` (default `#0b1d3a`) | `#3b0764` (purple)               | Portal header                                                                        |
| Header search and controls | `--npst-navy-800`, `--npst-navy-700`  | Slightly lighter than the header | Search box and header buttons                                                        |
| Page background            | `--npst-slate-100`                    | `#f8fafc`                        | Background behind the cards                                                          |

**Show:**

1. Open the file and change `--npst-blue-600` to `#0f766e`, and `--npst-navy-900` to `#3b0764`. Save.
2. Reload the portal. The header turns purple; buttons and links turn teal in Portal Home, Sales Hub, Projects & Delivery and People & HR. Nothing was rebuilt or redeployed.
3. **Fallback:** stop the servers (Ctrl C) and start them again without the brand server: `pnpm nx run-many -t dev --exclude=brand-server`. Reload: the portal shows the bundled blue theme and logs one warning. It never breaks.
4. Undo: `git checkout apps/brand-server/public/theme.css`.

**Business message:** a rebrand or a seasonal colour change is one central change, live for every application within minutes.

**Technical points:**

- **Three token layers** (`docs/architecture.md`, "Token layers"): primitive colours, then semantic names (e.g. `--npst-color-action-primary`), then component tokens. Apps use only semantic and component tokens.
- **Loaded by script, not as a blocking `<link>` in `index.html`,** after the bundled theme, so it wins. If the brand server is slow or down, the page still renders at once.
- **A test guarantees the published theme defines exactly the bundled variables** and no logo (`apps/brand-server/theme.test.ts`).
- **Production:** the branding module publishes versioned files and a "current" pointer (`docs/architecture.md`, "Publish flow").

## B2. One application fails, the portal keeps working

**Needs:** the two-terminal start from "Before the demo".

**Show:**

1. Open **People & HR**, then go back to Home.
2. Stop terminal 2 (Ctrl C on the People & HR server).
3. Click **People & HR**. After one automatic retry, only the content area shows **"People & HR is not available right now"** with **Try again**. The header, navigation, bell and the other apps keep working.
4. Start it again (`pnpm nx run demo-angular:dev`), wait until it is ready, click **Try again**: it loads without a page reload.

**Business message:** a problem in one department's application does not take the portal or other departments down.

**Technical points:**

- **8 seconds per attempt, one automatic retry after 1 second,** then a fallback with Try again (`apps/shell/src/remotes/load-with-retry.ts`).
- **The same handling for React (Module Federation) and Angular (mount) apps,** and an error boundary catches an app that crashes after loading.
- **Tested both ways:** with stopped servers, and with servers that accept a connection but never answer (`docs/PROGRESS.md`, Step 7).

## B3. Release one application without touching the others

**Show:**

1. In `apps/demo-react-a/src/layout/SalesLayout.tsx`, change the label `Sales Hub` (the small heading above the page title) to `Sales Hub – new release`. Save, reload the portal, open Sales Hub: it shows the change.
2. Run:

   ```bash
   pnpm nx show projects --affected
   ```

   Only `demo-react-a` is affected: only Sales Hub needs to be rebuilt, tested and deployed. The portal and the other apps are untouched.

3. Optional: `pnpm nx graph` opens a browser view of the projects and the libraries they share.
4. Undo: `git checkout apps/demo-react-a/src/layout/SalesLayout.tsx`.

**Business message:** each team ships on its own schedule. A Sales Hub fix does not wait for an HR release, and does not risk it.

**Technical points:**

- **The portal reads each app's entry file at runtime** (`mf-manifest.json` for React, `index.html` for Angular), so a new release is picked up on the next page load without rebuilding the portal. This was verified with production builds in Step 8.
- **Cache rule for deployment:** entry files `no-cache`; hashed files cached long-term.
- **Nx's local cache and `affected` keep builds and tests fast.** No Nx Cloud: everything runs on premises.

## B4. Change access centrally

**Where:** `libs/platform-mocks/src/mock-data.ts`, `mockRolePermissions`. This stands in for the RBAC module.

**Show:**

1. Add `'access:people-hr'` and `'apply:leave'` to the `SALES` list. Save.
2. Sign in as **User 1** (Sales): People & HR now appears in the navigation and on Portal Home, and User 1 can apply for leave. No application was changed.
3. Undo: `git checkout libs/platform-mocks/src/mock-data.ts`.

**Business message:** who can use which application, and who can approve, is an administration decision made in one place.

**Technical points:**

- **Apps ask `permissions.can()`; they never check role names.** Changing which roles hold a permission needs no app change.
- **In production** the RBAC module answers these checks for the browser, and checks them again for every API call.

## B5. Look inside: shared React, Angular lifecycle

Open the browser's developer tools (F12).

1. **One React copy:** Network tab, filter `react-dom`, open Sales Hub and Projects & Delivery. React DOM is downloaded only from the portal (port 4200), not from 4201 or 4202: the React apps use the portal's copy, while their own code comes from their own servers.
   - In development the apps also request tiny `loadShare` modules (which point to the shared copy) and `@react-refresh` (hot reload) from their own servers. Neither is a copy of React.
   - Production builds were measured in Step 8: one React copy, provided by the portal.
2. **Clean mount and unmount:** Console tab, open People & HR. It logs `[demo-angular] created (live instances: 1)`. Go Home: `[demo-angular] destroyed (live instances: 0)`.
   - In development you also see one extra created/destroyed pair when it opens. That is React's development check (StrictMode), which mounts components twice on purpose to catch clean-up bugs.
   - Live instances never go above 1, and nothing is left behind (tested, including the removal of its styles).

**Technical points:**

- **Shared dependencies:** only `react` and `react-dom` are shared, as singletons with `shareStrategy: 'loaded-first'`. Other libraries are bundled per app, which keeps teams independent.
- **The Angular app shares nothing with the portal,** so it can upgrade Angular on its own schedule.

## B6. Apps run on their own for development

**Show:** open http://localhost:4201 (Sales Hub) or http://localhost:4203 (People & HR) directly. The app runs without the portal:

- a banner reads **"Standalone mode (development only)"**;
- a mock user switcher is shown, starting as a normal user, not Admin;
- the same access check as the portal applies.

**Technical points:**

- **Teams develop and test without running the whole portal.**
- **Production builds contain no mock users.** Opened directly, a production build only shows "Sales Hub is part of the NPST Portal and opens only inside it", with a link. This is checked by a test.

## B7. Quality and size

```bash
pnpm nx run-many -t lint test typecheck build   # every project: about 160 tests, strict TypeScript
pnpm bundle-report                               # download sizes per app (run after the build)
```

**Technical points:**

- **Checks per project:** lint, unit tests, strict type checks and production builds. The contract has type tests, so a breaking change to `PlatformApi` fails the build.
- **Size:** the bundle report shows what each app downloads and that React is shared.

---

# Part C – Questions you may get

**Business (CBO, Manager)**

| Question                                        | Answer                                                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Is this live data?                              | No. Sample data and simulated sign-in, to show the experience. The screens are real applications built on the agreed architecture.                      |
| Can we add our existing tools, e.g. the HRMS?   | Yes, that is the next phase. `docs/adding-a-remote.md` is the checklist; Angular and React apps join without changing their build tools.                |
| Can we rebrand the portal?                      | Yes, centrally (demo B1). One theme file changes every application without a rebuild.                                                                   |
| Who decides who sees what?                      | Administrators, through the central RBAC module (demo B4). Applications follow automatically.                                                           |
| What if one application has a problem?          | Only that application's area shows a message with Try again; everything else keeps working (demo B2).                                                   |
| Does each team depend on the others to release? | No. Each application is built and released on its own (demo B3).                                                                                        |
| Licence costs?                                  | The building blocks used (React, Angular, Nx, Module Federation, Vite) are open source; there is no Nx Cloud subscription, everything runs on premises. |
| Does it work on smaller screens?                | The layout adapts down to tablet width (checked at 820 px). A mobile design is not part of this preview.                                                |

**Technical (technical manager, CTO)**

| Question                                             | Answer                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Why Module Federation for React but not for Angular? | Federation shares React with the portal (one copy, smaller downloads). Angular shares nothing with a React host, so a standard Angular build loaded through `mount`/`unmount` is simpler and needs no tooling change (`docs/architecture.md`, "Loading remotes without changing their build tooling"). |
| How do apps communicate?                             | Only portal ↔ app: props in, `PlatformApi` calls out. No app-to-app channel; cross-team work goes through backends and the Notification Service, with deep links (A4).                                                                                                                                 |
| How is the contract kept stable?                     | One TypeScript contract, semantic version (now 1.1.0), additive changes only, type tests in the build (`docs/integrating-a-platform-module.md`).                                                                                                                                                       |
| Security?                                            | Central login and session cookie; apps never handle tokens; UI checks are visibility only and every API checks permissions; sensitive actions (notifications, audit, provisioning) are server to server only. Details in `docs/architecture.md`, section 5.                                            |
| What about React version upgrades?                   | React is a shared singleton: the portal and React apps agree on the major version (declared as `requiredVersion`). Angular apps upgrade independently.                                                                                                                                                 |
| CSS conflicts between apps?                          | React apps use CSS modules; the Angular app scopes its styles below its root class, and Angular removes them on unmount (tested). Colours come only from theme variables.                                                                                                                              |
| Performance?                                         | Apps load on demand when opened; React is downloaded once; sizes are in `pnpm bundle-report` and `docs/PROGRESS.md`, Step 8.                                                                                                                                                                           |
| How do platform teams plug in their modules?         | Replace one mock at a time in `apps/shell/src/services/platform.ts`; no app changes (`docs/integrating-a-platform-module.md`).                                                                                                                                                                         |
| What is still simulated?                             | Login, the platform modules (RBAC, notifications, audit, branding admin) and the business backends (`libs/mock-backend`). Data is per browser.                                                                                                                                                         |

---

## After the demo

- Undo any file edits: `git checkout .`, then check that `git status` shows nothing changed.
- Optional: as Admin User, **Reset demo data**.
