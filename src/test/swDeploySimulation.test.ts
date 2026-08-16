import { describe, it, expect, beforeEach } from "vitest";
import { resolveHandler, runtimeCaching, workboxOptions, NAV_DENYLIST_RE } from "@/lib/pwa/workboxCaching";

/* ------------------------------------------------------------------ *
 * Minimal Workbox-equivalent engine: enough to replay a deploy.
 * ------------------------------------------------------------------ */

interface Res { body: string; buildId: string }

class DeploySim {
  /** Files currently served by the origin (the "deployed" build). */
  private origin = new Map<string, Res>();
  /** Cache Storage: cacheName -> url -> response */
  private caches = new Map<string, Map<string, Res>>();
  public networkHits: string[] = [];
  public offline = false;

  deploy(buildId: string, hashedAsset: string) {
    this.origin = new Map<string, Res>([
      ["/", { body: `html:${hashedAsset}`, buildId }],
      ["/dashboard", { body: `html:${hashedAsset}`, buildId }],
      [`/assets/${hashedAsset}`, { body: `js:${buildId}`, buildId }],
      ["/vendor/analytics.js", { body: `unhashed:${buildId}`, buildId }],
    ]);
  }

  private fetchNetwork(path: string): Res {
    if (this.offline) throw new Error("offline");
    this.networkHits.push(path);
    const res = this.origin.get(path);
    if (!res) throw new Error(`404 ${path}`);
    return res;
  }

  private cache(name: string) {
    if (!this.caches.has(name)) this.caches.set(name, new Map());
    return this.caches.get(name)!;
  }

  /** Route + execute the strategy exactly as the SW would. */
  request(path: string, destination: string, mode = "no-cors", method = "GET"): Res {
    const url = new URL(path, "https://qblinkk.lovable.app");
    const ctx = { url, request: { mode, method, destination }, sameOrigin: true };
    const rule = runtimeCaching.find((r) => r.urlPattern(ctx));
    if (!rule) return this.fetchNetwork(path);

    const store = this.cache(String(rule.options.cacheName));

    switch (rule.handler) {
      case "NetworkFirst": {
        try {
          const fresh = this.fetchNetwork(path);
          store.set(path, fresh);
          return fresh;
        } catch (e) {
          const cached = store.get(path);
          if (cached) return cached;
          throw e;
        }
      }
      case "CacheFirst": {
        const cached = store.get(path);
        if (cached) return cached;
        const fresh = this.fetchNetwork(path);
        store.set(path, fresh);
        return fresh;
      }
      case "StaleWhileRevalidate": {
        const cached = store.get(path);
        try {
          const fresh = this.fetchNetwork(path);
          store.set(path, fresh);
          return cached ?? fresh;
        } catch {
          if (cached) return cached;
          throw new Error("offline and uncached");
        }
      }
    }
  }

  navigate(path: string) {
    return this.request(path, "document", "navigate");
  }
}

const V1 = "index-AAAA1111.js";
const V2 = "index-BBBB2222.js";

