import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  calculateRollingVelocityWait,
  CompletedServiceSample,
  VelocityWaitResult,
} from "@/lib/velocityWaitEngine";

interface UseRollingWaitEstimateOptions {
  queueId?: string | null;
  aheadCount: number;
  historicalServiceTime?: number;
  enabled?: boolean;
}

/**
 * Hook to calculate adaptive rolling service velocity wait times for a queue.
 * Fetches recent completed visitors and recalculates live wait estimates.
 */
export function useRollingWaitEstimate({
  queueId,
  aheadCount,
  historicalServiceTime = 5,
  enabled = true,
}: UseRollingWaitEstimateOptions): VelocityWaitResult {
  const [completedSamples, setCompletedSamples] = useState<CompletedServiceSample[]>([]);

  useEffect(() => {
    if (!enabled || !queueId) return;

    let isMounted = true;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(queueId);

    if (!isUuid) {
      // Demo queues: synthesize a few realistic recent completed visits
      const now = Date.now();
      const demoSamples: CompletedServiceSample[] = [
        { joinedAt: now - 35 * 60000, calledAt: now - 20 * 60000, servedAt: now - 15 * 60000 },
        { joinedAt: now - 22 * 60000, calledAt: now - 14 * 60000, servedAt: now - 9 * 60000 },
        { joinedAt: now - 15 * 60000, calledAt: now - 8 * 60000, servedAt: now - 3 * 60000 },
      ];
      setCompletedSamples(demoSamples);
      return;
    }

    const fetchRecentCompleted = async () => {
      try {
        const { data, error } = await supabase
          .from("queue_visitors")
          .select("id, joined_at, called_at, served_at")
          .eq("queue_id", queueId)
          .eq("status", "served")
          .not("served_at", "is", null)
          .order("served_at", { ascending: false })
          .limit(8);

        if (error || !data) return;

        if (isMounted) {
          const mapped: CompletedServiceSample[] = data.map((d) => ({
            id: d.id,
            joinedAt: d.joined_at,
            calledAt: d.called_at,
            servedAt: d.served_at!,
          }));
          setCompletedSamples(mapped);
        }
      } catch {
        // graceful fallback to historical baseline
      }
    };

    fetchRecentCompleted();

    // Subscribe to live queue changes to update completed samples
    const channel = supabase
      .channel(`velocity-sync-${queueId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "queue_visitors",
          filter: `queue_id=eq.${queueId}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.status === "served" && payload.new.served_at) {
            setCompletedSamples((prev) => [
              {
                id: payload.new.id,
                joinedAt: payload.new.joined_at,
                calledAt: payload.new.called_at,
                servedAt: payload.new.served_at,
              },
              ...prev.slice(0, 7),
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [queueId, enabled]);

  return useMemo(() => {
    return calculateRollingVelocityWait({
      aheadCount,
      historicalServiceTime,
      recentCompletedSamples: completedSamples,
    });
  }, [aheadCount, historicalServiceTime, completedSamples]);
}
