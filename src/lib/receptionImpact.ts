import { supabase } from "@/integrations/supabase/client";

type EventType = "page_view" | "refresh" | "status_check";

// throttle keys per session so we don't spam status_check on every poll
const lastLoggedAt: Record<string, number> = {};

export async function logEngagement(
  businessId: string | null | undefined,
  queueId: string | null | undefined,
  eventType: EventType,
  visitorId?: string | null,
  throttleMs = 0,
) {
  if (!businessId || !queueId) return;
  const key = `${queueId}:${eventType}`;
  const now = Date.now();
  if (throttleMs > 0 && lastLoggedAt[key] && now - lastLoggedAt[key] < throttleMs) return;
  lastLoggedAt[key] = now;
  try {
    await (supabase as any).from("queue_engagement_events").insert({
      business_id: businessId,
      queue_id: queueId,
      visitor_id: visitorId ?? null,
      event_type: eventType,
    });
  } catch {
    // silent — engagement telemetry must never break the UX
  }
}