import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/business/BusinessLayout";
import { Activity, TrendingUp, TrendingDown, Lightbulb } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";
import HealthAIAssistant from "@/components/health/HealthAIAssistant";
import HealthFactorDetail from "@/components/health/HealthFactorDetail";

const QueueHealth = () => (
  <BusinessLayout>{(b) => <Content businessId={b.id} businessName={b.name} />}</BusinessLayout>
);

const bandMeta: Record<string, { label: string; color: string; tone: string; sentence: string }> = {
  excellent: { label: "Excellent", color: "text-success", tone: "bg-success-soft", sentence: "Your queue is running smoothly. Keep it up!" },
  good:      { label: "Good",      color: "text-success", tone: "bg-success-soft", sentence: "Solid performance. Small tweaks could push you higher." },
  attention: { label: "Needs Attention", color: "text-warning", tone: "bg-warning-soft", sentence: "A few factors are dragging your score down. Review the breakdown below." },
  poor:      { label: "Poor",      color: "text-warning", tone: "bg-warning-soft", sentence: "Customer experience is suffering. Act on the insights below." },
  critical:  { label: "Critical",  color: "text-danger",   tone: "bg-danger-soft",    sentence: "Queue health is critical. Immediate action recommended." },
};

const factorLabels: Record<string, string> = {
  wait_score: "Average Wait Time",
  abandon_score: "Abandonment Rate",
  efficiency_score: "Service Efficiency",
  delay_score: "Delay Frequency",
  accuracy_score: "Wait-Time Accuracy",
};
const factorWeights: Record<string, number> = {
  wait_score: 30, abandon_score: 25, efficiency_score: 20, delay_score: 15, accuracy_score: 10,
};

const factorDescriptions: Record<string, string> = {
  wait_score: "Average time customers wait from joining to being served. Lower waits = higher score.",
  abandon_score: "Share of customers who left before being served (skipped, removed, no-show). Fewer leavers = higher score.",
  efficiency_score: "How close your served-per-hour throughput is to your estimated capacity. More throughput = higher score.",
  delay_score: "How often service takes more than 1.5× your estimated service time. Fewer delays = higher score.",
  accuracy_score: "How close predicted wait times are to actual wait times. More accurate ETAs = higher score.",
};

const factorActions: Record<string, string> = {
  wait_score: "Tip: add capacity at peak hours or shorten service steps.",
  abandon_score: "Tip: send proactive ETA updates and keep customers informed.",
  efficiency_score: "Tip: reduce idle gaps between customers; call the next token sooner.",
  delay_score: "Tip: review long sessions and update your estimated service time.",
  accuracy_score: "Tip: tune the estimated service time in your queue settings.",
};

const factorStatus = (v: number) =>
  v >= 75 ? { label: "Strong", cls: "bg-success-soft text-success" } :
  v >= 60 ? { label: "Okay",   cls: "bg-warning-soft text-warning" } :
  v >= 40 ? { label: "Weak",   cls: "bg-warning-soft text-warning" } :
           { label: "Critical", cls: "bg-danger-soft text-danger" };

