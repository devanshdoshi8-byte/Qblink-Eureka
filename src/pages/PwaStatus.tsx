import { useEffect, useState } from "react";
import SEO from "@/components/SEO";
import logo from "@/assets/qblink-logo.png";

interface ManifestStatus {
  ok: boolean;
  status: number;
  data?: Record<string, unknown>;
  error?: string;
}

interface SWStatus {
  supported: boolean;
  controller: boolean;
  registrations: { scope: string; state: ServiceWorkerState | "unknown" }[];
}

const fetchManifest = async (): Promise<ManifestStatus> => {
  try {
    const res = await fetch("/manifest.json", { cache: "no-store" });
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e) };
  }
};

const getSWStatus = async (): Promise<SWStatus> => {
  if (!("serviceWorker" in navigator)) {
    return { supported: false, controller: false, registrations: [] };
  }
  const regs = await navigator.serviceWorker.getRegistrations();
  return {
    supported: true,
    controller: !!navigator.serviceWorker.controller,
    registrations: regs.map((r) => ({
      scope: r.scope,
      state: r.active?.state ?? r.installing?.state ?? r.waiting?.state ?? "unknown",
    })),
  };
};

const PwaStatus = () => {
  const [manifest, setManifest] = useState<ManifestStatus | null>(null);
  const [sw, setSw] = useState<SWStatus | null>(null);
  const [standalone, setStandalone] = useState<boolean | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    fetchManifest().then(setManifest);
    getSWStatus().then(setSw);
    setStandalone(
      window.matchMedia?.("(display-mode: standalone)").matches ||
        !!(navigator as unknown as { standalone?: boolean }).standalone
    );
    const ua = navigator.userAgent;
    setIsIOS(/iphone|ipad|ipod/i.test(ua));
    setIsSafari(/^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua));
  }, []);

  const statusIcon = (ok: boolean) => (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
        ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
      }`}
    >
      {ok ? "✓" : "✕"}
    </span>
  );

  return (
    <div className="min-h-screen soft-bg px-4 py-10">
      <SEO
        title="PWA Status — Qblink"
        description="Diagnostic page for Qblink PWA manifest, service worker, and installability."
        path="/pwa-status"
      />
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <img src={logo} alt="Qblink" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-xl font-bold text-foreground">PWA Status</h1>
            <p className="text-xs text-muted-foreground">Manifest, service worker & installability</p>
          </div>
        </div>

        {/* Manifest */}
        <div className="bg-card rounded-2xl card-shadow p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Manifest</h2>
          {manifest === null ? (
            <p className="text-sm text-muted-foreground">Checking…</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {statusIcon(manifest.ok)}
                <span className="text-foreground">
                  {manifest.ok ? "Fetched successfully" : `Fetch failed — ${manifest.error}`}
                </span>
              </div>
              {manifest.ok && manifest.data && (
                <div className="bg-muted/50 rounded-xl p-3 text-xs space-y-1">
                  <p>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    <span className="font-medium text-foreground">{String(manifest.data.name ?? manifest.data.short_name ?? "—")}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Display:</span>{" "}
                    <span className="font-medium text-foreground">{String(manifest.data.display ?? "—")}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Start URL:</span>{" "}
                    <span className="font-medium text-foreground">{String(manifest.data.start_url ?? "—")}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Icons:</span>{" "}
                    <span className="font-medium text-foreground">
                      {Array.isArray(manifest.data.icons) ? `${manifest.data.icons.length} entries` : "—"}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Service Worker */}
        <div className="bg-card rounded-2xl card-shadow p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Service Worker</h2>
          {sw === null ? (
            <p className="text-sm text-muted-foreground">Checking…</p>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {statusIcon(sw.supported)}
                <span className="text-foreground">
                  {sw.supported ? "API supported" : "API not supported"}
                </span>
              </div>
              {sw.supported && (
                <>
                  <div className="flex items-center gap-2">
                    {statusIcon(sw.controller)}
                    <span className="text-foreground">
                      {sw.controller ? "Controlling this page" : "No active controller"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusIcon(sw.registrations.length > 0)}
                    <span className="text-foreground">
                      {sw.registrations.length > 0
                        ? `${sw.registrations.length} registration(s)`
                        : "No registrations"}
                    </span>
                  </div>
                  {sw.registrations.length > 0 && (
                    <div className="bg-muted/50 rounded-xl p-3 text-xs space-y-1">
                      {sw.registrations.map((r, i) => (
                        <p key={i}>
                          <span className="text-muted-foreground">Scope:</span>{" "}
                          <span className="font-medium text-foreground">{r.scope}</span>{" "}
                          <span className="text-muted-foreground">State:</span>{" "}
                          <span className="font-medium text-foreground">{r.state}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Installability */}
        <div className="bg-card rounded-2xl card-shadow p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Installability</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {statusIcon(!!standalone)}
              <span className="text-foreground">
                {standalone ? "Running in standalone mode" : "Running in browser tab"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {statusIcon(isIOS)}
              <span className="text-foreground">{isIOS ? "iOS detected" : "Not iOS"}</span>
            </div>
            {isIOS && (
              <div className="flex items-center gap-2">
                {statusIcon(isSafari)}
                <span className="text-foreground">
                  {isSafari ? "Safari detected" : "Third-party browser (install via Safari required)"}
                </span>
              </div>
            )}
            {isIOS && !standalone && isSafari && (
              <div className="bg-primary/10 text-primary rounded-xl p-3 text-xs font-medium">
                iOS add-to-home-screen instructions should be shown.
              </div>
            )}
            {isIOS && standalone && (
              <div className="bg-success-soft text-success rounded-xl p-3 text-xs font-medium">
                Already installed on this device.
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground pt-2">
          Refresh to re-check. Results reflect the current browser context only.
        </p>
      </div>
    </div>
  );
};

export default PwaStatus;
