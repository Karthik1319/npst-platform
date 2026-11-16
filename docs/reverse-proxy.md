# Reverse proxy (NGINX) for the NPST Portal

**Status: proposal, documentation only.** The proof of concept has no real backend services (its business backends are simulated in the browser by `libs/mock-backend`), so there is nothing for a proxy to route to yet. This document describes how an NGINX reverse proxy fits the agreed architecture. Implement it together with the first real backend (e.g. the HRMS API or the Notification Service).

Related: one login and one session for all applications, in `docs/single-session.md`. Example configuration (untested): `docs/examples/nginx/`.

## 1. What it is and why

A **reverse proxy** is a server that receives every request from the browser on **one public address** and forwards it to the right internal service. The browser never talks to the internal services directly.

**Without a proxy:**

- the portal and each application call several backend addresses (`hrms-api…`, `sales-api…`, …);
- every backend must be reachable from the internet;
- every backend must accept cross-origin requests (CORS);
- the session cookie does not reach backends on other hosts.

**With NGINX:**

- the browser only knows `https://portal.npst.example`;
- NGINX routes `/api/hr/…` to the HRMS backend, `/api/sales/…` to the Sales backend, and so on;
- backends stay on the internal network.

## 2. Where it fits

```
Browser (portal + MFEs on one origin)
   │  https://portal.npst.example   (one address, TLS)
   ▼
┌──────────────────────── NGINX (reverse proxy) ─────────────────────────┐
│  /                      → portal (shell) files                         │
│  /apps/sales/  /apps/projects/  /apps/people/  → application files     │
│  /theme/                → brand server (theme.css)                     │
│  /auth/                 → authentication service                       │
│  /api/platform/         → RBAC, audit (read), app catalogue            │
│  /api/notifications/    → Notification Service (+ /stream for the bell) │
│  /api/sales/            → Sales Hub backend                            │
│  /api/projects/         → Projects & Delivery backend                  │
│  /api/hr/               → HRMS backend                                 │
└────────────────────────────────────────────────────────────────────────┘
   │  internal network only (firewall: only NGINX may reach the services)
   ▼
 auth · platform modules · notification · business backends · brand server
```

### Recommended: applications behind the same proxy

Two layouts are possible:

|                         | **A. Portal, applications and APIs on one origin** (recommended)                        | B. Only APIs behind NGINX; applications on their own hosts or a CDN                     |
| ----------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| CORS                    | Not needed: everything is same-origin                                                   | Needed for every remote's files and every API                                           |
| Session cookie          | One cookie for the portal host reaches every API (`docs/single-session.md`)             | Cookie must be shared across hosts (wider exposure) or each API needs another mechanism |
| Content Security Policy | Mostly `'self'`                                                                         | Must list every host                                                                    |
| Independent releases    | Unchanged: each app is a folder (or upstream) under `/apps/<app>/`, deployed on its own | Unchanged                                                                               |

Layout A keeps every architecture rule (independent apps, Module Federation and mount contract, runtime theme) and only changes **where** files are served from.

## 3. Impact on today's code (when it is introduced)

Nothing changes now. When the proxy is introduced:

| Area                 | Today (PoC)                                                                                        | With NGINX                                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Remote addresses     | `http://localhost:4201/mf-manifest.json`, `…4202…`, `VITE_DEMO_ANGULAR_URL=http://localhost:4203/` | Paths on the same origin: `/apps/sales/mf-manifest.json`, `/apps/projects/…`, `/apps/people/`. Set per environment at build time (the Angular URL is already an environment variable) |
| Build base paths     | Apps served at the root of their own port                                                          | Each app is built for its folder (Vite `base`, Angular base href / deploy URL). Verify asset loading during implementation                                                            |
| Data access          | `services/*` call `libs/mock-backend`                                                              | `services/*` call relative URLs (`/api/hr/…`). The browser sends the session cookie automatically; no backend addresses in app code                                                   |
| Runtime theme        | `http://localhost:4204/theme.css` (`VITE_BRAND_THEME_URL`)                                         | `/theme/theme.css`                                                                                                                                                                    |
| Notification bell    | Simulated push (browser event)                                                                     | `/api/notifications/stream` (server-sent events or WebSocket) through NGINX                                                                                                           |
| Cache rules (Step 8) | Set by the test servers                                                                            | Set by NGINX: `no-cache` for `index.html`, `mf-manifest.json`, `remoteEntry.js`; long-lived `immutable` for hashed files                                                              |
| Shell ↔ MFE contract | `{ user, basePath, platform }` + `PlatformApi`                                                     | **Unchanged**                                                                                                                                                                         |
| Development          | Each app on its own port                                                                           | Unchanged; Vite's built-in dev proxy (`server.proxy`) can mirror the same `/api/…` routes, so developers do not need NGINX locally                                                    |

