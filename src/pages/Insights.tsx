import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/business/BusinessLayout";
import {
  Users, Clock, Timer, Hourglass, CheckCircle2, UserX, SkipForward,
  Flame, HeartPulse, Wrench, Repeat, RefreshCw,
  Eye, MousePointerClick, CalendarCheck, MessageCircleOff, Headphones,
  Utensils, TrendingUp, Sparkles,
  Lightbulb, PlusCircle, Scale, AlertTriangle, ArrowUpRight,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { format, subDays, startOfDay, differenceInMinutes } from "date-fns";
import {
  SkeletonStatGrid,
  SkeletonChartCard,
} from "@/components/skeletons/DashboardSkeletons";
import RestaurantAnalytics from "@/components/business/RestaurantAnalytics";

const Insights = () => (
  <BusinessLayout>
    {(b) => <InsightsContent businessId={b.id} category={b.category} />}
  </BusinessLayout>
);

interface Visitor {
  id: string;
  queue_id: string;
  status: string;
  joined_at: string;
  called_at: string | null;
  served_at: string | null;
  phone: string | null;
  checked_in_at?: string | null;
}

interface EngagementEvent {
  event_type: "page_view" | "refresh" | "status_check";
  created_at: string;
}

const RESTAURANT_CATEGORIES = ["restaurant", "cafe", "food", "bar", "bistro"];
const isRestaurant = (cat: string | null) =>
  !!cat && RESTAURANT_CATEGORIES.some((k) => cat.toLowerCase().includes(k));

const InsightsContent = ({
  businessId,
  category,
}: {
  businessId: string;
  category: string | null;
}) => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [engagement, setEngagement] = useState<EngagementEvent[]>([]);
  const [health, setHealth] = useState<{ score: number; band: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date());

  const fetchAll = useCallback(async () => {
    const { data: queues } = await supabase
      .from("queues").select("id").eq("business_id", businessId);
    const queueIds = (queues || []).map((q: any) => q.id);
    if (queueIds.length === 0) {
      setVisitors([]); setHealth(null); setLoading(false); return;
    }
    const since = subDays(new Date(), 30).toISOString();
    const { data: v } = await supabase
      .from("queue_visitors")
      .select("id,queue_id,status,joined_at,called_at,served_at,phone,checked_in_at")
      .in("queue_id", queueIds)
      .gte("joined_at", since)
      .order("joined_at", { ascending: false });
    setVisitors((v || []) as Visitor[]);

    const { data: ev } = await (supabase as any)
      .from("queue_engagement_events")
      .select("event_type,created_at")
      .eq("business_id", businessId)
      .gte("created_at", since)
      .order("created_at", { ascending: false });
    setEngagement((ev || []) as EngagementEvent[]);

    const { data: h } = await (supabase as any).rpc("get_business_health", {
      p_business_id: businessId, p_days: 7,
    });
    if (h && h.length) setHealth({ score: Number(h[0].score), band: h[0].band });
    else setHealth(null);

    setRefreshedAt(new Date());
    setLoading(false);
  }, [businessId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const channel = supabase
      .channel(`insights-${businessId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "queue_live_signals" },
        () => fetchAll())
      .subscribe();
    const poll = setInterval(fetchAll, 30000);
    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [businessId, fetchAll]);

  const stats = useMemo(() => {
    const startToday = startOfDay(new Date()).getTime();
    const today = visitors.filter(v => new Date(v.joined_at).getTime() >= startToday);

    const waiting = visitors.filter(v => v.status === "waiting" || v.status === "checked_in").length;
    const servedToday = today.filter(v => v.status === "served");
    const noShowToday = today.filter(v => v.status === "no_show").length;
    const skippedToday = today.filter(v => v.status === "skipped").length;

    const waits = servedToday
      .filter(v => v.served_at)
      .map(v => differenceInMinutes(new Date(v.served_at!), new Date(v.joined_at)))
      .filter(n => Number.isFinite(n) && n >= 0 && n < 600);
    const avgWait = waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0;
    const longestWait = waits.length ? Math.max(...waits) : 0;

    const services = servedToday
      .filter(v => v.called_at && v.served_at)
      .map(v => (new Date(v.served_at!).getTime() - new Date(v.called_at!).getTime()) / 60000)
      .filter(n => Number.isFinite(n) && n >= 0 && n < 300);
    const avgService = services.length ? Math.round(services.reduce((a, b) => a + b, 0) / services.length) : 0;

    // Busy hour today
    const hourBuckets: Record<number, number> = {};
    today.forEach(v => {
      const h = new Date(v.joined_at).getHours();
      hourBuckets[h] = (hourBuckets[h] || 0) + 1;
    });
    const busyEntry = Object.entries(hourBuckets).sort((a, b) => b[1] - a[1])[0];
    const busyHour = busyEntry ? `${busyEntry[0]}:00` : "—";

    // Returning customers (phones seen more than once in last 30 days)
    const phoneCounts: Record<string, number> = {};
    visitors.forEach(v => {
      if (v.phone) phoneCounts[v.phone] = (phoneCounts[v.phone] || 0) + 1;
    });
    const returning = Object.values(phoneCounts).filter(n => n > 1).length;

    return {
      todayTotal: today.length,
      waiting,
      avgWait,
      longestWait,
      served: servedToday.length,
      noShow: noShowToday,
      skipped: skippedToday,
      busyHour,
      avgService,
      returning,
    };
  }, [visitors]);

  const impact = useMemo(() => {
    const startToday = startOfDay(new Date()).getTime();
    const evToday = engagement.filter(e => new Date(e.created_at).getTime() >= startToday);
    const refreshes = evToday.filter(e => e.event_type === "refresh").length;
    const statusChecks = evToday.filter(e => e.event_type === "status_check").length;

    // Arriving on time: visitors who checked in before or shortly after being called
    const todayVisitors = visitors.filter(v => new Date(v.joined_at).getTime() >= startToday);
    const calledOrLater = todayVisitors.filter(v => v.called_at);
    const onTime = calledOrLater.filter(v => {
      if (!v.checked_in_at || !v.called_at) return false;
      const diffMin = (new Date(v.checked_in_at).getTime() - new Date(v.called_at).getTime()) / 60000;
      return diffMin <= 5; // within 5 minutes of being called
    }).length;
    const onTimeRate = calledOrLater.length
      ? Math.round((onTime / calledOrLater.length) * 100)
      : 0;

    // Estimate: each self-serve status check avoids ~1 reception question
    const questionsAvoided = statusChecks + refreshes;
    // Estimate: each avoided interaction saves reception ~30 seconds
    const minutesSaved = Math.round((questionsAvoided * 30) / 60);

    return { refreshes, statusChecks, onTime, onTimeRate, calledOrLater: calledOrLater.length, questionsAvoided, minutesSaved };
  }, [engagement, visitors]);

  const daily = useMemo(() => {
    // last 14 days hourly-ish? Keep clean: 14 days served vs joined
    const days: { day: string; joined: number; served: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const start = startOfDay(d).getTime();
      const end = start + 86400000;
      const dayVisitors = visitors.filter(v => {
        const t = new Date(v.joined_at).getTime();
        return t >= start && t < end;
      });
      days.push({
        day: format(d, "MMM d"),
        joined: dayVisitors.length,
        served: dayVisitors.filter(v => v.status === "served").length,
      });
    }
    return days;
  }, [visitors]);

  const weekly = useMemo(() => {
    // last 4 weeks
    const weeks: { week: string; visitors: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const end = subDays(new Date(), i * 7);
      const start = subDays(end, 7);
      const count = visitors.filter(v => {
        const t = new Date(v.joined_at).getTime();
        return t >= start.getTime() && t < end.getTime();
      }).length;
      weeks.push({ week: i === 0 ? "This week" : `${i}w ago`, visitors: count });
    }
    return weeks;
  }, [visitors]);

  const showRestaurant = isRestaurant(category);

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Business Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live view of your queues — updates automatically
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground bg-card px-3 py-2 rounded-xl card-shadow"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Updated {format(refreshedAt, "HH:mm:ss")}
        </button>
      </div>

      {loading ? (
        <>
          <SkeletonStatGrid count={8} className="mb-6 !grid-cols-2 md:!grid-cols-3 lg:!grid-cols-4" />
          <div className="grid lg:grid-cols-2 gap-4">
            <SkeletonChartCard height={240} />
            <SkeletonChartCard height={240} />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            <Stat icon={<Users className="w-4 h-4 text-primary" />} label="Today's Visitors" value={stats.todayTotal} />
            <Stat icon={<Hourglass className="w-4 h-4 text-info" />} label="Currently Waiting" value={stats.waiting} />
            <Stat icon={<Clock className="w-4 h-4 text-warning" />} label="Average Wait" value={`${stats.avgWait}m`} />
            <Stat icon={<Timer className="w-4 h-4 text-danger" />} label="Longest Wait Today" value={`${stats.longestWait}m`} />
            <Stat icon={<CheckCircle2 className="w-4 h-4 text-success" />} label="Customers Served" value={stats.served} />
            <Stat icon={<UserX className="w-4 h-4 text-danger" />} label="No Shows" value={stats.noShow} />
            <Stat icon={<SkipForward className="w-4 h-4 text-warning" />} label="Skipped" value={stats.skipped} />
            <Stat icon={<Flame className="w-4 h-4 text-warning" />} label="Busy Hour" value={stats.busyHour} />
            <Stat
              icon={<HeartPulse className="w-4 h-4 text-danger" />}
              label="Queue Health"
              value={health ? `${Math.round(health.score)}` : "—"}
              sub={health?.band}
            />
            <Stat icon={<Wrench className="w-4 h-4 text-info" />} label="Avg Service Time" value={`${stats.avgService}m`} />
            <Stat icon={<Repeat className="w-4 h-4 text-primary" />} label="Returning Customers" value={stats.returning} sub="last 30 days" />
          </div>

          <div className="mb-6">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Reception Impact</h2>
                <p className="text-xs text-muted-foreground">How self-serve queueing reduces reception workload today</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Stat
                icon={<MousePointerClick className="w-4 h-4 text-info" />}
                label="Refreshes"
                value={impact.refreshes}
                sub="customer self-checks"
              />
              <Stat
                icon={<Eye className="w-4 h-4 text-info" />}
                label="Status Checks"
                value={impact.statusChecks}
                sub="via waiting screen"
              />
              <Stat
                icon={<CalendarCheck className="w-4 h-4 text-success" />}
                label="Arrived On Time"
                value={impact.calledOrLater ? `${impact.onTimeRate}%` : "—"}
                sub={impact.calledOrLater ? `${impact.onTime} of ${impact.calledOrLater}` : "no data yet"}
              />
              <Stat
                icon={<MessageCircleOff className="w-4 h-4 text-primary" />}
                label="Questions Avoided"
                value={impact.questionsAvoided}
                sub="estimate"
              />
              <Stat
                icon={<Headphones className="w-4 h-4 text-primary" />}
                label="Workload Saved"
                value={`${impact.minutesSaved}m`}
                sub="reception time"
              />
            </div>
          </div>

          {showRestaurant && <RestaurantAnalytics businessId={businessId} />}

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-card rounded-2xl p-5 card-shadow">
              <h3 className="font-semibold text-foreground">Daily Trend</h3>
              <p className="text-xs text-muted-foreground mb-4">Visitors joined vs served — last 14 days</p>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
                  <Line type="monotone" dataKey="joined" stroke="hsl(205 100% 50%)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="served" stroke="hsl(160 70% 45%)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-2xl p-5 card-shadow">
              <h3 className="font-semibold text-foreground">Weekly Trend</h3>
              <p className="text-xs text-muted-foreground mb-4">Total visitors — last 4 weeks</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
                  <Bar dataKey="visitors" fill="hsl(205 100% 50%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Stat = ({
  icon, label, value, sub,
}: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) => (
  <div className="bg-card rounded-2xl p-4 card-shadow flex flex-col gap-1.5">
    <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {icon}
      <span className="truncate">{label}</span>
    </div>
    <p className="text-2xl font-extrabold tabular-nums tracking-tight text-foreground">{value}</p>
    {sub && <p className="text-[11px] text-muted-foreground capitalize">{sub}</p>}
  </div>
);


export default Insights;