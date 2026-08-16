import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

const OfflineBanner = () => {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 3000);
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online && !justReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium ${
        online
          ? "bg-success-soft text-success border-b border-success/30"
          : "bg-warning-soft text-warning border-b border-warning/30"
      }`}
    >
      {online ? (
        <>
          <Wifi className="w-4 h-4" />
          Back online — syncing live data
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          You're offline — showing cached data. Live updates paused.
        </>
      )}
    </div>
  );
};

export default OfflineBanner;