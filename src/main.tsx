import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initAnalytics } from "./lib/analytics";
import { observeWebVitals } from "./lib/webVitals";
import { registerServiceWorker } from "./lib/pwa/registerServiceWorker";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";

initAnalytics();

// Live CLS / LCP / INP collection. Exposed on window so browser-based audits
// (and the Playwright perf pass) can read the same numbers the budgets use.
const vitals = observeWebVitals((snapshot) => {
  (window as unknown as Record<string, unknown>).__qbWebVitals = snapshot;
});
(window as unknown as Record<string, unknown>).__qbWebVitalsRecorder = vitals.recorder;

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// --- Service Worker registration (guarded; production, non-preview only) ---
registerServiceWorker();