## 4. Required components and add-ons

Versions checked on nginx.org in November 2026: stable **1.30.6**, mainline **1.31.8**. Use the **stable** branch from the official nginx.org packages or the company's approved repository.

| Component                                           | Needed for                                                                | Free NGINX or NGINX Plus                    | Notes                                                                                                                                                                                                                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NGINX (stable branch)                               | Proxy, static files                                                       | Free                                        | Keep it patched (section 5)                                                                                                                                                                                                                                                     |
| TLS certificate and key                             | HTTPS on the public address                                               | Free (`ssl`)                                | From the company CA, or automated with the optional ACME module (packaged since 1.29.1) when a public CA is used                                                                                                                                                                |
| HTTP/2                                              | Faster loading of many small files                                        | Free                                        | `http2 on;`. Enable HTTP/3 (QUIC) only if needed: it had several security fixes in 2026                                                                                                                                                                                         |
| Session check at the edge (`auth_request`)          | Reject requests without a valid session before they reach a backend       | Free, but **not in a default source build** | Official packages include modules that need no extra libraries; confirm `--with-http_auth_request_module` in `nginx -V`                                                                                                                                                         |
| JWT validation (`auth_jwt`), OpenID Connect         | Validate tokens in NGINX itself                                           | **NGINX Plus only**                         | Not needed with the recommended server-side session (`docs/single-session.md`)                                                                                                                                                                                                  |
| Rate limiting (`limit_req`, `limit_conn`)           | Slow down password guessing and API abuse                                 | Free                                        | Stricter limit on `/auth/login`                                                                                                                                                                                                                                                 |
| Passive health checks (`max_fails`, `fail_timeout`) | Skip a failing backend instance                                           | Free                                        | Reacts to real traffic only                                                                                                                                                                                                                                                     |
| Active health checks (`health_check`)               | Probe backends proactively                                                | **NGINX Plus only**                         | Or use the company monitoring tool                                                                                                                                                                                                                                              |
| Real client address (`realip`)                      | Correct IP in logs and rate limits when another load balancer is in front | Free                                        | Trust only the load balancer's addresses                                                                                                                                                                                                                                        |
| WebSocket / server-sent events                      | Live notification bell                                                    | Free                                        | Upgrade headers; `proxy_buffering off` for the stream                                                                                                                                                                                                                           |
| Logs and request ids                                | Troubleshooting, audit                                                    | Free                                        | JSON access logs to the central log system; `X-Request-ID` passed to every service. Optional OpenTelemetry module for tracing                                                                                                                                                   |
| Metrics                                             | Monitoring                                                                | Free (`stub_status`)                        | Basic counters; a Prometheus exporter is a separate add-on                                                                                                                                                                                                                      |
| High availability                                   | No single point of failure                                                | Free + tooling                              | Two NGINX instances behind the existing load balancer or a virtual IP (e.g. keepalived)                                                                                                                                                                                         |
| Web application firewall (WAF)                      | Filter common attacks                                                     | Separate product                            | F5 ended its NGINX ModSecurity module (end of life 31 March 2024). Options: F5 NGINX App Protect (commercial), an existing network WAF in front of NGINX, or an open-source engine (the OWASP Core Rule Set project is moving its focus to Coraza). Needs a separate evaluation |
| Configuration management                            | Safe changes                                                              | Free                                        | Config in git, `nginx -t` in the pipeline, zero-downtime reload                                                                                                                                                                                                                 |

**Kubernetes note:** if NPST runs on Kubernetes, do **not** use the community `ingress-nginx` controller. Kubernetes retired it in March 2026: it gets no further releases, bug fixes or security patches. Use a Gateway API implementation or F5's own NGINX Ingress Controller (a different codebase, not affected by the retirement). On virtual machines this does not apply.

**NGINX Plus** (paid, F5) adds active health checks, JWT/OpenID Connect, a status API and dashboard, shared state across instances and commercial support. The recommended design works with free NGINX.

## 5. Security implications

### Benefits

| Benefit                     | Why                                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Smaller attack surface      | Only NGINX is public; backend addresses and ports are hidden and blocked by the firewall                                      |
| One place for TLS           | Certificates, protocols and HSTS are managed once, not per service                                                            |
| No CORS                     | With layout A everything is same-origin: no cross-origin rules to get wrong (e.g. overly broad `Access-Control-Allow-Origin`) |
| One session cookie          | The cookie can stay host-only, `HttpOnly`, `Secure`, `SameSite` (`docs/single-session.md`)                                    |
| Consistent security headers | HSTS, `nosniff`, `Referrer-Policy`, framing rules and later a Content Security Policy, on every response                      |
| Central limits              | Rate limits, request size limits and timeouts protect every backend the same way                                              |
| Central logging             | Every request is logged with one request id that follows it through all services                                              |

