import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PublicDisplayState } from "../types";
import { announceTokenChange } from "../utils/audioAnnouncer";

const isUuid = (v?: string) =>
  !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export function usePublicDisplaySync(queueId?: string, audioEnabled = false) {
  const isDemo = !isUuid(queueId);
  const [data, setData] = useState<PublicDisplayState>({
    queueId: queueId || "",
    queueName: "Queue Display",
    businessName: "Qblink Partner",
    status: "active",
    queueType: "standard",
    counterLabel: null,
    currentToken: null,
    nextTokens: [],
    waitingCount: 0,
    connectionStatus: "live",
    lastUpdatedAt: new Date().toISOString(),
    estimatedWaitMinutes: null,
  });

  const previousTokenRef = useRef<number | null>(null);

  const fetchDisplayData = useCallback(async () => {
    if (!queueId) return;

    if (isDemo) {
      setData((prev) => ({
        ...prev,
        queueId,
        queueName: "Apex Specialty Clinic",
        businessName: "Metro Healthcare Partners",
        status: "active",
        queueType: "standard",
        counterLabel: "Consultation Room 3",
        currentToken: 24,
        nextTokens: [25, 26, 27, 28],
        waitingCount: 7,
        connectionStatus: "live",
        lastUpdatedAt: new Date().toISOString(),
        estimatedWaitMinutes: 12,
      }));
      return;
    }

    try {
      // 1. Fetch queue state
      const { data: q, error: qErr } = await supabase
        .from("queues")
        .select("id, name, status, current_token, next_token, queue_type, note, estimated_service_time, business_id")
        .eq("id", queueId)
        .maybeSingle();

      if (qErr) throw qErr;

      let bName = "Qblink Partner";
      if (q?.business_id) {
        const { data: b } = await supabase
          .from("businesses")
          .select("name")
          .eq("id", q.business_id)
          .maybeSingle();
        if (b?.name) bName = b.name;
      }

      // 2. Fetch public next tokens (queue_visitors_public view with zero PII)
      const { data: publicVisitors, error: vErr } = await (supabase as any)
        .from("queue_visitors_public")
        .select("token_number, status")
        .eq("queue_id", queueId)
        .eq("status", "waiting")
        .order("token_number", { ascending: true })
        .limit(5);

      if (vErr) throw vErr;

      // 3. Exact count of total waiting
      const { count } = await (supabase as any)
        .from("queue_visitors_public")
        .select("*", { count: "exact", head: true })
        .eq("queue_id", queueId)
        .eq("status", "waiting");

      const nextList = (publicVisitors || []).map((v: any) => v.token_number).filter(Boolean);
      const current = q?.current_token ?? null;

      // Trigger audio if token changed
      if (current && current !== previousTokenRef.current) {
        previousTokenRef.current = current;
        announceTokenChange({
          tokenNumber: current,
          queueName: q?.name,
          counterLabel: q?.note || null,
          queueType: (q as any)?.queue_type || "standard",
          enabled: audioEnabled,
        });
      }

      setData({
        queueId,
        queueName: q?.name || "Queue",
        businessName: bName,
        status: (q?.status as any) || "active",
        queueType: ((q as any)?.queue_type as any) || "standard",
        counterLabel: q?.note || null,
        currentToken: current,
        nextTokens: nextList,
        waitingCount: count ?? nextList.length,
        connectionStatus: "live",
        lastUpdatedAt: new Date().toISOString(),
        estimatedWaitMinutes: q?.estimated_service_time ? (count ?? nextList.length) * q.estimated_service_time : null,
      });
    } catch (err) {
      console.warn("Public display sync error; retrying in background", err);
      setData((prev) => ({ ...prev, connectionStatus: "reconnecting" }));
    }
  }, [queueId, isDemo, audioEnabled]);

  useEffect(() => {
    fetchDisplayData();

    if (isDemo || !queueId) return;

    // Realtime channel subscription
    const channel = supabase
      .channel(`public-display-${queueId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queues", filter: `id=eq.${queueId}` },
        () => fetchDisplayData()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "queue_live_signals", filter: `queue_id=eq.${queueId}` },
        () => fetchDisplayData()
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setData((prev) => ({ ...prev, connectionStatus: "live" }));
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setData((prev) => ({ ...prev, connectionStatus: "reconnecting" }));
        }
      });

    // 15-second background polling fallback
    const interval = setInterval(fetchDisplayData, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [queueId, isDemo, fetchDisplayData]);

  return { displayData: data, refresh: fetchDisplayData };
}
