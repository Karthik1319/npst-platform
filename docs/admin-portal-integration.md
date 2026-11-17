# Admin Portal integration plan

Integrating the teammate's **NPST Shared Services Admin Portal** (source: https://github.com/Rajnish33/frontend, commit `5905b7b`) into this Nx + Module Federation workspace. Approved on 2026-11-17.

- **UI source of truth:** his frontend. Screens, layouts, navigation and workflows stay as he designed them.
- **Architecture source of truth:** this workspace. That covers:
  - the Shell ↔ MFE contract and `PlatformApi`;
  - Module Federation and the Angular mount/unmount;
  - the central session and RBAC;
  - failure handling with retry and Try again;
  - runtime branding.

Unchanged reference copy and screenshots: `reference/` (see `reference/README.md`).

## 1. What his frontend is

One React app (Vite, Tailwind CSS, shadcn/ui on Base UI) for **administering the shared platform services**:

- Application Management (Dashboard)
- Approval Queue (maker-checker)
- UI Branding
- Notification Management
- Reminders (with escalations)
- Employee Management
- Audit Logs
- Settings

It has mock data in the browser's `localStorage`, no tests and no micro-frontends. His own document (`reference/admin-portal-original/NPST_Shared_Services_Architecture_and_Functional_Walkthrough.md`) names the business applications that consume these services: Keka HR, Deal Pulse, SkillUp Lounge and NPST Finance.

## 2. Decisions

| #   | Decision                                                                                                                                                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | His Admin Portal becomes the **host (shell)**. His modules stay **pages inside the host**, not MFEs: they are the portal's own administration screens                                                                                                                 |
| 2   | The **MFEs are the business applications**, under the names and ids of his application registry (table in section 3)                                                                                                                                                  |
| 3   | Same design, but following the NPST standards: **no UI library, CSS variables only, no inline styles**. Tailwind, shadcn/Base UI, lucide, sonner and react-day-picker are replaced by in-house code with the same look                                                |
| 4   | Libraries: complete list with versions, purposes and compatibility (section 6), approved before installation                                                                                                                                                          |
| 5   | His mock login and roles (Super Admin, Admin, Application Admin, Employee) replace the PoC's mock users. **Several seeded users** can sign in with **one demo password** (at least 4–5, covering the roles). His login form uses the central, cross-tab session       |
| 6   | `shared-contracts` kept. `platform-mocks` adapted to his users, roles and application registry. `mock-backend` kept where the stand-in apps need it                                                                                                                   |
| 7   | His Branding module stays. **Publish** is connected to the brand server and the runtime theme                                                                                                                                                                         |
| 8   | **No logo:** his "N" mark and other company marks are not used                                                                                                                                                                                                        |
| 9   | Copying his public repository was approved by him and the company. **Nothing is pushed without explicit approval**                                                                                                                                                    |
| 10  | ESLint for the whole workspace (his oxlint setup is not used), with rules adjusted only where needed                                                                                                                                                                  |
| 11  | Option **A**: two existing demo apps become stand-ins for business apps (Keka HR in Angular, Deal Pulse in React), so Module Federation and Angular stay demonstrated                                                                                                 |
| 12  | ~~"NPST Portal" is added to his mock application registry, so its published branding drives the portal theme~~ Changed after Step 23: no separate "NPST Portal" entry; UI Branding themes the applications, the portal's look stays in the brand server's `theme.css` |

Unchanged rules:

- no MFE ↔ MFE calls;
- no new `PlatformApi` capability without a real use case;
- no deletion of apps, libraries or features without asking;
- incremental steps, each tested against the original screenshots.

## 3. Target architecture: Admin Portal and employee applications together

```
NPST Portal: host = his Admin Portal design + this workspace's architecture
  login (his form → central, cross-tab session) · his sidebar and top bar · bell · runtime theme
├── Shared Services (pages inside the host; admin roles)
│     Dashboard · Approval Queue · UI Branding · Notifications · Reminders ·
│     Employee Management · Audit Logs · Settings
└── Applications (MFEs; per the user's application access)
      Keka HR (Angular) · Deal Pulse (React) · SkillUp Lounge · NPST Finance
```