### Risks and controls

| Risk                                                                                                                                                                                                                      | Control                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Single point of failure:** NGINX down = portal down                                                                                                                                                                     | Two instances, health monitoring, tested failover                                                                                                                                  |
| **NGINX is not authorisation:** a proxy check alone can be bypassed (misrouting, internal callers)                                                                                                                        | Every backend still validates the session and the user's permissions on every request (rule in `docs/architecture.md`, section 5)                                                  |
| **Forged identity or address headers:** a client sends `X-User-Id` or `X-Forwarded-For`                                                                                                                                   | NGINX overwrites forwarding headers and sets identity headers only from the session check; backends accept identity headers only from NGINX (network rules, optionally mutual TLS) |
| **Configuration mistakes:** wrong `location` order, missing trailing slash in `proxy_pass` (changes the path), `alias` traversal, `add_header` / `proxy_set_header` in a location silently dropping the server-level ones | Reviews, `nginx -t`, automated tests for every route and header; prefer `root` over `alias`; shared snippets included in every location (see the example)                          |
| **Vulnerabilities in NGINX itself:** nginx.org published many security advisories in 2026 (for example CVE-2026-15176, a buffer overflow with `alias` and `rewrite`, fixed in 1.30.6 / 1.31.7)                            | Patch process: follow the nginx.org security advisories, update the stable branch promptly, enable only needed modules (e.g. no HTTP/3 or SSI unless required)                     |
| **Traffic between NGINX and backends** is plain HTTP inside the network                                                                                                                                                   | Decide per data sensitivity: re-encrypt to backends (`proxy_ssl_*`) at least for HR and personal data                                                                              |
| **Sensitive data in logs**                                                                                                                                                                                                | Do not log cookies, `Authorization` headers or tokens in URLs                                                                                                                      |
| **Slow or huge requests** (resource exhaustion)                                                                                                                                                                           | Client timeouts, `client_max_body_size`, rate limits, connection limits                                                                                                            |
| **Cross-site request forgery (CSRF):** the browser sends the cookie automatically                                                                                                                                         | `SameSite` cookie plus a CSRF token or required custom header on changing requests; decided in the authentication work (`docs/single-session.md`)                                  |
| **Information leakage**                                                                                                                                                                                                   | `server_tokens off`; status endpoints only for the internal monitoring network                                                                                                     |

## 6. Open decisions

1. **Layout:** applications served behind NGINX too (A, recommended) or only the APIs (B)?
2. **Session check:** at NGINX (`auth_request`) **and** in every backend (recommended), or in the backends only?
3. **Encryption** between NGINX and backends.
4. **WAF:** existing network WAF, F5 NGINX App Protect, or an open-source engine.
5. **Hosting:** virtual machines or Kubernetes (then Gateway API or F5's ingress controller, not `ingress-nginx`).
6. **Domain names and certificates** (company CA).
7. **Free NGINX or NGINX Plus** (only needed for active health checks, JWT/OIDC in NGINX, or vendor support).

## 7. Example configuration

`docs/examples/nginx/` contains an **untested example**:

- `npst-portal.conf`: routes, caching, session check, rate limits, notification stream, status endpoint;
- `npst-proxy.conf`: shared proxy headers and timeouts;
- `npst-security-headers.conf`: shared security headers.

Placeholders are in `<angle brackets>`. Before using it: fill them in, run `nginx -t`, and test every route, header and failure case.

## Sources

- nginx.org: [news](https://nginx.org/news.html) (current versions), [security advisories](https://nginx.org/en/security_advisories.html), [auth_request module](https://nginx.org/en/docs/http/ngx_http_auth_request_module.html), [auth_jwt module](https://nginx.org/en/docs/http/ngx_http_auth_jwt_module.html) (commercial), [upstream health checks](https://nginx.org/en/docs/http/ngx_http_upstream_hc_module.html) (commercial), [Linux packages](https://nginx.org/en/linux_packages.html)
- F5: [NGINX ModSecurity WAF end of life](https://www.f5.com/company/blog/nginx/f5-nginx-modsecurity-waf-transitioning-to-eol), [compare NGINX models](https://www.f5.com/products/nginx/nginx-plus/compare-models)
- Kubernetes: [Ingress NGINX retirement](https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/), [statement of the Steering and Security Response Committees](https://www.kubernetes.io/blog/2026/01/29/ingress-nginx-statement/)
