# One login, one session for the portal and all applications

**Requirement (senior's input):** when a user signs in to the NPST Portal, the portal and every application (Sales Hub, Projects & Delivery, People & HR, and later the HRMS) use **the same session**. Opening another application must never start a separate session or ask for another login, and signing out ends access everywhere.

**Decision:**

| Part                                                                      | Implemented or documented                                                        | Why                                                                                                                   |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Rule: the portal is the only login; apps never log in or hold sessions    | **Already implemented** (since Step 3b) and in `docs/architecture.md`, section 5 | Apps only receive `user` and `platform` from the portal                                                               |
| Same session in every browser tab; sign-out in one tab signs out all tabs | **Implemented now** in the PoC's mock (Step 16)                                  | The demo must behave like the real system; it is a small change in the portal's `services/auth.ts`                    |
| Real session cookie, central validation, timeouts, CSRF                   | **Documented here**                                                              | Needs the real authentication backend; CLAUDE.md: cookie settings and CSRF are decided during the authentication work |

## 1. Why apps can end up with separate sessions (and how we avoid it)

A browser sends a cookie only to the **host** that set it. If the portal's session cookie belongs to `portal.npst.example`, then:

- requests to `portal.npst.example/api/hr/…` carry the cookie: **one session**;
- requests to `hrms-api.npst.example/…` do **not**. That backend would need its own login and its own session, which is exactly what the requirement forbids. Browsers also increasingly block cookies sent to other sites.

The NGINX reverse proxy (`docs/reverse-proxy.md`) puts the portal, the applications and all APIs on **one origin**. Every API request from any app then carries the same cookie automatically. No app handles the session itself.

**Microfrontend detail:** an app's code is downloaded from `/apps/<app>/`, but it **runs in the portal's page**, so its API calls are same-origin with the portal. This is already true in the PoC: inside the portal, all apps run on the portal's origin.

## 2. Target design

```
1. Open portal ──► GET /auth/me ──► 401 ──► portal login page
2. Sign in     ──► POST /auth/login ──► Authentication service:
                     checks credentials (later: company identity provider),
                     creates the session in the central session store,
                     Set-Cookie: __Host-npst_session=<random id>; Path=/; Secure; HttpOnly; SameSite=Lax
3. Portal loads the user (GET /auth/me) and the platform object, then the apps
4. Any app ──► /api/<service>/… (browser adds the cookie)
      NGINX: session check (auth_request → authentication service) ──► 401 if invalid
      Backend: validates the session again + checks the user's permissions
5. Sign out    ──► POST /auth/logout ──► session deleted centrally
      every app's next request gets 401 ──► portal shows its login page
      other open tabs are told at once (e.g. BroadcastChannel) or on their next request
```

**What each part does:**

| Part                   | Responsibility                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication service | Sign-in, sign-out, session creation and deletion, "who is signed in" (`/auth/me`), session check for NGINX and backends                   |
| Central session store  | One record per session: user, roles or permissions, created, last seen. Shared by all instances (e.g. Redis or a database)                |
| NGINX                  | Rejects requests without a valid session; passes the user id to backends; never trusts identity headers from the browser                  |
| Portal (shell)         | Shows the login page, calls `/auth/me` at start, passes `user` and `platform` to apps, returns to the login page on 401, central sign-out |
| Applications (MFEs)    | No login, no session code, no tokens. Call relative `/api/…` URLs; the browser sends the cookie                                           |
| Backends               | Validate the session and the permission on **every** request, even behind NGINX                                                           |

## 3. Recommended session mechanism

| Option                           | How                                                                           | Sign-out everywhere                                                                     | Recommendation                                                        |
| -------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Server-side session**          | Random session id in an `HttpOnly` cookie; session data in the central store  | **Immediate:** delete the session                                                       | **Recommended:** simplest to revoke, nothing sensitive in the browser |
| JWT in a cookie                  | Signed token carrying the user and roles; each backend verifies the signature | Needs a deny-list or short expiry + refresh, otherwise a token stays valid after logout | Only if a stateless design is required                                |
| Separate session per application | Each app has its own login or cookie                                          | Each app separately                                                                     | **Not allowed** (this requirement)                                    |

## 4. Cookie and session rules (proposals for the authentication work)

| Setting                           | Proposal                                                                                            | Reason                                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Name prefix                       | `__Host-`                                                                                           | The browser then requires `Secure`, `Path=/` and no `Domain`, so the cookie is bound to the portal host only |
| `HttpOnly`                        | Yes                                                                                                 | Scripts (including any injected script) cannot read the session id                                           |
| `Secure`                          | Yes                                                                                                 | HTTPS only                                                                                                   |
| `SameSite`                        | `Lax` (or `Strict` if the portal is never opened from links in other sites)                         | Blocks most cross-site request forgery                                                                       |
| CSRF protection                   | CSRF token or a required custom header on every changing request (`POST`, `PUT`, `PATCH`, `DELETE`) | `SameSite` alone is not enough for all browsers and cases                                                    |
| Session id                        | New random id at every sign-in                                                                      | Prevents session fixation                                                                                    |
| Idle timeout                      | e.g. 30 minutes without activity (business to decide)                                               | Unattended computers                                                                                         |
| Absolute timeout                  | e.g. 8–12 hours                                                                                     | Forces a daily sign-in                                                                                       |
| Sign-out                          | Deletes the session centrally; the portal clears its state and tells other tabs                     | "Sign out once, out everywhere"                                                                              |
| Roles changed by an administrator | Take effect at the next request (server-side session)                                               | No stale permissions in the browser                                                                          |

## 5. What this means for each application team

- **Never** build a login screen, store a token, or read or set the session cookie.
- **Call your backend through relative URLs** (`/api/<service>/…`) from your `services/` code. Use `fetch` with the default `credentials: 'same-origin'`, or the framework's HTTP client.
- **On a 401 response,** do nothing special: the portal handles it (back to its login page).
- **Standalone mode** (development only) uses the mock platform and mock users; production builds never contain it (Step 6–14 build checks).

## 6. What the PoC does now (Step 16)

- **Sign in once:** the mock session (the signed-in user's id) is kept in the browser's `localStorage` for the portal's origin. Like the real cookie, it is shared by **every tab**. A new tab, or a link opened in a new tab, is already signed in, with no second login.
- **Sign out once:** signing out, or signing in as someone else, in one tab makes every other open tab follow at once (browser `storage` event). Each tab returns to the login page or switches user.
- **Inside a tab,** the portal and all three applications already share that one session: apps receive `user` and `platform` from the portal and have no login or session code.

**Verified:**

- **Tests:** 3 new portal tests (a new tab is signed in; sign-out in another tab removes the open app; sign-in as another user switches the tab).
- **Browser:** two real Chrome tabs on the production build. A tab opened at `/notifications` was signed in; signing out in the first tab sent both tabs to the login page.

**Mock limitations** (removed by the real design):

- the mock session is readable by scripts (the real cookie is `HttpOnly`);
- it has no expiry;
- it survives closing the browser;
- nothing validates it on a server.
