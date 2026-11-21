import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { hapticSuccess } from "@/lib/haptics";
import {
  getEffectiveTimeZone,
  getTimeUntilNextMidnight,
  isQueueStaleForNewDay,
  VisitorDateCheck,
  QueueStateCheck,
} from "@/lib/timezoneSync";

interface UseAutoDaySyncOptions {
  business?: any;
  selectedQueue: QueueStateCheck | null;
  visitors: VisitorDateCheck[];
  onDayReset?: () => Promise<void> | void;
  enabled?: boolean;
}

export const useAutoDaySync = ({
  business,
  selectedQueue,
  visitors,
  onDayReset,
  enabled = true,
}: UseAutoDaySyncOptions) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastAutoResetDate, setLastAutoResetDate] = useState<string | null>(null);
  const isSyncingRef = useRef(false);
  const onDayResetRef = useRef(onDayReset);
  onDayResetRef.current = onDayReset;

  const timeZone = getEffectiveTimeZone(business);

  const executeAutoRollover = useCallback(
    async (queueId: string, queueName: string, reason: string) => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      setIsSyncing(true);

      try {
        const { data, error } = await supabase.rpc("reset_queue_for_new_day", {
          p_queue_id: queueId,
        });

        if (error) {
          console.warn("Auto day sync rollover error:", error.message);
          return;
        }

        const s: any = Array.isArray(data) ? data[0] : data;
        const archivedCount = s?.total_joined ?? 0;

        hapticSuccess();
        const shortTz = timeZone.replace(/_/g, " ");
        toast.success(
          `Auto-synced for new day (${shortTz}) — ${archivedCount} visitors from previous session archived, tokens reset to #1.`
        );

        const today = new Date().toISOString().slice(0, 10);
        setLastAutoResetDate(today);

        if (onDayResetRef.current) {
          await onDayResetRef.current();
        }
      } catch (err) {
        console.error("Failed to execute auto day rollover", err);
      } finally {
        isSyncingRef.current = false;
        setIsSyncing(false);
      }
    },
    [timeZone]
  );

  // Check on mount, queue change, or visitor list changes
  useEffect(() => {
    if (!enabled || !selectedQueue || isSyncingRef.current) return;

    const check = isQueueStaleForNewDay(selectedQueue, visitors, timeZone);
    if (check.stale) {
      const syncKey = `qblink_day_sync_${selectedQueue.id}_${check.todayStr}`;
      const alreadySynced = sessionStorage.getItem(syncKey);
      if (!alreadySynced) {
        sessionStorage.setItem(syncKey, new Date().toISOString());
        executeAutoRollover(
          selectedQueue.id,
          (selectedQueue as any).name || "Queue",
          check.reason || "stale_session"
        );
      }
    }
  }, [enabled, selectedQueue, visitors, timeZone, executeAutoRollover]);

  // Midnight scheduling: set a timer for the next midnight in business timezone
  useEffect(() => {
    if (!enabled || !selectedQueue) return;

    const scheduleMidnightRollover = () => {
      const msUntilMidnight = getTimeUntilNextMidnight(timeZone);
      return setTimeout(() => {
        if (!selectedQueue) return;
        const check = isQueueStaleForNewDay(selectedQueue, visitors, timeZone);
        if (check.stale) {
          executeAutoRollover(
            selectedQueue.id,
            (selectedQueue as any).name || "Queue",
            "midnight_rollover"
          );
        }
      }, msUntilMidnight);
    };

    const timer = scheduleMidnightRollover();
    return () => clearTimeout(timer);
  }, [enabled, selectedQueue, visitors, timeZone, executeAutoRollover]);

  // Tab visibility change: trigger check when user returns or wakes device
  useEffect(() => {
    if (!enabled || !selectedQueue) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && selectedQueue && !isSyncingRef.current) {
        const check = isQueueStaleForNewDay(selectedQueue, visitors, timeZone);
        if (check.stale) {
          const syncKey = `qblink_day_sync_${selectedQueue.id}_${check.todayStr}`;
          if (!sessionStorage.getItem(syncKey)) {
            sessionStorage.setItem(syncKey, new Date().toISOString());
            executeAutoRollover(
              selectedQueue.id,
              (selectedQueue as any).name || "Queue",
              "wake_sync"
            );
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [enabled, selectedQueue, visitors, timeZone, executeAutoRollover]);

  return {
    timeZone,
    isSyncing,
    lastAutoResetDate,
  };
};
