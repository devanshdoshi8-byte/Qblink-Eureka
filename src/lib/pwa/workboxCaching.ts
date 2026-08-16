/**
 * Single source of truth for the service-worker runtime caching rules.
 *
 * Imported by vite.config.ts (to build the SW) and by the deploy-simulation
 * test suite, so the tests always assert against the shipped strategy.
 *
 * Read docs/caching-strategy.md before changing anything here: HTML must stay
 * NetworkFirst and CacheFirst must stay limited to hashed same-origin assets.
 */

export type Handler = "NetworkFirst" | "CacheFirst" | "StaleWhileRevalidate";

export interface RouteContext {
  url: URL;
  request: { mode?: string; method?: string; destination?: string };
  sameOrigin?: boolean;
}

export interface RuntimeCacheRule {
  urlPattern: (ctx: RouteContext) => boolean;
  handler: Handler;
  options: Record<string, unknown>;
}

/**
 * Hashed build output: /assets/index-A1b2C3d4.js, fonts, css.
 *
 * IMPORTANT: `urlPattern` callbacks are serialised into sw.js with
 * `Function.prototype.toString()`, so they may not reference identifiers from
 * this module. Any regex used inside a matcher must be written inline (this
 * export exists for tests and documentation only — keep the two in sync).
 */
export const HASHED_ASSET_RE = /[.-][A-Za-z0-9_-]{8,}\.(js|css|woff2)$/;

/** Navigations that must never be handled by the SPA shell. */
export const NAV_DENYLIST_RE = /^\/(~oauth|api|auth)(\/|$)/;

export const runtimeCaching: RuntimeCacheRule[] = [
  {
    // HTML navigations always try the network first: this is what prevents a
    // stale shell (and the resulting "page not found" screens) after a deploy.
    // Inline regex on purpose — see HASHED_ASSET_RE note above.
    urlPattern: ({ url, request }) =>
      request.mode === "navigate" && !/^\/(~oauth|api|auth)(\/|$)/.test(url.pathname),
    handler: "NetworkFirst",
    options: {
      cacheName: "html",
      networkTimeoutSeconds: 3,
      expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 },
    },
  },
  {
    // Hashed build output only: the filename changes every deploy, so
    // CacheFirst can never serve a stale version.
    urlPattern: ({ url, request, sameOrigin }) =>
      !!sameOrigin &&
      ["style", "script", "worker", "font"].includes(request.destination ?? "") &&
      /[.-][A-Za-z0-9_-]{8,}\.(js|css|woff2)$/.test(url.pathname),
    handler: "CacheFirst",
    options: {
      cacheName: "assets",
      expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    // Unhashed or third-party scripts/styles: revalidate in the background.
    urlPattern: ({ request }) =>
      ["style", "script", "worker", "font"].includes(request.destination ?? ""),
    handler: "StaleWhileRevalidate",
    options: { cacheName: "assets-dynamic" },
  },
  {
    urlPattern: ({ request }) => request.destination === "image",
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "images",
      expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
    },
  },
  {
    // GET API responses (Supabase REST) stay available offline but always
    // revalidate from the network when online.
    urlPattern: ({ url, request }) =>
      request.method === "GET" && /\/rest\/v1\//.test(url.pathname),
    handler: "NetworkFirst",
    options: {
      cacheName: "api",
      networkTimeoutSeconds: 4,
      expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
];

/** Resolve which handler the SW would use for a request. */
export const resolveHandler = (ctx: RouteContext): Handler | "network-only" =>
  runtimeCaching.find((rule) => rule.urlPattern(ctx))?.handler ?? "network-only";

export const workboxOptions = {
  globPatterns: ["**/*.{js,css,html,svg,png,ico,webp,woff2}"],
  // index.html must never be precached: Workbox's precache route resolves "/"
  // to the precached index.html (its directoryIndex) *before* any runtime
  // rule, which would serve a stale shell after a deploy. Offline documents
  // come from the NetworkFirst "html" cache instead.
  globIgnores: ["**/index.html"],
  // Explicitly disabled: vite-plugin-pwa defaults navigateFallback to
  // "index.html". Workbox registers that NavigationRoute *before* the
  // runtime rules, so it would hijack every navigation with the precached
  // shell. Offline documents come from the NetworkFirst "html" cache,
  // and /~oauth, /api, /auth are excluded by NAV_DENYLIST_RE.
  navigateFallback: null,
  cleanupOutdatedCaches: true,
  skipWaiting: true,
  clientsClaim: true,
  dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./,
  runtimeCaching,
};
