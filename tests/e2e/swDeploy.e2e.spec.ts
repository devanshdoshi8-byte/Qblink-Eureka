import { test, expect, type Page } from "@playwright/test";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startDeployServer, type DeployServer } from "./deployServer";

/**
 * End-to-end proof of the caching contract in docs/caching-strategy.md:
 *
 *   1. HTML navigations are NetworkFirst  -> a deploy is visible on the next
 *      load, even while a stale precached shell exists.
 *   2. Hashed assets are CacheFirst       -> they keep resolving from cache
 *      after the server stops serving them.
 *   3. Offline still renders the last-seen document from the html cache.
 *
 * The real generated dist/sw.js is used. The app's own registration is
 * deliberately bypassed (it refuses to register on localhost by design), so
 * the test registers /sw.js directly and exercises the shipped rules.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const DIST = path.join(ROOT, "dist");

const buildOnce = () => {
  if (fs.existsSync(path.join(DIST, "sw.js")) && process.env.PW_SKIP_BUILD) return;
  execSync("npx vite build", { cwd: ROOT, stdio: "inherit" });
};

/** Build a deploy directory: real dist assets + a marked shell + a hashed probe. */
const makeDeploy = (label: string): { dir: string; probe: string } => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `qb-deploy-${label}-`));
  fs.cpSync(DIST, dir, { recursive: true });

  const probe = `/assets/probe-${label}0000deadbeef.js`;
  fs.writeFileSync(path.join(dir, probe), `window.__PROBE__ = ${JSON.stringify(label)};\n`);

  fs.writeFileSync(
    path.join(dir, "index.html"),
    `<!doctype html><html><head><meta charset="utf-8">
<meta name="build-id" content="${label}">
<title>Qblink deploy ${label}</title></head>
<body><main id="root" data-build="${label}">deploy ${label}</main>
<script src="${probe}"></script></body></html>\n`
  );

  return { dir, probe };
};

const registerSw = async (page: Page) => {
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), {
          once: true,
        })
      );
    }
    return reg.scope;
  });
};

const cachedUrls = (page: Page) =>
  page.evaluate(async () => {
    const out: Record<string, string[]> = {};
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      out[name] = (await cache.keys()).map((r) => new URL(r.url).pathname);
    }
    return out;
  });

test.describe("service worker deploy behaviour", () => {
  let server: DeployServer;
  let v1: { dir: string; probe: string };
  let v2: { dir: string; probe: string };

  test.beforeAll(async () => {
    buildOnce();
    v1 = makeDeploy("aaaaaaaa");
    v2 = makeDeploy("bbbbbbbb");
    server = await startDeployServer(v1.dir);
  });

  test.afterAll(async () => {
    await server?.close();
    for (const d of [v1?.dir, v2?.dir]) if (d) fs.rmSync(d, { recursive: true, force: true });
  });

  test("serves fresh HTML after a deploy while hashed assets stay cached", async ({
    page,
    context,
  }) => {
    // --- Deploy 1: install the service worker and warm the caches ---------
    server.deploy(v1.dir);
    await page.goto(`${server.origin}/`, { waitUntil: "load" });
    await expect(page.locator("#root")).toHaveAttribute("data-build", "aaaaaaaa");

    await registerSw(page);

    await page.reload({ waitUntil: "load" });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.evaluate((url) => fetch(url).then((r) => r.text()), v1.probe);
    await expect
      .poll(async () => (await cachedUrls(page)).assets?.includes(v1.probe) ?? false, {
        timeout: 15_000,
      })
      .toBe(true);

    const caches1 = await cachedUrls(page);
    expect(Object.keys(caches1).some((n) => n.includes("precache"))).toBe(true);
    // The NetworkFirst rule keeps a copy of the document for offline use.
    await expect
      .poll(async () => (await cachedUrls(page)).html ?? [], { timeout: 15_000 })
      .toContain("/");

    // --- Deploy 2: swap the document root (old probe no longer exists) ----
    server.deploy(v2.dir);

    // The old hashed file really is gone from the server (request bypasses SW).
    const direct = await context.request.get(`${server.origin}${v1.probe}`);
    expect(direct.status()).toBe(404);

    // 1. HTML is network-first: the new build shows up immediately, even
    //    though the SW still precaches the previous shell.
    await page.reload({ waitUntil: "load" });
    await expect(page.locator("#root")).toHaveAttribute("data-build", "bbbbbbbb");
    expect(
      await page.evaluate(
        () => document.querySelector('meta[name="build-id"]')?.getAttribute("content")
      )
    ).toBe("bbbbbbbb");

    // 2. Hashed assets are cache-first: the deleted v1 probe still resolves
    //    through the SW, and the new v2 probe loads and caches.
    const oldProbe = await page.evaluate(
      async (url) => (await fetch(url)).status,
      v1.probe
    );
    expect(oldProbe).toBe(200);
    expect(await page.evaluate(() => (window as { __PROBE__?: string }).__PROBE__)).toBe(
      "bbbbbbbb"
    );
    await expect
      .poll(async () => (await cachedUrls(page)).assets?.includes(v2.probe) ?? false, {
        timeout: 15_000,
      })
      .toBe(true);

    // 3. Offline falls back to the last document seen — never to v1.
    await context.setOffline(true);
    await page.reload({ waitUntil: "load" });
    await expect(page.locator("#root")).toHaveAttribute("data-build", "bbbbbbbb");
    await context.setOffline(false);
  });
});