import { useEffect, useState } from "react";
import { Download, X, Share2, Plus, Smartphone } from "lucide-react";
import { useLocation } from "react-router-dom";
import logo from "@/assets/qblink-logo.png";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "qb-install-dismissed-at";
const DISMISS_DAYS = 7;

/**
 * Global floating "Install App" button + sheet.
 * - Android/Chrome/Edge/Brave: native install via beforeinstallprompt
 * - iOS Safari: visual Add-to-Home-Screen instructions
 * - Hidden when already installed (display-mode: standalone) or recently dismissed
 * - Hidden on kiosk/public display routes
 */
const InstallAppPrompt = () => {
  const { pathname } = useLocation();
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(true);

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);
  const isAndroid = /android/i.test(ua);

  useEffect(() => {
    // Already installed?
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    // Recently dismissed?
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const fresh = Date.now() - dismissedAt < DISMISS_DAYS * 86400000;
    if (fresh && !isIOS) {
      // Still show on iOS since there's no native event — but respect dismiss too.
      setHidden(true);
      return;
    }
    if (fresh) return;

    setHidden(false);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setHidden(false);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [isIOS]);

  // Don't show on home/kiosk/public/onboarding routes
  const blocked =
    pathname === "/" ||
    pathname.startsWith("/display/") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/install");
  if (hidden || blocked) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      setDeferred(null);
      if (outcome === "accepted") setHidden(true);
      else dismiss();
      return;
    }
    setOpen(true);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setHidden(true);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="fixed z-40 bottom-24 right-4 mb-[env(safe-area-inset-bottom)] md:bottom-6 md:right-6 gradient-bg text-primary-foreground rounded-full shadow-lg px-4 py-2.5 text-sm font-semibold flex items-center gap-2 hover:opacity-90 active:scale-95 transition"
        aria-label="Install Qblink app"
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-card w-full max-w-md rounded-3xl p-6 card-shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <img src={logo} alt="Qblink" className="w-12 h-12 rounded-2xl object-contain" />
                <div>
                  <h2 className="text-lg font-bold text-foreground">Install Qblink</h2>
                  <p className="text-xs text-muted-foreground">Add to your Home Screen</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-sm">
                {!isSafari && (
                  <div className="bg-warning-soft border border-warning/30 text-warning rounded-xl p-3 text-xs">
                    On iPhone/iPad, install only works in <strong>Safari</strong>. Open this site in Safari first.
                  </div>
                )}
                <div className="bg-muted/60 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                  <div className="flex items-center gap-1.5">
                    Tap <Share2 className="w-4 h-4 inline text-primary" /> <strong>Share</strong> in Safari
                  </div>
                </div>
                <div className="bg-muted/60 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                  <div className="flex items-center gap-1.5">
                    Choose <Plus className="w-4 h-4 inline text-primary" /> <strong>Add to Home Screen</strong>
                  </div>
                </div>
                <div className="bg-muted/60 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                  <div>Tap <strong>Add</strong> — Qblink will appear on your Home Screen.</div>
                </div>
              </div>
            ) : isAndroid ? (
              <div className="space-y-3 text-sm">
                <p className="text-foreground">
                  Open this site in <strong>Chrome</strong> (or Edge/Brave/Samsung Internet), then:
                </p>
                <div className="bg-muted/60 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                  <div>Tap the <strong>⋮</strong> menu (top-right)</div>
                </div>
                <div className="bg-muted/60 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                  <div>Choose <strong>Install app</strong> or <strong>Add to Home Screen</strong></div>
                </div>
                <div className="bg-muted/60 rounded-xl p-3 flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <div className="text-xs text-muted-foreground">
                    If you don't see "Install app", refresh the page once and try again.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-foreground">
                  In your browser's address bar, click the <strong>Install</strong> icon (⊕), or open the browser menu and choose <strong>Install Qblink</strong>.
                </p>
                <p className="text-xs text-muted-foreground">
                  Works in Chrome, Edge, Brave, and Opera on desktop and Android.
                </p>
              </div>
            )}

            <button
              onClick={dismiss}
              className="w-full mt-5 text-xs text-muted-foreground hover:text-foreground"
            >
              Don't show this again
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallAppPrompt;