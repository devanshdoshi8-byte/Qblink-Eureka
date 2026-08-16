import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, Clock, Flame, Lightbulb, PlusCircle, Scale, Utensils, Users,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { SkeletonChartCard, SkeletonStatGrid } from "@/components/skeletons/DashboardSkeletons";

/**
 * Restaurant seating analytics — every number below is computed from real
 * queue_visitors rows belonging to this business's table-size queues.
 * Nothing is simulated: when there is no activity, an empty state is shown.
 */

type RangeKey = "today" | "week" | "lastWeek";

const RANGES: Record<RangeKey, { label: string; suffix: string }> = {
  today: { label: "Today", suffix: "today" },
  week: { label: "This Week", suffix: "over the last 7 days" },
  lastWeek: { label: "Last Week", suffix: "in the previous 7 days" },
};

const rangeBounds = (key: RangeKey) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (key === "today") return { from: startOfToday, to: now };
  if (key === "week") return { from: new Date(startOfToday.getTime() - 6 * 864e5), to: now };
  return {
    from: new Date(startOfToday.getTime() - 13 * 864e5),
    to: new Date(startOfToday.getTime() - 7 * 864e5),
  };
};

interface VisitorRow {
  queue_id: string;
  status: string;
  joined_at: string;
  called_at: string | null;
  served_at: string | null;
  party_size: number | null;
  assigned_table_size: number | null;
}

interface QueueRow {
  id: string;
  table_size: number | null;
  parent_queue_id: string | null;
  queue_type: string;
  table_config: any;
  seating_policy: string | null;
}

interface SizeStat {
  size: number;
  joined: number;
  served: number;
  noShow: number;
  waitingNow: number;
  avgWait: number | null;
  avgService: number | null;
  tables: number;
  turnsPerTable: number | null;
  share: number;
  waits: number[];
}

const mins = (a: string, b: string) => (new Date(a).getTime() - new Date(b).getTime()) / 60000;
const avg = (xs: number[]) => (xs.length ? xs.reduce((s, n) => s + n, 0) / xs.length : null);
const percentile = (sorted: number[], p: number) => {
  if (!sorted.length) return null;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))));
  return Math.round(sorted[i]);
};
const PCTS = [50, 75, 90, 95] as const;

