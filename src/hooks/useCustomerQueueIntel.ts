import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface QueueActivityEvent {
  id: string;
  action: string;
  token_number: number | null;
  actor: string | null;
  created_at: string;
}

export interface QueuePulse {
  waiting: number;
  joined_today: number;
  served_today: number;
  avg_wait_minutes: number | null;
  avg_service_minutes: number | null;
  reliability_pct: number | null;
}

export interface BusinessHighlights {
  rating: number | null;
  total_reviews: number | null;
}

/**
 * Single shared read layer for the customer queue page.
 *
 * Fetches every "intelligence" datapoint once (activity log, today's pulse,
 * business rating, recent call timestamps) and refreshes them from the ONE
 * realtime signal channel this page needs. Presentation components consume
 * this state as props — no component opens its own subscription or query.
 *
 * Read-only. It never touches queue joining, routing or wait calculations.
 */
export const useCustomerQueueIntel = ({
  queueId,
  businessId,
  userId,
  enabled = true,
}: {
  queueId?: string | null;
  businessId?: string | null;
  userId?: string | null;
  enabled?: boolean;
}) => {
  const [activity, setActivity] = useState<QueueActivityEvent[]>([]);
  const [pulse, setPulse] = useState<QueuePulse | null>(null);
  const [highlights, setHighlights] = useState<BusinessHighlights | null>(null);
  const [callTimes, setCallTimes] = useState<number[]>([]);
  const [tokens, setTokens] = useState<Array<{ token: number; status: string }>>([]);
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  const alive = useRef(true);
  const inFlight = useRef(false);
  const lastRun = useRef(0);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadQueueData = useCallback(async () => {
    if (!enabled || !queueId) return;
    if (inFlight.current) return;
    inFlight.current = true;
    lastRun.current = Date.now();
    try {
      const [act, pls, vis] = await Promise.all([
        (supabase as any).rpc("get_public_queue_activity", { p_queue_id: queueId, p_limit: 10 }),
        (supabase as any).rpc("get_public_queue_pulse", { p_queue_id: queueId }),
        (supabase as any)
          .from("queue_visitors_public")
          .select("token_number,status,called_at")
          .eq("queue_id", queueId),
      ]);
      if (!alive.current) return;

      if (!act.error && Array.isArray(act.data)) setActivity(act.data as QueueActivityEvent[]);
      if (!pls.error && Array.isArray(pls.data) && pls.data[0]) setPulse(pls.data[0] as QueuePulse);

      if (!vis.error && Array.isArray(vis.data)) {
        const rows = vis.data as Array<{ token_number: number | null; status: string | null; called_at: string | null }>;
        setCallTimes(
          rows
            .map((r) => (r.called_at ? new Date(r.called_at).getTime() : NaN))
            .filter((n) => Number.isFinite(n))
            .sort((a, b) => a - b),
        );
        setTokens(
          rows
            .filter((r) => typeof r.token_number === "number")
            .map((r) => ({ token: r.token_number as number, status: r.status || "waiting" }))
            .sort((a, b) => a.token - b.token),
        );
      }
      setReady(true);
    } finally {
      inFlight.current = false;
    }
  }, [enabled, queueId]);

  /** Throttled refresh so a burst of realtime signals never storms the API. */
  const scheduleRefresh = useCallback(() => {
    const since = Date.now() - lastRun.current;
    if (since >= 1500) {
      loadQueueData();
      return;
    }
    if (pending.current) return;
    pending.current = setTimeout(() => {
      pending.current = null;
      loadQueueData();
    }, 1500 - since);
  }, [loadQueueData]);

  useEffect(() => {
    alive.current = true;
    loadQueueData();
    return () => {
      alive.current = false;
      if (pending.current) clearTimeout(pending.current);
      pending.current = null;
    };
  }, [loadQueueData]);

  // Business rating / review count — public, changes rarely.
  useEffect(() => {
    if (!enabled || !businessId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("businesses")
        .select("rating,total_reviews")
        .eq("id", businessId)
        .maybeSingle();
      if (cancelled || !data) return;
      setHighlights({
        rating: typeof (data as any).rating === "number" ? (data as any).rating : null,
        total_reviews: typeof (data as any).total_reviews === "number" ? (data as any).total_reviews : null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, enabled]);

  // Returning-customer signal (existing favourites data, logged-in users only).
  useEffect(() => {
    if (!enabled || !businessId || !userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("customer_favorites")
        .select("visit_count")
        .eq("user_id", userId)
        .eq("business_id", businessId)
        .maybeSingle();
      if (!cancelled) setVisitCount(typeof data?.visit_count === "number" ? data.visit_count : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, enabled, userId]);

  // ONE realtime channel for every intel component on this page.
  useEffect(() => {
    if (!enabled || !queueId) return;
    const channel = supabase
      .channel(`qb-intel-${queueId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "queue_live_signals", filter: `queue_id=eq.${queueId}` },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "queues", filter: `id=eq.${queueId}` },
        scheduleRefresh,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, queueId, scheduleRefresh]);

  return { activity, pulse, highlights, callTimes, tokens, visitCount, ready, refresh: loadQueueData };
};
