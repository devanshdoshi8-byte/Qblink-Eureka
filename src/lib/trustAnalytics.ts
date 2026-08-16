import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "qb_trust_session_id";
const VIEWED_AT_KEY = "qb_trust_modal_viewed_at";

function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? `s_${Date.now()}_${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

function readViewedAt(): number | null {
  try {
    const raw = localStorage.getItem(VIEWED_AT_KEY);
    return raw ? parseInt(raw, 10) || null : null;
  } catch {
    return null;
  }
}

export async function trackTrustModalOpen(source = "join_queue") {
  const session_id = getSessionId();
  const now = Date.now();
  try {
    localStorage.setItem(VIEWED_AT_KEY, String(now));
  } catch {}
  try {
    await (supabase as any).from("trust_privacy_events").insert({
      event_type: "modal_opened",
      session_id,
      viewed_modal: true,
      source,
      metadata: { path: typeof window !== "undefined" ? window.location.pathname : null },
    });
  } catch {
    // silent — analytics must never break UX
  }
}

export async function trackEarlyAccessSubmitted(source: string, metadata: Record<string, unknown> = {}) {
  const session_id = getSessionId();
  const viewedAt = readViewedAt();
  const seconds_since_view = viewedAt ? Math.max(0, Math.round((Date.now() - viewedAt) / 1000)) : null;
  try {
    await (supabase as any).from("trust_privacy_events").insert({
      event_type: "early_access_submitted",
      session_id,
      viewed_modal: viewedAt != null,
      seconds_since_view,
      source,
      metadata,
    });
  } catch {
    // silent
  }
}