const RestaurantAnalytics = ({ businessId }: { businessId: string }) => {
  const [range, setRange] = useState<RangeKey>("today");
  const [queues, setQueues] = useState<QueueRow[]>([]);
  const [visitors, setVisitors] = useState<VisitorRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: qs } = await supabase
      .from("queues")
      .select("id,table_size,parent_queue_id,queue_type,table_config,seating_policy")
      .eq("business_id", businessId);
    const rows = ((qs || []) as any[]) as QueueRow[];
    setQueues(rows);

    const seatQueueIds = rows
      .filter((q) => q.parent_queue_id !== null || q.queue_type === "restaurant")
      .map((q) => q.id);
    if (seatQueueIds.length === 0) {
      setVisitors([]);
      setLoading(false);
      return;
    }
    const { from } = rangeBounds("lastWeek"); // widest window, filtered client-side
    const { data: vs } = await supabase
      .from("queue_visitors")
      .select("queue_id,status,joined_at,called_at,served_at,party_size,assigned_table_size")
      .in("queue_id", seatQueueIds)
      .gte("joined_at", from.toISOString())
      .order("joined_at", { ascending: false });
    setVisitors(((vs || []) as any[]) as VisitorRow[]);
    setLoading(false);
  }, [businessId]);

  useEffect(() => { load(); }, [load]);

  // Same realtime spine the rest of the app uses: PII-free live signals.
  useEffect(() => {
    const ch = supabase
      .channel(`restaurant-analytics-${businessId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "queue_live_signals" }, () => load())
      .subscribe();
    const poll = setInterval(load, 60000);
    return () => { supabase.removeChannel(ch); clearInterval(poll); };
  }, [businessId, load]);

  const sizeByQueue = useMemo(() => {
    const m = new Map<string, number | null>();
    queues.forEach((q) => m.set(q.id, q.table_size ?? null));
    return m;
  }, [queues]);

  const tableCounts = useMemo(() => {
    const m = new Map<number, number>();
    queues
      .filter((q) => q.queue_type === "restaurant" && !q.parent_queue_id)
      .forEach((q) => {
        const cfg = Array.isArray(q.table_config) ? q.table_config : [];
        cfg.forEach((e: any) => {
          const seats = Number(e?.seats);
          const count = Number(e?.count ?? 0);
          if (Number.isFinite(seats) && count > 0) m.set(seats, (m.get(seats) || 0) + count);
        });
      });
    return m;
  }, [queues]);

  const policy = useMemo(() => {
    const parent = queues.find((q) => q.queue_type === "restaurant" && !q.parent_queue_id);
    return (parent?.seating_policy as "flexible" | "strict" | null) ?? null;
  }, [queues]);

  const scoped = useMemo(() => {
    const { from, to } = rangeBounds(range);
    return visitors.filter((v) => {
      const t = new Date(v.joined_at).getTime();
      return t >= from.getTime() && t <= to.getTime();
    });
  }, [range, visitors]);

  const stats = useMemo<SizeStat[]>(() => {
    const buckets = new Map<number, VisitorRow[]>();
    scoped.forEach((v) => {
      const size = v.assigned_table_size ?? sizeByQueue.get(v.queue_id) ?? null;
      if (size == null) return;
      const arr = buckets.get(size) || [];
      arr.push(v);
      buckets.set(size, arr);
    });
    tableCounts.forEach((_c, size) => { if (!buckets.has(size)) buckets.set(size, []); });

    const totalJoined = scoped.length || 1;
    return [...buckets.entries()]
      .map(([size, rows]) => {
        const served = rows.filter((r) => r.status === "served" && r.served_at);
        const waits = served
          .map((r) => mins(r.served_at!, r.joined_at))
          .filter((n) => Number.isFinite(n) && n >= 0 && n < 600);
        const services = served
          .filter((r) => r.called_at)
          .map((r) => mins(r.served_at!, r.called_at!))
          .filter((n) => Number.isFinite(n) && n >= 0 && n < 600);
        const tables = tableCounts.get(size) || 0;
        const a = avg(waits);
        const s = avg(services);
        return {
          size,
          joined: rows.length,
          served: served.length,
          noShow: rows.filter((r) => r.status === "no_show" || r.status === "skipped").length,
          waitingNow: rows.filter((r) => r.status === "waiting" || r.status === "checked_in").length,
          avgWait: a == null ? null : Math.round(a),
          avgService: s == null ? null : Math.round(s),
          tables,
          turnsPerTable: tables > 0 ? Math.round((served.length / tables) * 10) / 10 : null,
          share: Math.round((rows.length / totalJoined) * 100),
          waits: waits.sort((x, y) => x - y),
        };
      })
      .sort((x, y) => x.size - y.size);
  }, [scoped, sizeByQueue, tableCounts]);

  const hourly = useMemo(() => {
    const m = new Map<number, number>();
    scoped.forEach((v) => {
      const h = new Date(v.joined_at).getHours();
      m.set(h, (m.get(h) || 0) + 1);
    });
    return [...m.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([h, parties]) => ({
        hour: `${((h + 11) % 12) + 1}${h < 12 ? "a" : "p"}`,
        rawHour: h,
        parties,
      }));
  }, [scoped]);

  const totalJoined = scoped.length;
  const totalServed = stats.reduce((s, t) => s + t.served, 0);
  const mostRequested = [...stats].sort((a, b) => b.joined - a.joined)[0];
  const peak = [...hourly].sort((a, b) => b.parties - a.parties)[0];
  const allWaits = useMemo(
    () => stats.flatMap((s) => s.waits).sort((a, b) => a - b),
    [stats],
  );

  const recommendations = useMemo(() => {
    const out: Array<{ priority: "High" | "Medium" | "Low"; icon: JSX.Element; tone: string; title: string; detail: string; action: string }> = [];
    if (!totalJoined) return out;

    const pressured = [...stats]
      .filter((t) => t.avgWait != null && t.served >= 3)
      .sort((a, b) => (b.avgWait || 0) - (a.avgWait || 0))[0];
    if (pressured && (pressured.avgWait || 0) >= 15) {
      out.push({
        priority: "High",
        icon: <AlertTriangle className="w-4 h-4 text-destructive" />,
        tone: "bg-destructive/10",
        title: `${pressured.size}-seater waits are the longest`,
        detail: `Average wait is ${pressured.avgWait}m across ${pressured.served} seated parties${pressured.avgService != null ? `, with ${pressured.avgService}m at the table before completion` : ""}.`,
        action: pressured.tables > 0
          ? `Add capacity for ${pressured.size}-seaters or shorten turnover`
          : `Configure ${pressured.size}-seat tables so routing has capacity`,
      });
    }

    if (mostRequested && totalJoined >= 5 && mostRequested.share >= 40) {
      out.push({
        priority: "Medium",
        icon: <Scale className="w-4 h-4 text-primary" />,
        tone: "bg-primary/10",
        title: `${mostRequested.share}% of demand is on ${mostRequested.size}-seaters`,
        detail: `${mostRequested.joined} of ${totalJoined} parties ${RANGES[range].suffix} needed a ${mostRequested.size}-seat table.`,
        action: `Rebalance your table mix toward ${mostRequested.size}-seaters`,
      });
    }

    const idle = stats.filter((t) => t.tables > 0 && t.joined === 0);
    if (idle.length) {
      out.push({
        priority: "Low",
        icon: <PlusCircle className="w-4 h-4 text-primary" />,
        tone: "bg-primary/10",
        title: `${idle.map((t) => `${t.size}-seater`).join(", ")} saw no demand`,
        detail: `These sizes are configured but received no parties ${RANGES[range].suffix}.`,
        action: policy === "strict"
          ? "Switch to Flexible matching so smaller parties can use these tables"
          : "Consider converting some of these tables to sizes with real demand",
      });
    }

    const dropped = stats.reduce((s, t) => s + t.noShow, 0);
    if (totalJoined >= 5 && dropped / totalJoined >= 0.2) {
      out.push({
        priority: "High",
        icon: <Clock className="w-4 h-4 text-destructive" />,
        tone: "bg-destructive/10",
        title: `${Math.round((dropped / totalJoined) * 100)}% of parties left before seating`,
        detail: `${dropped} of ${totalJoined} parties were marked no-show or skipped ${RANGES[range].suffix}.`,
        action: "Tighten wait estimates or shorten the arrival window",
      });
    }

    if (peak && peak.parties >= 3) {
      out.push({
        priority: "Medium",
        icon: <Flame className="w-4 h-4 text-primary" />,
        tone: "bg-primary/10",
        title: `Busiest hour is ${peak.hour}`,
        detail: `${peak.parties} parties joined during that hour ${RANGES[range].suffix}.`,
        action: "Staff an extra host 15 minutes before that window",
      });
    }
    return out;
  }, [mostRequested, peak, policy, range, stats, totalJoined]);

  if (loading) {
    return (
      <section className="space-y-4">
        <SkeletonStatGrid count={3} />
        <SkeletonChartCard />
      </section>
    );
  }

  const hasSeating = tableCounts.size > 0 || stats.length > 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Restaurant Seating Analytics</h3>
          {policy && (
            <span className="text-[10px] font-semibold uppercase tracking-wide rounded-full bg-primary/10 text-primary px-2 py-0.5">
              {policy} matching
            </span>
          )}
        </div>
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {(Object.keys(RANGES) as RangeKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setRange(k)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                range === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {RANGES[k].label}
            </button>
          ))}
        </div>
      </div>

      {!hasSeating && (
        <div className="bg-card rounded-2xl p-6 card-shadow text-center">
          <p className="text-sm text-muted-foreground">
            Configure your table sizes in Queue Configuration to unlock seating analytics.
          </p>
        </div>
      )}

      {hasSeating && totalJoined === 0 && (
        <div className="bg-card rounded-2xl p-6 card-shadow text-center">
          <p className="text-sm text-muted-foreground">
            No parties joined {RANGES[range].suffix}. Seating analytics will populate from real customer activity.
          </p>
        </div>
      )}

      {hasSeating && totalJoined > 0 && (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <MiniStat label="Parties Joined" value={totalJoined} sub={RANGES[range].suffix} icon={<Users className="w-4 h-4 text-primary" />} />
            <MiniStat
              label="Most Requested"
              value={mostRequested && mostRequested.joined > 0 ? `${mostRequested.size}-seater` : "—"}
              sub={mostRequested && mostRequested.joined > 0 ? `${mostRequested.joined} parties · ${mostRequested.share}% of demand` : "no demand yet"}
              icon={<Scale className="w-4 h-4 text-primary" />}
            />
            <MiniStat
              label="Peak Time"
              value={peak ? peak.hour : "—"}
              sub={peak ? `${peak.parties} parties joined` : "no data yet"}
              icon={<Flame className="w-4 h-4 text-primary" />}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-card rounded-2xl p-5 card-shadow">
                <h4 className="font-semibold text-foreground">Demand by Table Size</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  {totalServed} of {totalJoined} parties seated {RANGES[range].suffix}
                </p>
                <div className="space-y-3">
                  {stats.map((t) => (
                    <div key={t.size}>
                      <div className="flex items-baseline justify-between text-xs mb-1">
                        <span className="font-semibold text-foreground">{t.size}-seater</span>
                        <span className="text-muted-foreground tabular-nums">
                          {t.joined} joined · {t.served} seated
                          {t.avgWait != null && ` · ${t.avgWait}m avg wait`}
                          {t.tables > 0 && t.turnsPerTable != null && ` · ${t.turnsPerTable} turns/table`}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${Math.min(100, t.share)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-2xl p-5 card-shadow">
                <h4 className="font-semibold text-foreground">Party Volume by Hour</h4>
                <p className="text-xs text-muted-foreground mb-4">When guests actually join, {RANGES[range].suffix}</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hourly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
                    <Bar dataKey="parties" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {allWaits.length >= 5 && (
                <div className="bg-card rounded-2xl p-5 card-shadow">
                  <h4 className="font-semibold text-foreground">Wait Time Distribution</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Measured across {allWaits.length} seated parties {RANGES[range].suffix}
                  </p>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {PCTS.map((p) => (
                      <div key={p} className="rounded-xl bg-muted/50 p-3 text-center">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">P{p}</p>
                        <p className="text-lg font-extrabold tabular-nums text-foreground">{percentile(allWaits, p)}m</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {stats.filter((t) => t.waits.length > 0).map((t) => (
                      <div key={t.size} className="flex items-center gap-3 text-xs">
                        <span className="w-20 shrink-0 font-semibold text-foreground">{t.size}-seater</span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/70"
                            style={{
                              width: `${Math.min(100, ((percentile(t.waits, 90) || 0) / Math.max(1, percentile(allWaits, 95) || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="w-28 shrink-0 text-right text-muted-foreground tabular-nums">
                          P50 {percentile(t.waits, 50)}m · P90 {percentile(t.waits, 90)}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="bg-card rounded-2xl p-5 card-shadow h-fit">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-foreground">Recommendations</h4>
              </div>
              {recommendations.length === 0 ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No action needed right now — seating demand and waits are within a healthy range.
                </p>
              ) : (
                <ul className="space-y-3">
                  {recommendations.map((r) => (
                    <li key={r.title} className={`rounded-xl p-3 ${r.tone}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {r.icon}
                        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{r.priority}</span>
                      </div>
                      <p className="text-xs font-semibold text-foreground">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{r.detail}</p>
                      <p className="text-[11px] font-medium text-primary mt-1.5">{r.action}</p>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
                Every figure is computed live from your seating queues.
              </p>
            </aside>
          </div>
        </>
      )}
    </section>
  );
};

const MiniStat = ({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: JSX.Element }) => (
  <div className="bg-card rounded-2xl p-4 card-shadow flex flex-col gap-1.5">
    <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {icon}
      <span className="truncate">{label}</span>
    </div>
    <p className="text-2xl font-extrabold tabular-nums tracking-tight text-foreground">{value}</p>
    {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
  </div>
);

export default RestaurantAnalytics;