| Application (his registry) | Id              | Portal path   | In the PoC                                                     |
| -------------------------- | --------------- | ------------- | -------------------------------------------------------------- |
| Keka HR                    | `app-keka`      | `/keka`       | **Angular MFE** (mount/unmount): the People & HR demo, renamed |
| Deal Pulse                 | `app-dealpulse` | `/deal-pulse` | **React MFE** (Module Federation): the Sales Hub demo, renamed |
| SkillUp Lounge             | `app-skillup`   | `/skillup`    | Placeholder page until the real app joins                      |
| NPST Finance               | `app-finance`   | `/finance`    | Placeholder page until the real app joins                      |

How administration reaches the employee applications (always through the platform, never app to app):

| Admin side (his modules)                  | Platform mechanism                               | Employee side gets                                                           |
| ----------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| UI Branding: Publish                      | Brand server, runtime theme                      | The portal theme changes; an application's own theme applies inside its area |
| Application Management: register an app   | App catalogue (`apps.catalogue()` / `allowed()`) | The app appears for users with access                                        |
| Employee Management: roles and app access | RBAC (`permissions.can()`)                       | App access and buttons follow the role                                       |
| Notification templates and channels       | Notification Service, the bell                   | Messages in the shared bell                                                  |
| Reminders and escalations                 | Alerts and Reminders                             | Reminders in the bell                                                        |
| Audit Logs                                | Audit (`audit.history()`)                        | Changes are traceable                                                        |

| His role          | Sees                                           |
| ----------------- | ---------------------------------------------- |
| Super Admin       | All Shared Services pages and all applications |
| Admin             | Shared Services pages and their applications   |
| Application Admin | Configuration of their own applications        |
| Employee          | Only "Applications" (their assigned apps)      |

## 4. Same design without a UI library

| His code             | Measured                                                                                                                   | Replacement (same look)                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Tailwind CSS         | 1,130 `className`s, 114 `cn()` calls, 48 palette colours, 7 fixed colour values                                            | CSS modules using only CSS variables; his colours, fonts, radii and shadows become tokens with the same values (light and dark) |
| shadcn/ui on Base UI | 13 components (button, card, dialog, input, table, select, label, checkbox, textarea, dropdown menu, popover, tabs, sheet) | In-house React components with the same look and keyboard behaviour                                                             |
| lucide icons         | 36 files                                                                                                                   | In-house SVG icon component with only the icons used (paths from lucide, ISC licence notice kept)                               |
| sonner toasts        | 17 files                                                                                                                   | `platform.notify.toast()`, shown by the portal in his toast style                                                               |
| react-day-picker     | 1 file                                                                                                                     | In-house calendar with the same look                                                                                            |
| Inline styles        | 27                                                                                                                         | Classes, or CSS variables set from code (e.g. branding preview colours)                                                         |

**Design parity check:** every page of his original app was screenshotted in light and dark (`reference/screenshots/admin-portal-original/`). Each converted page is screenshotted the same way and compared.

## 5. Branding Publish → runtime theme

1. The brand server gets a small **publish** endpoint (Vite middleware; no new dependency) that stores `themes/<appId>.css`.
2. Publishing **Keka HR** or **Deal Pulse** branding restyles only that application's area when it is open (theme scoped to the app's container).
3. Logo upload in his editor is not applied (no-logo rule).
4. The portal's own look is not edited in UI Branding (decision 12, changed after Step 23); it comes from the brand server's `theme.css` (Step 9).

## 6. Libraries

Checked against this workspace (React 19.3.1, TypeScript 6.0.3, Vite 8.3.8, Node 24) and npm on 2026-11-17. **To be approved before installation.**

### To add (not UI libraries)

