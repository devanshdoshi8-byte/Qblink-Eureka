/**
 * Single, guarded entry point for service-worker registration.
 *
 * See docs/caching-strategy.md for the full rationale and the checklist to
 * follow before changing guards, the kill switch, or recovery behaviour.
 *
 * Goals:
 *  - Never register in dev, in an iframe, or on any Lovable preview host
 *    (a stale SW there is what makes the editor show "Project not found"
 *    or a blank/outdated page after a deploy).
 *  - Always clean up any SW that already exists in those contexts.
 *  - Support a `?sw=off` kill switch that unregisters and clears caches.
 *  - Never serve stale HTML: navigations are NetworkFirst (see vite.config).
 *  - Recover automatically when a deploy removes hashed chunks the old
 *    page still references.
 */

const SW_URL = "/sw.js";
const RELOAD_FLAG = "qb:sw-reloaded";

const isPreviewContext = (): boolean => {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  return false;
};

const killSwitchRequested = (): boolean =>
  new URLSearchParams(window.location.search).get("sw") === "off";

/** Unregister every SW under our scope and drop its caches. */
export const unregisterServiceWorkers = async (): Promise<void> => {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(regs.map((r) => r.unregister()));
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.allSettled(
        names
          .filter((n) => /(^|-)precache-v\d+-|(^|-)runtime-|^(html|assets|images|api)$/.test(n))
          .map((n) => caches.delete(n))
      );
    }
  } catch {
    /* best effort */
  }
};

/**
 * If a lazy chunk 404s after a deploy, the page is running old HTML against
 * new assets. Clear the SW + caches once and reload to pick up fresh HTML.
 */
const installStaleChunkRecovery = () => {
  const recover = async () => {
    if (sessionStorage.getItem(RELOAD_FLAG)) return; // only once per session
    sessionStorage.setItem(RELOAD_FLAG, "1");
    await unregisterServiceWorkers();
    window.location.reload();
  };

  window.addEventListener("vite:preloadError", () => void recover());
  window.addEventListener("error", (event) => {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "SCRIPT" || target.tagName === "LINK")) void recover();
  }, true);
  window.addEventListener("unhandledrejection", (event) => {
    const msg = String((event.reason as Error)?.message ?? event.reason ?? "");
    if (/Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg)) {
      void recover();
    }
  });
};

export const registerServiceWorker = (): void => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  if (!import.meta.env.PROD || isPreviewContext() || killSwitchRequested()) {
    void unregisterServiceWorkers();
    return;
  }

  installStaleChunkRecovery();

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(SW_URL, { scope: "/" })
      .then((reg) => {
        // Activate a new worker immediately instead of waiting for every tab
        // to close — this is what makes deploys land on the next navigation.
        reg.addEventListener("updatefound", () => {
          const next = reg.installing;
          if (!next) return;
          next.addEventListener("statechange", () => {
            if (next.state === "installed" && navigator.serviceWorker.controller) {
              next.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        // Check for a newer build on focus and every 15 minutes.
        const check = () => void reg.update().catch(() => {});
        window.addEventListener("focus", check);
        window.setInterval(check, 15 * 60 * 1000);
      })
      .catch(() => {
        /* SW is a progressive enhancement */
      });

    // Reload once only when an existing controller is replaced with a newer build.
    // Never reload on first-time worker installation.
    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController || refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
};
