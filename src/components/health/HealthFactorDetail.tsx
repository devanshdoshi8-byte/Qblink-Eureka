import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity } from "lucide-react";

interface Props { businessId: string; }

interface Factor {
  key: string;
  label: string;
  weight: number;
  score: number;
  rawLabel: string;
  rawValue: string;
  description: string;
  recommendation: string;
}

const FACTOR_META: Record<string, { label: string; weight: number; description: string; recommendation: (raw: any) => string; rawLabel: string }> = {
  wait_score: {
    label: "Average Wait Time",
    weight: 30,
    rawLabel: "Avg wait (last 7d)",
    description: "Time from joining to being served.",
    recommendation: (m) => m.avg_wait_minutes > 20 ? "Wait time is high — add capacity during peak hours or split into multiple parallel queues." : m.avg_wait_minutes > 10 ? "Slightly above ideal. Trim 1–2 minutes by pre-screening before calling the next token." : "Wait time is healthy. Maintain current pace.",
  },
  abandon_score: {
    label: "Abandonment Rate",
    weight: 25,
    rawLabel: "% who left before served",
    description: "Customers who skipped, were removed, or no-showed.",
    recommendation: (m) => m.abandonment_rate > 0.2 ? "1-in-5 customers are walking away. Send ETA SMS updates and allow remote joining." : m.abandonment_rate > 0.1 ? "Some abandonment — keep customers informed of their position." : "Excellent retention. Customers are sticking with you.",
  },
  efficiency_score: {
    label: "Service Efficiency",
    weight: 20,
    rawLabel: "Served vs expected capacity",
    description: "Served-per-hour vs your estimated capacity.",
    recommendation: (m) => m.avg_service_minutes > m.estimated_service_minutes_avg * 1.2 ? "Service is slower than planned. Audit your steps for the 1–2 biggest bottlenecks." : "Throughput is on target. Look for tiny gaps between customers to gain more.",
  },
  delay_score: {
    label: "Delay Frequency",
    weight: 15,
    rawLabel: "Sessions over 1.5× estimate",
    description: "How often a service runs over budget.",
    recommendation: (m) => m.delay_rate > 0.25 ? "Delays are frequent. Update your estimated service time or pre-prepare common requests." : "Delays are under control.",
  },
  accuracy_score: {
    label: "Wait-Time Accuracy",
    weight: 10,
    rawLabel: "Prediction vs reality",
    description: "How close shown ETAs are to actual waits.",
    recommendation: () => "Tune your estimated service time in queue settings for more accurate ETAs and happier customers.",
  },
};

export default function HealthFactorDetail({ businessId }: Props) {
  const [data, setData] = useState<{ health: any; metrics: any } | null>(null);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const [{ data: healthData }, { data: queues }] = await Promise.all([
        supabase.rpc("get_business_health", { p_business_id: businessId, p_days: 7 }),
        supabase.from("queues").select("id, estimated_service_time").eq("business_id", businessId),
      ]);
      const queueIds = (queues || []).map((q: any) => q.id);
      const { data: visitors } = queueIds.length
        ? await supabase.from("queue_visitors").select("status,joined_at,called_at,served_at,queue_id").in("queue_id", queueIds).gte("joined_at", since)
        : { data: [] };
      const total = visitors?.length || 0;
      const served = (visitors || []).filter((v: any) => v.status === "served");
      const abandoned = (visitors || []).filter((v: any) => ["skipped","removed","no_show"].includes(v.status));
      const waits = served.filter((v: any) => v.served_at).map((v: any) => (new Date(v.served_at).getTime() - new Date(v.joined_at).getTime()) / 60000);
      const avgWait = waits.length ? waits.reduce((a: number, b: number) => a + b, 0) / waits.length : 0;
      const serviceTimes = served.filter((v: any) => v.called_at && v.served_at).map((v: any) => (new Date(v.served_at).getTime() - new Date(v.called_at).getTime()) / 60000);
      const avgService = serviceTimes.length ? serviceTimes.reduce((a: number, b: number) => a + b, 0) / serviceTimes.length : 0;
      const estAvg = (queues || []).reduce((s: number, q: any) => s + (q.estimated_service_time || 5), 0) / Math.max(1, (queues || []).length);
      const delays = serviceTimes.filter((t: number) => t > 1.5 * estAvg).length;

      setData({
        health: Array.isArray(healthData) ? healthData[0] : healthData,
        metrics: {
          total_joined_7d: total,
          served_7d: served.length,
          abandoned_7d: abandoned.length,
          abandonment_rate: total ? abandoned.length / total : 0,
          avg_wait_minutes: Number(avgWait.toFixed(1)),
          avg_service_minutes: Number(avgService.toFixed(1)),
          estimated_service_minutes_avg: Number(estAvg.toFixed(1)),
          delays_over_1_5x_est: delays,
          delay_rate: served.length ? delays / served.length : 0,
        },
      });
    })();
  }, [businessId]);

  if (!data) return <div className="bg-card rounded-2xl card-shadow h-64 animate-pulse" />;
  const { health, metrics } = data;

  const factors: Factor[] = Object.entries(FACTOR_META).map(([key, meta]) => {
    const score = Number(health?.[key] ?? 0);
    let rawValue = "—";
    if (key === "wait_score") rawValue = `${metrics.avg_wait_minutes} min`;
    else if (key === "abandon_score") rawValue = `${(metrics.abandonment_rate * 100).toFixed(1)}% (${metrics.abandoned_7d}/${metrics.total_joined_7d})`;
    else if (key === "efficiency_score") rawValue = `${metrics.avg_service_minutes} min vs ${metrics.estimated_service_minutes_avg} min est.`;
    else if (key === "delay_score") rawValue = `${(metrics.delay_rate * 100).toFixed(1)}% (${metrics.delays_over_1_5x_est} sessions)`;
    else if (key === "accuracy_score") rawValue = score ? `${Math.round(score)}/100 prediction match` : "Will appear with more data";
    return {
      key, label: meta.label, weight: meta.weight, score, rawLabel: meta.rawLabel, rawValue,
      description: meta.description, recommendation: meta.recommendation(metrics),
    };
  });

  const barColor = (s: number) => s >= 75 ? "bg-success" : s >= 60 ? "bg-warning" : s >= 40 ? "bg-warning" : "bg-danger";

  return (
    <div className="bg-card rounded-2xl card-shadow p-6">
      <div className="flex items-center gap-2 mb-1">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-foreground">Factor Breakdown</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-5">Raw metric · weight in score · what to do about it</p>

      <div className="space-y-5">
        {factors.map(f => (
          <div key={f.key} className="border border-border rounded-xl p-4 bg-background/50">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
              <div>
                <h4 className="font-semibold text-foreground text-sm">{f.label}</h4>
                <p className="text-[11px] text-muted-foreground">{f.description}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-bold text-foreground">{f.score ? Math.round(f.score) : "—"}<span className="text-xs text-muted-foreground">/100</span></div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Weight {f.weight}%</div>
              </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
              <div className={`h-full ${barColor(f.score)} transition-all`} style={{ width: `${f.score || 0}%` }} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-muted/50 rounded-lg px-3 py-2">
                <p className="text-[10px] uppercase text-muted-foreground tracking-wide">{f.rawLabel}</p>
                <p className="font-semibold text-foreground mt-0.5">{f.rawValue}</p>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                <p className="text-[10px] uppercase text-primary tracking-wide">Recommendation</p>
                <p className="text-foreground mt-0.5">{f.recommendation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}