describe("service worker deploy simulation", () => {
  let sim: DeploySim;

  beforeEach(() => {
    sim = new DeploySim();
    sim.deploy("v1", V1);
  });

  it("serves HTML from the network on every navigation (never stale after deploy)", () => {
    expect(sim.navigate("/").body).toBe(`html:${V1}`);

    sim.deploy("v2", V2); // <-- deploy happens
    const afterDeploy = sim.navigate("/");

    expect(afterDeploy.buildId).toBe("v2");
    expect(afterDeploy.body).toBe(`html:${V2}`);
  });

  it("re-fetches HTML on repeat navigations rather than replaying the cache", () => {
    sim.navigate("/");
    sim.navigate("/dashboard");
    sim.navigate("/");
    expect(sim.networkHits.filter((p) => p === "/")).toHaveLength(2);
  });

  it("serves hashed assets cache-first (one network hit per unique filename)", () => {
    sim.request(`/assets/${V1}`, "script");
    sim.request(`/assets/${V1}`, "script");
    sim.request(`/assets/${V1}`, "script");
    expect(sim.networkHits.filter((p) => p.includes(V1))).toHaveLength(1);
  });

  it("pulls the new hashed bundle after a deploy because the filename changed", () => {
    sim.request(`/assets/${V1}`, "script");
    sim.deploy("v2", V2);

    const html = sim.navigate("/");
    const nextAsset = html.body.replace("html:", "");
    expect(nextAsset).toBe(V2);

    const bundle = sim.request(`/assets/${nextAsset}`, "script");
    expect(bundle.buildId).toBe("v2");
    expect(sim.networkHits).toContain(`/assets/${V2}`);
  });

  it("never resolves a post-deploy page against the previous build's chunks", () => {
    sim.navigate("/");
    sim.request(`/assets/${V1}`, "script");
    sim.deploy("v2", V2);

    const html = sim.navigate("/");
    expect(html.body).not.toContain(V1);
    // The stale chunk is gone from the origin: requesting it would 404,
    // which is exactly what the stale-chunk recovery handler listens for.
    expect(() => sim.request(`/assets/${V1}`, "script", "no-cors")).not.toThrow(); // cached copy
    sim = new DeploySim();
    sim.deploy("v2", V2);
    expect(() => sim.request(`/assets/${V1}`, "script")).toThrow(/404/);
  });

  it("revalidates unhashed third-party scripts instead of pinning them", () => {
    sim.request("/vendor/analytics.js", "script");
    sim.deploy("v2", V2);
    sim.request("/vendor/analytics.js", "script"); // returns stale, refreshes
    const third = sim.request("/vendor/analytics.js", "script");
    expect(third.buildId).toBe("v2");
  });

  it("falls back to cached HTML only when the network is unavailable", () => {
    sim.navigate("/");
    sim.offline = true;
    expect(sim.navigate("/").body).toBe(`html:${V1}`);
    sim.offline = false;
    sim.deploy("v2", V2);
    expect(sim.navigate("/").buildId).toBe("v2");
  });
});

describe("workbox configuration guarantees", () => {
  it("routes navigations to NetworkFirst", () => {
    expect(
      resolveHandler({
        url: new URL("https://qblinkk.lovable.app/dashboard"),
        request: { mode: "navigate", method: "GET", destination: "document" },
        sameOrigin: true,
      })
    ).toBe("NetworkFirst");
  });

  it("routes same-origin hashed assets to CacheFirst", () => {
    for (const p of ["/assets/index-AAAA1111.js", "/assets/main-9f8e7d6c.css", "/assets/dm-sans-1a2b3c4d.woff2"]) {
      expect(
        resolveHandler({
          url: new URL(`https://qblinkk.lovable.app${p}`),
          request: { method: "GET", destination: p.endsWith(".css") ? "style" : p.endsWith(".woff2") ? "font" : "script" },
          sameOrigin: true,
        })
      ).toBe("CacheFirst");
    }
  });

  it("never cache-firsts unhashed or cross-origin scripts", () => {
    expect(
      resolveHandler({
        url: new URL("https://qblinkk.lovable.app/vendor/analytics.js"),
        request: { method: "GET", destination: "script" },
        sameOrigin: true,
      })
    ).toBe("StaleWhileRevalidate");

    expect(
      resolveHandler({
        url: new URL("https://cdn.example.com/lib-abcdef12.js"),
        request: { method: "GET", destination: "script" },
        sameOrigin: false,
      })
    ).toBe("StaleWhileRevalidate");
  });

  it("keeps the SW self-updating and excludes OAuth from the HTML fallback", () => {
    expect(workboxOptions.skipWaiting).toBe(true);
    expect(workboxOptions.clientsClaim).toBe(true);
    expect(workboxOptions.cleanupOutdatedCaches).toBe(true);
    // OAuth navigations must bypass the SPA shell entirely.
    expect(NAV_DENYLIST_RE.test("/~oauth/callback")).toBe(true);
    expect(
      resolveHandler({
        url: new URL("https://qblinkk.lovable.app/~oauth/callback"),
        request: { mode: "navigate", method: "GET", destination: "document" },
        sameOrigin: true,
      })
    ).toBe("network-only");
  });

  it("has no cache-first rule for HTML documents", () => {
    const htmlRules = runtimeCaching.filter((r) =>
      r.urlPattern({
        url: new URL("https://qblinkk.lovable.app/"),
        request: { mode: "navigate", method: "GET", destination: "document" },
        sameOrigin: true,
      })
    );
    expect(htmlRules.every((r) => r.handler === "NetworkFirst")).toBe(true);
  });
});
