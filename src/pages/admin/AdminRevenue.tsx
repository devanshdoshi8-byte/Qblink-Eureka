import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { SkeletonPageHeader, SkeletonStatGrid, SkeletonChartCard } from "@/components/skeletons/DashboardSkeletons";
import { DollarSign, TrendingUp, Crown, Users, Info } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from "recharts";

const COLORS = ["hsl(220 10% 65%)", "hsl(205 100% 50%)", "hsl(185 100% 45%)", "hsl(280 70% 60%)"];
const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const AdminRevenue = () => {
  const [businesses, setBusinesses] = useState<{ id: string; name: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("businesses").select("id, name, created_at");
    setBusinesses(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-revenue")
      .on("postgres_changes", { event: "*", schema: "public", table: "businesses" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // No subscription/billing system is wired up yet, so every business is on the
  // free tier. Numbers below reflect the platform's true monetisation state.
  const total = businesses.length;
  const free = total;
  const paid = 0;
  const enterprise = 0;
  const mrr = 0;
  const totalRev = 0;
  const enterpriseRev = 0;

  // Real growth of (free-tier) businesses across the last 12 months
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const m = subMonths(new Date(), 11 - i);
    const end = startOfMonth(subMonths(new Date(), 10 - i)).getTime();
    const count = businesses.filter(b => new Date(b.created_at).getTime() < end).length;
    return { m: format(m, "MMM"), rev: 0, businesses: count };
  });

  const plans = [
    { plan: "Free", value: 0, count: free },
    { plan: "Starter", value: 0, count: 0 },
    { plan: "Pro", value: 0, count: 0 },
    { plan: "Enterprise", value: 0, count: 0 },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <SkeletonPageHeader />
        <SkeletonStatGrid count={4} className="mb-6" />
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <SkeletonChartCard wide />
          <SkeletonChartCard height={260} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Revenue</h1>
        <p className="text-sm text-muted-foreground mt-1">Plan performance and platform monetisation</p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 flex gap-3 items-start text-sm">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-foreground">Monetisation not yet enabled</p>
          <p className="text-muted-foreground mt-0.5">Billing and subscription plans are not connected. All {total} businesses are on the free tier — figures below show the platform's true state.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Big icon={<DollarSign className="w-4 h-4 text-success" />} label="Total Revenue" value={fmt(totalRev)} sub="No billing wired" />
        <Big icon={<TrendingUp className="w-4 h-4 text-primary" />} label="Monthly Recurring" value={fmt(mrr)} sub="—" />
        <Big icon={<Users className="w-4 h-4 text-primary" />} label="Paid Businesses" value={paid} sub={`${free} on free`} />
        <Big icon={<Crown className="w-4 h-4 text-warning" />} label="Enterprise" value={`${enterprise} clients`} sub={fmt(enterpriseRev)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card title="Business Growth" subtitle="Cumulative businesses on the platform" wide>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160 70% 50%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(160 70% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
              <Area type="monotone" dataKey="businesses" stroke="hsl(160 70% 50%)" fill="url(#rev)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Free vs Paid" subtitle="Business plan split">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[{ name: "Free", value: free }, { name: "Paid", value: paid || 0.0001 }]}
                dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}
              >
                <Cell fill="hsl(220 10% 65%)" />
                <Cell fill="hsl(205 100% 50%)" />
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-xs space-y-1.5 mt-3">
            <div className="flex items-center justify-between"><span className="text-muted-foreground flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/60" /> Free</span><span className="font-semibold text-foreground">{free}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Paid</span><span className="font-semibold text-foreground">{paid}</span></div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Revenue by Plan" subtitle="Contribution per pricing tier">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={plans}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="plan" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }}
                formatter={(v: any) => fmt(v)}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {plans.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div className="bg-card rounded-2xl card-shadow p-5">
          <h3 className="font-semibold text-foreground">Plan Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-4">Active subscriptions and revenue per plan</p>
          <div className="divide-y divide-border">
            {plans.map(p => (
              <div key={p.plan} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold text-foreground">{p.plan}</p>
                  <p className="text-xs text-muted-foreground">{p.count} businesses</p>
                </div>
                <p className="font-bold text-foreground">{fmt(p.value)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const Big = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) => (
  <div className="bg-card rounded-2xl p-4 card-shadow">
    <div className="flex items-center justify-between mb-2">
      <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">{icon}</span>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    {sub && <p className="text-[11px] text-success mt-1">{sub}</p>}
  </div>
);

const Card = ({ title, subtitle, children, wide }: { title: string; subtitle: string; children: React.ReactNode; wide?: boolean }) => (
  <div className={`bg-card rounded-2xl p-5 card-shadow ${wide ? "lg:col-span-2" : ""}`}>
    <h3 className="font-semibold text-foreground">{title}</h3>
    <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
    {children}
  </div>
);

export default AdminRevenue;
