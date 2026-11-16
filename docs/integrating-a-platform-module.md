# Integrating a platform module

For teammates building the common platform modules (UI Branding, Notification Services, RBAC and Provisioning, Alerts and Reminders, Audit / Change History, Portal Home + App Launcher). It explains how your module replaces its mock in the portal **without changing any application (MFE)**.

## 1. How modules reach the applications

Every module has two parts:

| Part              | Who uses it                             | How                                                                                                                    |
| ----------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Frontend part** | The portal and every MFE in the browser | A section of the `platform` object. The portal creates it once per signed-in user and passes it to every MFE as a prop |
| **Backend API**   | Application backends, server to server  | Your module's own API, called with service credentials. Never from a browser                                           |

The frontend contract is one TypeScript file: `libs/shared-contracts/src/platform-api.ts` (version in `PLATFORM_API_VERSION`, now **1.1.0**).

- **`PlatformApi`:** what MFEs receive. Kept deliberately small.
- **`ShellPlatformApi`** (extends `PlatformApi`): adds the parts only the portal renders (bell inbox, toasts, reminders, app catalogue). MFEs receive the object typed as `PlatformApi` and cannot see these.

Where each module plugs in:

| Module                         | Frontend part (contract)                                                                                     | Mock today                                                                                                           | Backend API (server to server only)                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| UI Branding                    | CSS variables from `theme.css`; `platform.branding.themeVersion`                                             | `libs/design-tokens/src/theme.css` (bundled fallback) + `apps/brand-server` (runtime copy)                           | Branding admin APIs (portal admin area only)                                 |
| Notification Services          | `platform.notify.toast()`; shell only: `inbox.list / markRead / markAllRead / subscribe`, `toasts.subscribe` | `createMockPlatform` (toasts in memory); inbox from `notificationService` in `libs/mock-backend/src/api/platform.ts` | Send notification (to a team/role or a user), send/verify OTP, email, SMS    |
| RBAC and Provisioning          | `platform.user`, `platform.permissions.can(action, resource)`                                                | `mockRolePermissions` in `libs/platform-mocks/src/mock-data.ts`                                                      | Permission check for backends; user and app-access provisioning (admin only) |
| Alerts and Reminders           | Shell only: `reminders.list()` (bell, Notifications page)                                                    | `notificationService.reminders` in `libs/mock-backend`                                                               | Create, update, cancel reminders                                             |
| Audit / Change History         | `platform.audit.history(entity, id)` (read only, needs `view:audit`)                                         | `mockAuditEntries` in `libs/platform-mocks/src/mock-data.ts`                                                         | Write audit events                                                           |
| Portal Home + App Launcher     | Shell only: `apps.catalogue()`, `apps.allowed()`                                                             | `mockApps` in `libs/platform-mocks/src/mock-data.ts`                                                                 | Allowed-apps list per user                                                   |
| Authentication (central login) | Not part of `platform`: the portal's `services/auth.ts`                                                      | `mockAuth` (pick a user, no password)                                                                                | Login, logout, session validation (see `docs/architecture.md`, section 5)    |

## 2. Replacing a mock: the steps

The portal builds the platform object in **one place**:

```ts
// apps/shell/src/services/platform.ts
export function createPlatform(user: PlatformUser): ShellPlatformApi {
  return createMockPlatform({ user }); // today: every module mocked
}
```

1. **Implement your section of the contract** in a library of your module, e.g. `libs/platform-notifications`, with the same method names and types. For example:

   ```ts
   export function createNotifications(http: HttpClient): Pick<ShellPlatformApi, 'notify' | 'inbox' | 'toasts'> {
     return {
       notify: { toast: (message, options) => /* show via the portal's toast region */ },
       inbox: {
         list: () => http.get('/api/notifications/inbox'), // the session cookie identifies the user
         markRead: (id) => http.post(`/api/notifications/${id}/read`),
         markAllRead: () => http.post('/api/notifications/read-all'),
         subscribe: (listener) => openPushChannel(listener), // WebSocket/SSE, or polling
       },
       toasts: { subscribe: /* … */ },
     };
   }
   ```

2. **Combine it with the remaining mocks** in `apps/shell/src/services/platform.ts`, module by module:

   ```ts
   export function createPlatform(user: PlatformUser): ShellPlatformApi {
     const mock = createMockPlatform({ user });
     return { ...mock, ...createNotifications(http) }; // other modules still mocked
   }
   ```

   No MFE changes: they keep calling `platform.notify.toast()`, `platform.permissions.can()`, and so on.

3. **Run the contract tests** (section 4) against your implementation, and the portal's tests (`pnpm nx run shell:test`).
4. **Check in the browser** with the demo script (`docs/demo-script.md`). Bell, toasts, access and approvals must behave as before.

