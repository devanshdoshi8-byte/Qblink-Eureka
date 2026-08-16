import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Smartphone, Download, Share2, Plus, ArrowLeft } from "lucide-react";
import logo from "@/assets/qblink-logo.png";
import SEO from "@/components/SEO";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <div className="min-h-screen soft-bg px-4 py-10 flex flex-col items-center">
      <SEO
        title="Install Qblink — Add the App to Your Home Screen"
        description="Install Qblink as a Progressive Web App on your phone or desktop for instant access to queues, live wait times, and notifications."
        path="/install"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://qblink-real.lovable.app/" },
              { "@type": "ListItem", position: 2, name: "Install", item: "https://qblink-real.lovable.app/install" },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "Install Qblink on your device",
            step: [
              { "@type": "HowToStep", position: 1, name: "Open Qblink", text: "Visit qblink-real.lovable.app in your browser." },
              { "@type": "HowToStep", position: 2, name: "Add to home screen", text: "Tap the browser share menu and choose 'Add to Home Screen' (iOS) or 'Install app' (Android/desktop)." },
              { "@type": "HowToStep", position: 3, name: "Launch", text: "Open Qblink from your home screen for an app-like experience." },
            ],
          },
        ]}
      />
      <Link to="/" className="self-start text-sm text-muted-foreground flex items-center gap-1 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <div className="max-w-md w-full bg-card rounded-3xl card-shadow p-7 text-center">
        <img src={logo} alt="Qblink" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Install Qblink</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Get the app-like experience: faster launch, full screen, and instant access from your home screen.
        </p>

        {installed ? (
          <p className="text-sm text-primary font-semibold">✓ Installed. Open Qblink from your home screen.</p>
        ) : deferred ? (
          <button
            onClick={handleInstall}
            className="w-full gradient-bg text-primary-foreground py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Install App
          </button>
        ) : isIOS ? (
          <div className="text-left bg-muted/50 rounded-xl p-4 text-sm text-foreground space-y-3">
            <p className="font-semibold flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" /> Install on iPhone / iPad
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              1. Tap <Share2 className="w-4 h-4 inline" /> Share in Safari
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              2. Choose <Plus className="w-4 h-4 inline" /> Add to Home Screen
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Open this page in Chrome on Android or Safari on iOS, then use your browser menu to "Add to Home Screen".
          </p>
        )}
      </div>
    </div>
  );
};

export default Install;