const Content = ({ businessId, businessName }: { businessId: string; businessName: string }) => {
  const [biz, setBiz] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Trigger snapshot
      await supabase.rpc("snapshot_queue_health", { p_business_id: businessId });

      const [{ data: bData }, { data: hData }, { data: qList }, { data: branchData }] = await Promise.all([
        supabase.rpc("get_business_health", { p_business_id: businessId, p_days: 7 }),
        supabase.from("queue_health_daily").select("*").eq("business_id", businessId).is("queue_id", null).order("day", { ascending: true }).limit(30),
        supabase.from("queues").select("id, name").eq("business_id", businessId),
        supabase.rpc("get_owner_health_branches", { p_days: 7 }),
      ]);

      setBiz(Array.isArray(bData) ? bData[0] : bData);
      setHistory((hData as any) || []);
      setBranches((branchData as any) || []);

      if (qList && qList.length) {
        const perQueue = await Promise.all(qList.map(async (q: any) => {
          const { data } = await supabase.rpc("get_queue_health", { p_queue_id: q.id, p_days: 7 });
          const row: any = Array.isArray(data) ? data[0] : data;
          return { ...q, health: row };
        }));
        setQueues(perQueue);
      }
      setLoading(false);
    })();
  }, [businessId]);

  const meta = biz ? bandMeta[biz.band] || bandMeta.good : null;
  const chartData = history.map((h: any) => ({ day: format(new Date(h.day), "MMM d"), score: Number(h.score) }));
  const best = history.length ? history.reduce((a, b) => Number(a.score) >= Number(b.score) ? a : b) : null;
  const worst = history.length ? history.reduce((a, b) => Number(a.score) <= Number(b.score) ? a : b) : null;
  const weekChange = history.length >= 2 ? Number(history[history.length - 1].score) - Number(history[0].score) : 0;

  const insights = buildInsights(biz, history);

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" /> Queue Health
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Live performance score for {businessName}</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-card rounded-2xl p-8 card-shadow animate-pulse h-40" />
      ) : !biz ? (
        <>
          <div className="bg-card rounded-2xl p-6 card-shadow text-center text-sm text-muted-foreground mb-6">
            Your Queue Health Score will unlock once you've served 10+ visitors in the last 7 days. In the meantime, your AI coach can already analyse what you have and recommend improvements.
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <HealthFactorDetail businessId={businessId} />
            <HealthAIAssistant businessId={businessId} businessName={businessName} />
          </div>
        </>
      ) : (
        <>
          {/* Hero */}
          <div className="bg-card rounded-2xl p-6 card-shadow mb-6 flex items-center gap-6 flex-wrap">
            <ScoreRing score={Number(biz.score)} band={biz.band} />
            <div className="min-w-0 flex-1">
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${meta!.tone} ${meta!.color}`}>
                {meta!.label}
              </span>
              <p className="text-base font-semibold text-foreground mt-2">{meta!.sentence}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on {biz.sample_count} served visits across {biz.queue_count} queue{biz.queue_count === 1 ? "" : "s"} in the last 7 days.
              </p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <HealthFactorDetail businessId={businessId} />
            <HealthAIAssistant businessId={businessId} businessName={businessName} />
          </div>

          {/* Trend */}
          <div className="bg-card rounded-2xl p-6 card-shadow mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 className="font-semibold text-foreground">Historical Trend</h3>
              <div className="flex gap-4 text-xs">
                <Stat label="Best" value={best ? Math.round(Number(best.score)) : "—"} sub={best ? format(new Date(best.day), "MMM d") : ""} />
                <Stat label="Worst" value={worst ? Math.round(Number(worst.score)) : "—"} sub={worst ? format(new Date(worst.day), "MMM d") : ""} />
                <Stat label="Change" value={`${weekChange >= 0 ? "+" : ""}${Math.round(weekChange)}`} icon={weekChange >= 0 ? <TrendingUp className="w-3 h-3 text-success" /> : <TrendingDown className="w-3 h-3 text-danger" />} />
              </div>
            </div>
            {chartData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">History will appear after a few daily snapshots.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
                  <Line type="monotone" dataKey="score" stroke="hsl(205 100% 50%)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Insights */}
          <div className="bg-card rounded-2xl p-6 card-shadow mb-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-warning" /> Improvement Insights</h3>
            {insights.length === 0 ? (
              <p className="text-sm text-muted-foreground">No urgent insights — your queue is performing well.</p>
            ) : (
              <ul className="space-y-2">
                {insights.map((i, idx) => (
                  <li key={idx} className="text-sm text-foreground flex gap-2">
                    <span className="text-primary">•</span> {i}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Per-queue table */}
          {queues.length > 1 && (
            <div className="bg-card rounded-2xl p-6 card-shadow mb-6">
              <h3 className="font-semibold text-foreground mb-4">Per Queue</h3>
              <div className="space-y-2">
                {queues.map((q: any) => (
                  <div key={q.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <span className="text-sm text-foreground">{q.name}</span>
                    {q.health?.score != null ? (
                      <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${bandMeta[q.health.band].tone} ${bandMeta[q.health.band].color}`}>
                        {Math.round(Number(q.health.score))}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Insufficient data</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multi-branch */}
          {branches.length > 1 && (
            <div className="bg-card rounded-2xl p-6 card-shadow">
              <h3 className="font-semibold text-foreground mb-1">All Branches</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Overall score: <span className="font-bold text-foreground">{Math.round(branches.reduce((s, b) => s + Number(b.score) * b.sample_count, 0) / branches.reduce((s, b) => s + b.sample_count, 0))}</span>
              </p>
              <div className="space-y-2">
                {branches.map((b: any) => (
                  <div key={b.business_id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <div>
                      <p className="text-sm text-foreground">{b.business_name}</p>
                      <p className="text-xs text-muted-foreground">{b.category || "Business"}</p>
                    </div>
                    <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${bandMeta[b.band].tone} ${bandMeta[b.band].color}`}>
                      {Math.round(Number(b.score))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ringColor = (band: string) =>
  band === "excellent" || band === "good" ? "stroke-success" :
  band === "attention" ? "stroke-warning" :
  band === "poor" ? "stroke-warning" : "stroke-danger";

const ScoreRing = ({ score, band }: { score: number; band: string }) => {
  const c = 2 * Math.PI * 54;
  const off = c - (Math.max(0, Math.min(100, score)) / 100) * c;
  return (
    <div className="relative w-32 h-32 shrink-0">
      <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
        <circle cx="60" cy="60" r="54" className="stroke-muted" strokeWidth="10" fill="none" />
        <circle cx="60" cy="60" r="54" className={ringColor(band)} strokeWidth="10" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{Math.round(score)}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
};

const Stat = ({ label, value, sub, icon }: { label: string; value: any; sub?: string; icon?: React.ReactNode }) => (
  <div className="text-right">
    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    <p className="text-sm font-bold text-foreground flex items-center gap-1 justify-end">{icon}{value}</p>
    {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
  </div>
);

function buildInsights(biz: any, history: any[]): string[] {
  if (!biz) return [];
  const out: string[] = [];
  const factors: Array<[string, number]> = [
    ["wait_score", Number(biz.wait_score)],
    ["abandon_score", Number(biz.abandon_score)],
    ["efficiency_score", Number(biz.efficiency_score)],
    ["delay_score", Number(biz.delay_score)],
    ["accuracy_score", Number(biz.accuracy_score)],
  ];
  const messages: Record<string, string> = {
    wait_score: "Average wait time is hurting your score — consider speeding up service or adding capacity at peak hours.",
    abandon_score: "Customers are leaving before being served. Send proactive ETA updates or shorten the queue.",
    efficiency_score: "Service throughput is below capacity. Check for idle time between customers.",
    delay_score: "Service durations are running long. Investigate frequent delays during sessions.",
    accuracy_score: "Wait-time estimates are off. Reviewing your estimated service time will improve accuracy.",
  };
  factors.filter(([, v]) => v < 70).sort((a, b) => a[1] - b[1]).slice(0, 3)
    .forEach(([k]) => out.push(messages[k]));

  if (history.length >= 7) {
    const first = Number(history[0].score);
    const last = Number(history[history.length - 1].score);
    const diff = Math.round(last - first);
    if (Math.abs(diff) >= 5) {
      out.push(diff > 0
        ? `Your score improved by ${diff} points over the last ${history.length} days. Keep going!`
        : `Your score dropped by ${Math.abs(diff)} points over the last ${history.length} days.`);
    }
  }
  return out;
}

export default QueueHealth;