Rules for the frontend part:

- **No secrets in the browser.** The browser sends the portal's session cookie; your API reads the user from the session. Never put tokens or user ids in requests just to say who is asking.
- **Hiding a button is not security.** `permissions.can()` decides only what the UI shows. Every API checks permissions again.
- **Fail softly.** If your module is down, the portal keeps working: the bell shows nothing new and toasts still show. Never block the portal's first render on your API (the runtime theme in Step 9 is the example).

## 3. What stays server to server

These are **never** called from a browser, by the portal or by an MFE:

- sending email, SMS or OTP, and sending notifications to other users;
- writing audit events;
- provisioning users and changing roles or app access;
- creating, updating or cancelling reminders for others.

Applications do this from their own backends with service credentials. The POC shows the pattern with simulated backends in `libs/mock-backend`:

| Flow in the demo                               | Simulated in                       | What the real backend does                                                                              |
| ---------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Employee applies for leave → managers notified | `hrApi.applyLeave`                 | HRMS backend saves the request, calls **Notification Service** "send to team"                           |
| Manager approves → employee notified           | `hrApi.decideLeave`                | HRMS backend updates, calls **Notification Service** "send to user", writes an **audit** event          |
| Sales requests a proposal → Solutions notified | `salesApi.requestSolutionProposal` | Sales backend creates the task in the delivery system, calls **Notification Service**                   |
| Solutions completes the task → Sales notified  | `workApi.updateStatus`             | Delivery backend updates, calls **Notification Service**, updates the opportunity through the Sales API |

The browser part of the Notification Service only **reads** the user's inbox (`inbox.list`), marks items read, and listens for new ones (`inbox.subscribe`). In the POC, `subscribe` listens to a browser event; the real module uses a push channel (WebSocket or server-sent events) or polling.

A notification needs:

- a **recipient** (a team/role or one user);
- a **title** and a short **description**;
- a **kind** (`info`, `success`, `warning`, `error`);
- the **app id**;
- a **link**: the portal path of the related record, e.g. `/people/leave`. The portal's bell opens it.

## 4. Contract tests

The contract is checked at three levels. Add to them when you change or implement a module.

1. **Type checks of the contract** (`libs/shared-contracts/src/contracts.test.ts`). These `expectTypeOf` checks run with `nx run-many -t typecheck`:
   - MFEs receive exactly `user`, `basePath`, `platform`;
   - `PlatformApi` exposes exactly `version`, `branding`, `user`, `permissions`, `notify`, `audit`.

   A change that breaks them fails the build.

2. **Behaviour tests of the implementation.** `libs/platform-mocks/src/create-mock-platform.test.ts` describes what every implementation must do:
   - access per role;
   - in-app permissions;
   - toasts reach subscribers until they unsubscribe;
   - inbox per role, read state per user;
   - reminders per role;
   - audit only with `view:audit`.

   Run the same cases against your implementation, with your API stubbed. Move shared cases into a function both test files call, so the mock and the real module stay interchangeable.

3. **Portal tests** (`apps/shell/src/App.test.tsx`) use the platform end to end:
   - bell count;
   - mark all read;
   - live notification from another user;
   - access denied;
   - remote props;
   - toasts from MFEs.

   They must pass unchanged when your module replaces the mock.

## 5. Changing the contract

- **Additive changes only** within a major version. Adding a method, or an optional field to a returned type, bumps the **minor** version (`1.0.0` → `1.1.0` added the inbox methods and optional notification fields).
- **A breaking change** (removing or renaming something, changing a parameter, making a field required for implementers) bumps the **major** version. It needs a migration note in `docs/PROGRESS.md` and a period in which both versions work.
- **Only for a real use case.** Do not add capabilities "in case" (no `HostApi`, `navigate`, `setTitle`). Prefer the shell-only part (`ShellPlatformApi`) when only the portal needs it.
- **Update everything in the same change:** the contract file, `PLATFORM_API_VERSION`, the mock (`createMockPlatform`), the contract tests and this guide.

## 6. Checklist

- [ ] Your module implements its section of `PlatformApi` / `ShellPlatformApi` with the same types.
- [ ] `apps/shell/src/services/platform.ts` combines it with the remaining mocks. No MFE changed.
- [ ] Browser calls use the session cookie only; no tokens or secrets in frontend code.
- [ ] Sensitive actions (sending, auditing, provisioning) are available only server to server.
- [ ] Every API checks permissions itself.
- [ ] The portal still renders and works when your API is slow or down.
- [ ] Contract type checks, behaviour tests (mock and real) and portal tests pass: `pnpm nx run-many -t lint test typecheck build`.
- [ ] The demo script works end to end, including the two cross-application workflows.
- [ ] Any contract change is additive and versioned, with this guide updated.
