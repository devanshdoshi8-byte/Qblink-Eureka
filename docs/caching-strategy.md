# Qblink Caching Strategy

This document describes how Qblink's service worker (SW) caches content, why each
rule exists, and what you must not change. Breaking these rules causes stale pages,
white screens, or "Project not found"-style errors after a deploy.

## Files that own this behaviour

| File | Role |
| --- | --- |
| `src/lib/pwa/workboxCaching.ts` | Single source of truth for runtime caching rules and Workbox options. |
| `vite.config.ts` | Feeds `workboxOptions` into `VitePWA` (`generateSW`). Never redefine rules here. |
| `src/lib/pwa/registerServiceWorker.ts` | The only place a SW is registered. Guards, update flow, kill switch, stale-chunk recovery. |
| `src/test/swDeploySimulation.test.ts` | Unit-level deploy simulation of the rules below. |
| `tests/e2e/swDeploy.e2e.spec.ts` | Playwright E2E: real `dist/sw.js`, two simulated deploys, fresh HTML + cached hashed assets (`bun run test:e2e`). |
| `src/pages/CacheDiagnostics.tsx` | `/cache-diagnostics` — inspect build ID, active SW, and cache contents in production. |
| `.github/workflows/sw-deploy-simulation.yml` | Runs the simulation suite on every push/PR. |

Rules are defined once in `workboxCaching.ts` and imported by both the build and the
tests. If you add a rule, add it there — not inline in `vite.config.ts`.

## Rule 1 — HTML is always network-first

```
request.mode === "navigate"  ->  NetworkFirst (cache: "html", 3s timeout)
```

Every navigation goes to the network first and only falls back to cache when the
network fails or times out (offline). The HTML document is what references the
hashed asset filenames, so a stale document points at chunks that no longer exist
on the server. That is the single most common cause of a blank screen after deploy.

**Never** switch navigations to `CacheFirst` or `StaleWhileRevalidate`.
Two Workbox defaults are deliberately disabled because both would serve a stale
shell *before* this rule ever runs:

- `navigateFallback: null` — Workbox registers its `NavigationRoute` ahead of all
  runtime routes, so it would answer every navigation from the precache.
- `globIgnores: ["**/index.html"]` — the precache route resolves `/` to a
  precached `index.html` via its directory index, which would also win.

Offline documents therefore come from the NetworkFirst `html` cache (pages the
user has already visited). `/~oauth`, `/api`, and `/auth` navigations are excluded
via `NAV_DENYLIST_RE` so OAuth redirects always hit the server.

Matcher functions are serialised into `sw.js` with `Function.prototype.toString()`,
so they must not reference module-level identifiers — write regexes inline. A
reference like `HASHED_ASSET_RE` throws inside the worker and silently disables
every route.

## Rule 2 — Hashed build output is cache-first

```
same-origin && destination in [style, script, worker, font]
&& /[.-][A-Za-z0-9_-]{8,}\.(js|css|woff2)$/  ->  CacheFirst (cache: "assets", 30d, 120 entries)
```

`CacheFirst` is safe here *only because the filename contains a content hash*: a new
build produces a new filename, so a cached entry can never be a stale version of a
current file. Cache-first is what makes repeat visits instant.

**Never** widen this rule to unhashed paths (`/config.js`, `/env.js`, anything without
the hash segment). If you change the build's asset naming, update `HASHED_ASSET_RE`
in the same commit or hashed files silently fall through to Rule 3.

## Rule 3 — Everything else revalidates

| Match | Handler | Cache |
| --- | --- | --- |
| Unhashed or cross-origin scripts/styles/fonts | `StaleWhileRevalidate` | `assets-dynamic` |
| Images | `StaleWhileRevalidate` | `images` (100 entries, 30d) |
| `GET /rest/v1/*` (backend REST) | `NetworkFirst` (4s timeout) | `api` (80 entries, 24h) |
| No match | network-only | — |

`StaleWhileRevalidate` serves the cached copy instantly and refreshes it in the
background, so a stale response lasts at most one visit. API reads are network-first
so live queue data is never served stale while online, but remain readable offline.

Non-GET requests and anything not matched above are never cached — mutations,
auth, realtime sockets, and edge functions always go to the network.

## Cache purge rules

Purging happens in four places. Keep all four working.

1. **Precache cleanup on activate** — `cleanupOutdatedCaches: true` plus
   `skipWaiting` / `clientsClaim` means a new SW deletes previous Workbox precaches
   and takes control immediately.
2. **Expiration budgets** — each runtime cache has `maxEntries`/`maxAgeSeconds`
   (see the tables above) so no cache grows without bound.
3. **Kill switch** — loading any URL with `?sw=off` calls
   `unregisterServiceWorkers()`: it unregisters every registration and deletes only
   *our* caches, matched by `/(^|-)precache-v\d+-|(^|-)runtime-|^(html|assets|images|api)$/`.
   This deliberately spares third-party caches (e.g. Firebase Messaging). Never
   replace it with a blanket `caches.keys().map(caches.delete)`.
4. **Stale-chunk recovery** — if a lazy chunk 404s (`vite:preloadError`, a failed
   `<script>`/`<link>`, or a "Failed to fetch dynamically imported module" rejection),
   the app unregisters the SW, clears our caches, and reloads **once per session**
   (guarded by the `qb:sw-reloaded` sessionStorage flag). The once-per-session guard
   prevents an infinite reload loop; do not remove it.

## Registration guards (do not weaken)

`registerServiceWorker()` refuses to register — and actively unregisters anything it
finds — when any of these hold:

- `!import.meta.env.PROD`
- the page is inside an iframe
- hostname is `localhost` / `127.0.0.1`
- hostname starts with `id-preview--` or `preview--`
- hostname is or ends with `lovableproject.com`, `lovableproject-dev.com`, `beta.lovable.dev`
- the URL carries `?sw=off`

A SW in the Lovable editor preview holds onto HTML the editor has already replaced,
which is what produces stale previews and phantom "Project not found" screens.
Offline behaviour therefore only exists on the published domain — say so rather than
enabling the SW in preview to demo it.

Update flow: on `updatefound` the new worker is told to `SKIP_WAITING`, and a single
`controllerchange` listener reloads the tab once (`refreshing` flag) so the user lands
on the new build. The SW also re-checks for updates on window focus and every 15 minutes.

## Verifying a change

1. `bunx vitest run src/test/swDeploySimulation.test.ts` — rule-level simulation.
2. `bun run test:e2e` — Playwright drives the real built SW through two deploys.
   Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to reuse a preinstalled Chromium.
2. Build and open `/cache-diagnostics` on the published domain: confirm the SW script
   URL and state, and that the `html` cache is not serving your current document while
   `/assets/*` hashed files are present.
3. If a user reports a stuck page, send them `https://qblinkk.lovable.app/?sw=off`.

## Checklist before editing caching code

- [ ] Rules changed in `src/lib/pwa/workboxCaching.ts` only.
- [ ] Navigations still `NetworkFirst`.
- [ ] `CacheFirst` still restricted to same-origin hashed filenames.
- [ ] Purge matcher still scoped to our cache names.
- [ ] Preview/dev/iframe guards untouched.
- [ ] Deploy-simulation tests pass.
