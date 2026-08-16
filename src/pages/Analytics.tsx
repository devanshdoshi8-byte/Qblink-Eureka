import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/business/BusinessLayout";
import AIInsights from "@/components/AIInsights";
import PeakHourHeatmap from "@/components/PeakHourHeatmap";
import { Users, TrendingUp, Clock, Star } from "lucide-react";
import TrendBadge from "@/components/TrendBadge";
import InfoHint from "@/components/InfoHint";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import {
  SkeletonStatGrid,
  SkeletonChartCard,
  SkeletonPageHeader,
} from "@/components/skeletons/DashboardSkeletons";

const COLORS = ["hsl(205 100% 50%)", "hsl(185 100% 45%)", "hsl(160 70% 50%)", "hsl(280 70% 60%)"];

const Analytics = () => (
  <BusinessLayout>{(business) => <AnalyticsContent businessId={business.id} />}</BusinessLayout>
);

const AnalyticsContent = ({ businessId }: { businessId: string }) => {
  const [range, setRange] = useState<"week" | "month" | "90d">("week");
  const [stats, setStats] = useState({ total: 0, served: 0, avgWait: 0 });
  const [rating, setRating] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 });
  const [weekly, setWeekly] = useState<{ day: string; served: number; skipped: number }[]>([]);
  const [hourly, setHourly] = useState<{ hour: string; visitors: number }[]>([]);
  const [byQueue, setByQueue] = useState<{ name: string; value: number }[]>([]);
  const [rawVisitors, setRawVisitors] = useState<{ joined_at: string; status: string; served_at: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, [businessId, range]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const days = range === "week" ? 7 : range === "month" ? 30 : 90;
    const since = startOfDay(subDays(new Date(), days)).toISOString();

    const { data: queues } = await supabase.from("queues").select("id, name").eq("business_id", businessId);
    const queueIds = queues?.map(q => q.id) || [];

    const { data: reviews } = await supabase
      .from("business_reviews").select("rating").eq("business_id", businessId);
    const rs = (reviews || []).map((r: any) => Number(r.rating)).filter((n) => !Number.isNaN(n));
    setRating({
      avg: rs.length ? Math.round((rs.reduce((a, b) => a + b, 0) / rs.length) * 10) / 10 : 0,
      count: rs.length,
    });

    if (queueIds.length === 0) {
      setStats({ total: 0, served: 0, avgWait: 0 });
      setWeekly([]); setHourly([]); setByQueue([]); setRawVisitors([]);
      setLoading(false);
      return;
    }

    const { data: visitors } = await supabase
      .from("queue_visitors").select("*").in("queue_id", queueIds).gte("joined_at", since);

    const all = visitors || [];
    setRawVisitors(all.map((v: any) => ({ joined_at: v.joined_at, status: v.status, served_at: v.served_at })));
    const served = all.filter(v => v.status === "served");
    const skipped = all.filter(v => v.status === "skipped");

    const waitTimes = served.filter(v => v.served_at).map(v =>
      (new Date(v.served_at!).getTime() - new Date(v.joined_at).getTime()) / 60000
    );
    const avgWait = waitTimes.length ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;

    setStats({ total: all.length, served: served.length, avgWait });

    // Weekly
    const dayBuckets: Record<string, { served: number; skipped: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "EEE");
      dayBuckets[d] = { served: 0, skipped: 0 };
    }
    all.forEach(v => {
      const d = format(new Date(v.joined_at), "EEE");
      if (dayBuckets[d]) {
        if (v.status === "served") dayBuckets[d].served++;
        if (v.status === "skipped") dayBuckets[d].skipped++;
      }
    });
    setWeekly(Object.entries(dayBuckets).slice(-7).map(([day, v]) => ({ day, ...v })));

    // Hourly
    const hourBuckets: Record<string, number> = {};
    for (let h = 9; h <= 20; h++) hourBuckets[`${h}:00`] = 0;
    all.forEach(v => {
      const h = new Date(v.joined_at).getHours();
      const key = `${h}:00`;
      if (hourBuckets[key] !== undefined) hourBuckets[key]++;
    });
    setHourly(Object.entries(hourBuckets).map(([hour, visitors]) => ({ hour, visitors })));

    // By queue
    const queueCounts: Record<string, number> = {};
    queues?.forEach(q => { queueCounts[q.name] = all.filter(v => v.queue_id === q.id).length; });
    setByQueue(Object.entries(queueCounts).map(([name, value]) => ({ name, value })).filter(q => q.value > 0));

    setLoading(false);
  };

  const isEmpty = stats.total === 0;

  if (loading) {
    return (
      <div>
        <SkeletonPageHeader />
        <SkeletonStatGrid count={4} className="mb-6" />
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <SkeletonChartCard wide />
          <SkeletonChartCard height={200} />
        </div>
        <SkeletonChartCard height={260} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Queue performance and visitor insights</p>
        </div>
        <div className="flex gap-1 bg-card rounded-xl p-1 card-shadow">
          {(["week", "month", "90d"] as const).map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              range === r ? "gradient-bg text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
              {r === "week" ? "This Week" : r === "month" ? "This Month" : "Last 90 Days"}
            </button>
          ))}
        </div>
      </div>

      {isEmpty && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 text-sm text-muted-foreground">
          📊 No queue activity yet. Charts will populate live as customers join your queues.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <BigStat
          icon={<Users className="w-5 h-5 text-primary" />}
          value={stats.total}
          label="Total Visitors"
          sub={`${range === "week" ? "last 7 days" : range === "month" ? "last 30 days" : "last 90 days"}`}
          tip={{
            title: "Total Visitors",
            description: "Everyone who joined any of your queues in the selected period.",
            example: "Includes served, skipped, and still-waiting customers.",
          }}
        />
        <BigStat
          icon={<TrendingUp className="w-5 h-5 text-success" />}
          value={stats.served}
          label="Customers Served"
          trend={stats.total ? Math.round((stats.served / stats.total) * 100) : 0}
          trendLabel="completion"
          tip={{
            title: "Customers Served",
            description: "Visitors successfully attended to. The badge shows your completion rate.",
            example: "80 served out of 100 joined = 80% completion.",
          }}
        />
        <BigStat
          icon={<Clock className="w-5 h-5 text-warning" />}
          value={`${stats.avgWait}m`}
          label="Avg Wait Time"
          sub="across all queues"
          tip={{
            title: "Average Wait Time",
            description: "Mean minutes from joining the queue to being served.",
            example: "Lower is better — aim under 10 minutes for walk-in venues.",
          }}
        />
        <BigStat
          icon={<Star className="w-5 h-5 text-warning" />}
          value={rating.count > 0 ? rating.avg : "—"}
          label="Satisfaction"
          sub={rating.count > 0 ? `${rating.count} review${rating.count === 1 ? "" : "s"}` : "no reviews yet"}
          tip={{
            title: "Satisfaction",
            description: "Average customer rating out of 5, calculated from real reviews left for your business. Shows a dash until your first review arrives.",
          }}
        />
      </div>

      <div className="mb-6">
        <AIInsights insight="analytics" mode="business" businessId={businessId} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 card-shadow">
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="font-semibold text-foreground">Weekly Visitors</h3>
            <InfoHint
              title="Weekly Visitors"
              description="Daily count of customers you served vs those who left the queue before being called."
              example="A growing gap between served and skipped suggests longer wait times are pushing people away."
            />
          </div>
          <p className="text-xs text-muted-foreground mb-4">Customers served vs skipped per day</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
              <Line type="monotone" dataKey="served" stroke="hsl(205 100% 50%)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="skipped" stroke="hsl(185 100% 45%)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-5 card-shadow">
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="font-semibold text-foreground">Queue Split</h3>
            <InfoHint
              title="Queue Split"
              description="Share of visitors across each of your queues in the selected period."
              example="Useful to see which queue (e.g. Dine-in vs Takeaway) drives most traffic."
            />
          </div>
          <p className="text-xs text-muted-foreground mb-4">Distribution by queue</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byQueue} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                {byQueue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3 text-xs">
            {byQueue.length === 0 && <p className="text-muted-foreground text-center py-4">No queue data yet</p>}
            {byQueue.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /> {s.name}</span>
                <span className="font-semibold text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-5 card-shadow">
        <div className="flex items-center gap-1.5 mb-1">
          <h3 className="font-semibold text-foreground">Hourly Traffic</h3>
          <InfoHint
            title="Hourly Traffic"
            description="Number of customers joining your queues at each hour of the day."
            example="Tall bars reveal your rush hours — staff up before them."
          />
        </div>
        <p className="text-xs text-muted-foreground mb-4">Peak hours throughout the day</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={hourly}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
            <Bar dataKey="visitors" fill="hsl(205 100% 50%)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6">
        <PeakHourHeatmap visitors={rawVisitors} />
      </div>
    </div>
  );
};

const BigStat = ({
  icon,
  value,
  label,
  sub,
  trend,
  trendLabel,
  tip,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  sub?: string;
  trend?: number;
  trendLabel?: string;
  tip?: { title?: string; description: string; example?: string };
}) => (
  <div className="bg-card rounded-2xl p-5 card-shadow flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="opacity-80">{icon}</span>
      {trend !== undefined && <TrendBadge value={trend} label={trendLabel} />}
    </div>
    <p className="text-[2rem] md:text-[2.25rem] leading-none font-extrabold tabular-nums tracking-tight text-foreground">
      {value}
    </p>
    <div className="flex items-center gap-1.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">{label}</p>
      {tip && <InfoHint {...tip} ariaLabel={`About ${label}`} />}
    </div>
    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
  </div>
);

export default Analytics;