| Package                                  | Version | Purpose                                    | Used by (his code) | Compatibility                                     |
| ---------------------------------------- | ------- | ------------------------------------------ | ------------------ | ------------------------------------------------- |
| `@tanstack/react-query`                  | 5.101.4 | Loading and caching data from his services | 20 files           | Peer `react ^18 \|\| ^19` ✓                       |
| `react-hook-form`                        | 7.92.0  | Form state                                 | 7 forms            | Peer `react ^16.8 … ^19` ✓                        |
| `@hookform/resolvers`                    | 7.0.6   | Connects forms to zod validation           | 7 forms            | Peer `zod ^3.25 \|\| ^4` ✓ (other peers optional) |
| `zod`                                    | 4.6.7   | Validation rules                           | 7 forms            | No peers ✓                                        |
| `date-fns`                               | 4.4.0   | Date calculations and formatting           | 8 files            | No peers ✓                                        |
| `@fontsource-variable/plus-jakarta-sans` | 5.3.0   | Headings font                              | global CSS         | Font files only ✓                                 |
| `@fontsource-variable/inter`             | 5.3.0   | Body font                                  | global CSS         | ✓                                                 |
| `@fontsource-variable/jetbrains-mono`    | 5.3.0   | Code font                                  | global CSS         | ✓                                                 |
| `@fontsource-variable/dm-sans`           | 5.3.0   | Branding font option                       | global CSS         | ✓                                                 |
| `@fontsource-variable/manrope`           | 5.3.0   | Branding font option                       | global CSS         | ✓                                                 |
| `@fontsource-variable/space-grotesk`     | 5.3.0   | Branding font option                       | global CSS         | ✓                                                 |
| `@fontsource/poppins`                    | 5.3.0   | Branding font option                       | global CSS         | ✓                                                 |
| `@fontsource/ibm-plex-sans`              | 5.3.0   | Branding font option                       | global CSS         | ✓                                                 |

Exact versions (no `^`), added only to the apps that use them (the host).

### Already in the workspace (no new package)

- `react-router` 8.5.1 replaces his `react-router-dom` 7.18.4. Every function he imports exists in it (`BrowserRouter`, `Link`, `NavLink`, `Navigate`, `Outlet`, `Route`, `Routes`, `useLocation`, `useNavigate`, `useParams`, `useSearchParams`); only the import name changes.
- `react` / `react-dom` 19.3.1 (his 19.2.8), `typescript` 6.0.3 (his 7.0.2), `vite` 8.3.8 (his 8.1.5), `vitest` 5.1.0 (his 4.1.11).

### Not adopted

| His package                                                                                                                            | Reason                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `tailwindcss`, `@tailwindcss/vite`, `tw-animate-css`, `shadcn`, `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge` | UI library / utility-CSS tooling (NPST standard)                                            |
| `lucide-react`, `@icons-pack/react-simple-icons`                                                                                       | Icon libraries; replaced by in-house SVG icons; brand logos are not used                    |
| `sonner`, `react-day-picker`                                                                                                           | UI components; replaced in-house                                                            |
| `recharts`, `motion`, `next-themes`, `react-is`                                                                                        | Not used by his pages                                                                       |
| 9 other font packages (geist, geist-mono, instrument-sans, lora, outfit, playfair-display, sora, ibm-plex-mono, …)                     | Installed but never imported                                                                |
| `oxlint`                                                                                                                               | Workspace uses ESLint                                                                       |
| `@babel/*`                                                                                                                             | Only needed by his editor tooling                                                           |
| `@emergentbase/overlay`, `@emergentbase/visual-edits`                                                                                  | Emergent platform editor tooling, downloaded from `assets.emergent.sh`; not part of the app |

## 7. Steps

| Step | What                                                                                                                                                                                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 17   | **Baseline:** reference copy, original screenshots, this plan, library list                                                                                                                 |
| 18   | **Design system:** his tokens (light and dark, CSS variables), fonts, framework-neutral component stylesheet, in-house React components, icons                                              |
| 19   | **Host frame:** his login, sidebar, top bar, Dashboard, Approval Queue and Settings, wired to the session, platform, RBAC and remote loading; his users and roles; the Applications section |
| 20   | His UI Branding and Notifications pages in the host                                                                                                                                         |
| 21   | His Reminders, Employee Management and Audit Logs pages in the host                                                                                                                         |
| 22   | Stand-ins: People & HR → **Keka HR** (Angular), Sales Hub → **Deal Pulse** (React); ids, paths, his theme                                                                                   |
| 23   | Branding Publish → brand server, portal theme and per-app themes                                                                                                                            |
| 24   | Clean-up and documents; removals only with approval (Projects & Delivery, old shell screens, unused `mock-backend` parts)                                                                   |

## 8. Known risks

- **Volume:** about 11,000 lines restyled without Tailwind. Each step is checked page by page against the original screenshots.
- **Behaviour of replaced components:** focus handling, keyboard use and positioning of dialogs, menus and selects. In-house components are tested for keyboard use.
- **Placeholder buttons:** "Ask AI" and "Help & Support" in his top bar and sidebar have no function in his app; they stay as he designed them.
- **Login hint:** his login page lists Maker and Checker demo accounts that his code does not accept. Decision 5 makes them work.
