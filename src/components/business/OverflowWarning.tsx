import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useOverflowGuard } from "@/hooks/useOverflowGuard";

/**
 * Non-blocking development-only banner shown when a Business page
 * overflows horizontally. Renders nothing in production builds.
 */
const OverflowWarning = () => {
  const report = useOverflowGuard();
  const [dismissed, setDismissed] = useState(false);

  if (!import.meta.env.DEV || !report || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-[60] max-w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-warning/40 bg-warning/10 backdrop-blur px-3 py-2.5 text-xs shadow-lg pointer-events-auto"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-warning" />
        <div className="min-w-0">
          <p className="font-semibold text-foreground">Horizontal overflow detected</p>
          <p className="text-muted-foreground mt-0.5">
            Content is {report.scrollWidth}px wide in a {report.viewportWidth}px viewport.
          </p>
          {report.offenders.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-muted-foreground font-mono text-[10px] break-all">
              {report.offenders.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss overflow warning"
          className="ml-auto shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default OverflowWarning;
