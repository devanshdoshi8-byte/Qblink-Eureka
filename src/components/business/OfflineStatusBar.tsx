import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { OfflineQueueSyncEngine, QueuedOfflineAction } from "@/lib/offlineQueueSync";

interface Props {
  onSyncPending?: () => Promise<void>;
}

export const OfflineStatusBar = ({ onSyncPending }: Props) => {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [pendingActions, setPendingActions] = useState<QueuedOfflineAction[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const queued = OfflineQueueSyncEngine.getQueuedActions();
      setPendingActions(queued);
      if (queued.length > 0 && onSyncPending) {
        setSyncing(true);
        try {
          await onSyncPending();
        } finally {
          setSyncing(false);
          setPendingActions(OfflineQueueSyncEngine.getQueuedActions());
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setPendingActions(OfflineQueueSyncEngine.getQueuedActions());
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    setPendingActions(OfflineQueueSyncEngine.getQueuedActions());

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [onSyncPending]);

  if (isOnline && pendingActions.length === 0) {
    return null;
  }

  return (
    <div className={`px-4 py-2.5 rounded-2xl flex items-center justify-between gap-3 text-xs transition-all ${
      !isOnline
        ? "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400"
        : "bg-primary/10 border border-primary/20 text-primary"
    }`}>
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-semibold">Connection interrupted</span>
            <span className="opacity-80 hidden sm:inline">• Showing cached queue state</span>
          </>
        ) : (
          <>
            <RefreshCw className={`w-4 h-4 text-primary shrink-0 ${syncing ? "animate-spin" : ""}`} />
            <span className="font-semibold">Connection restored</span>
            <span className="opacity-80 hidden sm:inline">• Reconciling queue state</span>
          </>
        )}
      </div>

      {pendingActions.length > 0 && (
        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-lg bg-background/50 border border-border/50">
          {pendingActions.length} action{pendingActions.length > 1 ? "s" : ""} queued
        </span>
      )}
    </div>
  );
};
