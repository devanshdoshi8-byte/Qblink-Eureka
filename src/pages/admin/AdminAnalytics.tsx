import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { SkeletonPageHeader, SkeletonStatGrid, SkeletonChartCard } from "@/components/skeletons/DashboardSkeletons";
import { format, startOfDay, subDays } from "date-fns";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from "recharts";

const COLORS = ["hsl(205 100% 50%)", "hsl(185 100% 45%)", "hsl(160 70% 50%)", "hsl(280 70% 60%)", "hsl(35 90% 55%)", "hsl(340 75% 55%)"];

const AdminAnalytics = () => {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [category, setCategory] = useState("All");
  const [visitors, setVisitors] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const since = startOfDay(subDays(new Date(), days)).toISOString();
    const [v, b, q, c] = await Promise.all([
      supabase.from("queue_visitors").select("queue_id, status, joined_at, served_at, visitor_name, phone").gte("joined_at", since),
      supabase.from("businesses").select("id, name, category, created_at"),
      supabase.from("queues").select("id, business_id, status"),
      supabase.from("customer_profiles").select("user_id, created_at"),
    ]);
    setVisitors(v.data || []);
    setBusinesses(b.data || []);
    setQueues(q.data || []);
    setCustomers(c.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-analytics")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "queue_live_signals" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "businesses" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "queues" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [range]);

  const queueBiz = useMemo(() => new Map(queues.map(q => [q.id, q.business_id])), [queues]);
  const bizCat = useMemo(() => new Map(businesses.map(b => [b.id, b.category || "Other"])), [businesses]);

  const scoped = useMemo(() => {
    if (category === "All") return visitors;
    return visitors.filter(v => bizCat.get(queueBiz.get(v.queue_id) as string) === category);
  }, [visitors, category, queueBiz, bizCat]);

  const today0 = startOfDay(new Date()).getTime();
  const vToday = scoped.filter(v => new Date(v.joined_at).getTime() >= today0);
  const served = scoped.filter(v => v.status === "served");
  const dropped = scoped.filter(v => v.status === "skipped" || v.status === "removed" || v.status === "no_show");
  const waitTimes = served.filter(v => v.served_at).map(v => (new Date(v.served_at).getTime() - new Date(v.joined_at).getTime()) / 60000);
  const avgWait = waitTimes.length ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;
  const completion = scoped.length ? Math.round((served.length / scoped.length) * 100) : 0;
  const dropOff = scoped.length ? +((dropped.length / scoped.length) * 100).toFixed(1) : 0;

  // Daily active sets
  const todayBiz = new Set(vToday.map(v => queueBiz.get(v.queue_id)).filter(Boolean));
  const phoneSet = new Set(vToday.map(v => (v.phone || v.visitor_name)).filter(Boolean));

  // Repeat usage: customers with 2+ visits in range, by phone/name
  const counts: Record<string, number> = {};
  scoped.forEach(v => {
    const k = v.phone || v.visitor_name;
    if (!k) return;
    counts[k] = (counts[k] || 0) + 1;
  });
  const repeaters = Object.values(counts).filter(n => n > 1).length;
  const uniques = Object.keys(counts).length;
  const repeatPct = uniques ? Math.round((repeaters / uniques) * 100) : 0;

  // Growth: weekly buckets across the selected range
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const buckets = range === "7d" ? 7 : range === "30d" ? 4 : 12;
  const bucketDays = days / buckets;
  const growth = Array.from({ length: buckets }, (_, i) => {
    const start = subDays(new Date(), days - i * bucketDays).getTime();
    const end = subDays(new Date(), days - (i + 1) * bucketDays).getTime();
    return {
      week: `W${i + 1}`,
      customers: customers.filter(c => new Date(c.created_at).getTime() < end).length,
      businesses: businesses.filter(b => new Date(b.created_at).getTime() < end).length,
    };
  });

  // Daily queue count
  const dailyMap: Record<string, { queues: Set<string>; served: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const k = format(subDays(new Date(), i), "EEE");
    dailyMap[k] = { queues: new Set(), served: 0 };
  }
  scoped.forEach(v => {
    const k = format(new Date(v.joined_at), "EEE");
    if (!dailyMap[k]) return;
    dailyMap[k].queues.add(v.queue_id);
    if (v.status === "served") dailyMap[k].served++;
  });
  const dailyActivity = Object.entries(dailyMap).map(([day, x]) => ({ day, queues: x.queues.size, served: x.served }));

  // Hourly
  const hourMap: Record<number, number> = {};
  for (let h = 9; h <= 20; h++) hourMap[h] = 0;
  scoped.forEach(v => {
    const h = new Date(v.joined_at).getHours();
    if (hourMap[h] !== undefined) hourMap[h]++;
  });
  const hourly = Object.entries(hourMap).map(([hour, visitors]) => ({ hour, visitors }));

  // Categories share
  const catMap: Record<string, number> = {};
  businesses.forEach(b => { catMap[b.category || "Other"] = (catMap[b.category || "Other"] || 0) + 1; });
  const categories = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  // Retention (week over week unique repeat phone/names)
  const retention = Array.from({ length: Math.min(7, buckets) }, (_, i) => {
    const start = subDays(new Date(), days - i * bucketDays).getTime();
    const end = subDays(new Date(), days - (i + 1) * bucketDays).getTime();
    const slice = scoped.filter(v => {
      const t = new Date(v.joined_at).getTime();
      return t >= start && t < end;
    });
    const cMap: Record<string, number> = {};
    slice.forEach(v => {
      const k = v.phone || v.visitor_name;
      if (k) cMap[k] = (cMap[k] || 0) + 1;
    });
    const u = Object.keys(cMap).length;
    const r = Object.values(cMap).filter(n => n > 1).length;
    return { week: `W${i + 1}`, rate: u ? Math.round((r / u) * 100) : 0 };
  });

  const waiting = scoped.filter(v => v.status === "waiting" || v.status === "called").length;
  const servedVsWaiting = [
    { name: "Served", value: served.length },
    { name: "Waiting", value: waiting },
  ];

  const allCategories = Array.from(new Set(businesses.map(b => b.category || "Other")));

  if (loading) {
    return (
      <AdminLayout>
        <SkeletonPageHeader />
        <SkeletonStatGrid count={8} className="mb-6 md:grid-cols-4" />
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <SkeletonChartCard wide />
          <SkeletonChartCard height={260} />
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <SkeletonChartCard height={240} />
          <SkeletonChartCard height={240} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Platform Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Deep insights across every business and customer</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-1.5 rounded-xl bg-card border border-border text-sm">
            <option>All</option>
            {allCategories.map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="flex gap-1 bg-card rounded-xl p-1 card-shadow">
            {(["7d", "30d", "90d"] as const).map(r => (
              <button key={r} onClick={() => setRange(r)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${
                range === r ? "gradient-bg text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
                {r === "7d" ? "Week" : r === "30d" ? "Month" : "90 days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Platform visitors" value={scoped.length.toLocaleString()} sub={`Last ${range}`} />
        <Stat label="Total served" value={served.length.toLocaleString()} sub={`${completion}% completion`} />
        <Stat label="Avg wait time" value={`${avgWait}m`} sub="Across served" />
        <Stat label="Daily active businesses" value={todayBiz.size.toString()} sub="Today" />
        <Stat label="Daily active customers" value={phoneSet.size.toString()} sub="Today" />
        <Stat label="Queue completion rate" value={`${completion}%`} />
        <Stat label="Drop-off rate" value={`${dropOff}%`} />
        <Stat label="Repeat usage" value={`${repeatPct}%`} sub={`${repeaters} of ${uniques} unique`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card title="Growth Over Time" subtitle="Customers + businesses joining" wide>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={growth}>
              <defs>
                <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(205 100% 50%)" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(205 100% 50%)" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
              <Area type="monotone" dataKey="customers" stroke="hsl(205 100% 50%)" fill="url(#ag1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Served vs Waiting" subtitle="Today">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={servedVsWaiting} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                {servedVsWaiting.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3 text-xs">
            {servedVsWaiting.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} /> {s.name}</span>
                <span className="font-semibold text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card title="Daily Queue Count" subtitle="Queues opened per day">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
              <Bar dataKey="queues" fill="hsl(185 100% 45%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Peak Hours" subtitle="Visitors by hour of day">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
              <Bar dataKey="visitors" fill="hsl(205 100% 50%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Business Categories" subtitle="Distribution across the platform">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categories} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Customer Retention" subtitle="Returning customer rate">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={retention}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
              <Line type="monotone" dataKey="rate" stroke="hsl(160 70% 50%)" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </AdminLayout>
  );
};

const Stat = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="bg-card rounded-2xl p-4 card-shadow">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    {sub && <p className="text-[11px] text-success mt-0.5">{sub}</p>}
  </div>
);

const Card = ({ title, subtitle, children, wide }: { title: string; subtitle: string; children: React.ReactNode; wide?: boolean }) => (
  <div className={`bg-card rounded-2xl p-5 card-shadow ${wide ? "lg:col-span-2" : ""}`}>
    <h3 className="font-semibold text-foreground">{title}</h3>
    <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
    {children}
  </div>
);

export default AdminAnalytics;
