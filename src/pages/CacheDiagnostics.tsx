import { useCallback, useEffect, useState } from "react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2 } from "lucide-react";

interface SWInfo {
  supported: boolean;
  controllerScript: string | null;
  registrations: {
    scope: string;
    scriptURL: string;
    active: ServiceWorkerState | null;
    waiting: boolean;
    installing: boolean;
  }[];
}

interface CacheBucket {
  name: string;
  count: number;
  entries: string[];
}

const readSW = async (): Promise<SWInfo> => {
  if (!("serviceWorker" in navigator)) {
    return { supported: false, controllerScript: null, registrations: [] };
  }
  const regs = await navigator.serviceWorker.getRegistrations();
  return {
    supported: true,
    controllerScript: navigator.serviceWorker.controller?.scriptURL ?? null,
    registrations: regs.map((r) => ({
      scope: r.scope,
      scriptURL: r.active?.scriptURL ?? r.waiting?.scriptURL ?? r.installing?.scriptURL ?? "—",
      active: r.active?.state ?? null,
      waiting: !!r.waiting,
      installing: !!r.installing,
    })),
  };
};

const readCaches = async (): Promise<CacheBucket[]> => {
  if (!("caches" in window)) return [];
  const names = await caches.keys();
  return Promise.all(
    names.map(async (name) => {
      const cache = await caches.open(name);
      const reqs = await cache.keys();
      return {
        name,
        count: reqs.length,
        entries: reqs.map((r) => {
          try {
            const u = new URL(r.url);
            return u.origin === window.location.origin ? u.pathname + u.search : r.url;
          } catch {
            return r.url;
          }
        }),
      };
    })
  );
};

const CacheDiagnostics = () => {
  const [sw, setSw] = useState<SWInfo | null>(null);
  const [buckets, setBuckets] = useState<CacheBucket[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    const [s, c] = await Promise.all([readSW(), readCaches()]);
    setSw(s);
    setBuckets(c);
    setCheckedAt(new Date().toLocaleTimeString());
    setBusy(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const clearAll = async () => {
    if (!("caches" in window)) return;
    setBusy(true);
    const names = await caches.keys();
    await Promise.allSettled(names.map((n) => caches.delete(n)));
    await load();
  };

  const totalEntries = buckets?.reduce((sum, b) => sum + b.count, 0) ?? 0;

  return (
    <div className="min-h-screen soft-bg px-4 py-10">
      <SEO
        title="Cache Diagnostics — Qblink"
        description="Inspect the active Qblink service worker version and cached assets to verify cache-busting in production."
        path="/cache-diagnostics"
      />
      <div className="max-w-2xl mx-auto space-y-5">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Cache Diagnostics</h1>
            <p className="text-xs text-muted-foreground">
              Service worker version & cache storage contents
              {checkedAt ? ` — checked ${checkedAt}` : ""}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={load} disabled={busy} aria-label="Refresh diagnostics">
              <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
            </Button>
            <Button size="sm" variant="destructive" onClick={clearAll} disabled={busy} aria-label="Clear all caches">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <section className="bg-card rounded-2xl card-shadow p-5 space-y-2 text-sm">
          <h2 className="text-sm font-semibold text-foreground mb-1">Build</h2>
          <p className="text-muted-foreground">
            Build ID:{" "}
            <span className="font-mono text-foreground break-all">
              {typeof __APP_BUILD_ID__ !== "undefined" ? __APP_BUILD_ID__ : "unknown"}
            </span>
          </p>
          <p className="text-muted-foreground">
            Mode: <span className="font-medium text-foreground">{import.meta.env.MODE}</span>
          </p>
        </section>

        <section className="bg-card rounded-2xl card-shadow p-5 space-y-3 text-sm">
          <h2 className="text-sm font-semibold text-foreground">Service Worker</h2>
          {sw === null ? (
            <p className="text-muted-foreground">Checking…</p>
          ) : !sw.supported ? (
            <p className="text-muted-foreground">Service workers are not supported in this browser.</p>
          ) : sw.registrations.length === 0 ? (
            <p className="text-muted-foreground">
              No registrations — expected in dev and Lovable preview, where registration is intentionally blocked.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-muted-foreground">
                Controller script:{" "}
                <span className="font-mono text-foreground break-all">{sw.controllerScript ?? "none"}</span>
              </p>
              {sw.registrations.map((r) => (
                <div key={r.scope} className="bg-muted/50 rounded-xl p-3 text-xs space-y-1">
                  <p className="break-all">
                    <span className="text-muted-foreground">Script:</span>{" "}
                    <span className="font-mono text-foreground">{r.scriptURL}</span>
                  </p>
                  <p className="break-all">
                    <span className="text-muted-foreground">Scope:</span>{" "}
                    <span className="font-mono text-foreground">{r.scope}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">State:</span>{" "}
                    <span className="font-medium text-foreground">{r.active ?? "—"}</span>
                    {r.waiting && <span className="ml-2 text-warning">update waiting</span>}
                    {r.installing && <span className="ml-2 text-muted-foreground">installing…</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-card rounded-2xl card-shadow p-5 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Cache Storage</h2>
            <span className="text-xs text-muted-foreground">
              {buckets?.length ?? 0} cache(s) · {totalEntries} entries
            </span>
          </div>
          {buckets === null ? (
            <p className="text-muted-foreground">Checking…</p>
          ) : buckets.length === 0 ? (
            <p className="text-muted-foreground">Cache storage is empty.</p>
          ) : (
            <div className="space-y-2">
              {buckets.map((b) => (
                <div key={b.name} className="bg-muted/50 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpen(open === b.name ? null : b.name)}
                    className="w-full flex items-center justify-between gap-3 p-3 text-left text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                    aria-expanded={open === b.name}
                  >
                    <span className="font-mono text-foreground break-all">{b.name}</span>
                    <span className="text-muted-foreground shrink-0">{b.count} entries</span>
                  </button>
                  {open === b.name && (
                    <ul className="px-3 pb-3 space-y-1 max-h-64 overflow-auto">
                      {b.entries.map((e) => (
                        <li key={e} className="font-mono text-[11px] text-muted-foreground break-all">
                          {e}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-[10px] text-muted-foreground">
          HTML documents should never appear as long-lived cache hits; hashed assets under /assets/ should.
        </p>
      </div>
    </div>
  );
};

export default CacheDiagnostics;