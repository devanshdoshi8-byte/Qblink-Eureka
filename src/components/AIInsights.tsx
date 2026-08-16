import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, Loader2, AlertTriangle, TrendingUp, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Insight = "queue" | "analytics" | "pickup" | "customer_queue" | "customer_pickup";

interface Props {
  insight: Insight;
  mode: "customer" | "business";
  businessId?: string;
  payload?: Record<string, unknown>;
  title?: string;
  compact?: boolean;
  className?: string;
}

interface Result {
  summary: string;
  suggestions: string[];
  urgency: "low" | "medium" | "high";
}

const TITLES: Record<Insight, string> = {
  queue: "AI Queue Insight",
  analytics: "AI Performance Summary",
  pickup: "AI Pickup Insight",
  customer_queue: "AI Wait Advice",
  customer_pickup: "AI Pickup Advice",
};

export default function AIInsights({ insight, mode, businessId, payload, title, compact, className }: Props) {
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/qblink-ai`;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ insight, mode, businessId, payload, messages: [] }),
      });
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j.error || "AI failed");
      }
      const j = await resp.json();
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { run(); /* eslint-disable-next-line */ }, [insight, businessId, JSON.stringify(payload || {})]);

  const urgencyColor = data?.urgency === "high"
    ? "border-danger/30 bg-danger-soft/40"
    : data?.urgency === "medium"
      ? "border-warning/30 bg-warning-soft/40"
      : "border-primary/20 bg-primary/5";

  const Icon = data?.urgency === "high" ? AlertTriangle : data?.urgency === "medium" ? TrendingUp : Sparkles;

  return (
    <div className={`rounded-2xl border ${urgencyColor} p-4 ${className ?? ""}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <p className="text-sm font-bold text-foreground flex-1">{title ?? TITLES[insight]}</p>
        <button
          onClick={run}
          disabled={loading}
          className="text-xs text-muted-foreground hover:text-foreground p-1 rounded-lg disabled:opacity-50"
          aria-label="Refresh"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        </button>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {!error && (
        <>
          {loading && !data ? (
            <div className="space-y-2">
              <div className="h-3 rounded bg-muted animate-pulse" />
              <div className="h-3 rounded bg-muted animate-pulse w-4/5" />
            </div>
          ) : data ? (
            <>
              <p className={`text-sm text-foreground ${compact ? "" : "mb-3"} leading-relaxed`}>{data.summary}</p>
              {!compact && data.suggestions?.length > 0 && (
                <div className="space-y-1.5">
                  {data.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                      <Lightbulb className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}