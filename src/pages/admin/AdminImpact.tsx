import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { HeartPulse, Clock, Users, Building2, Activity, Stethoscope, Landmark } from "lucide-react";

const AdminImpact = () => {
  const [m, setM] = useState({ totalHours: 0, totalServed: 0, businesses: 0, customers: 0, queues: 0, healthcare: 0, government: 0 });

  useEffect(() => {
    (async () => {
      const [v, b, c, q, hc, gov] = await Promise.all([
        supabase.from("queue_visitors").select("joined_at, served_at, called_at", { count: "exact" }).eq("status", "served").not("served_at", "is", null),
        supabase.from("businesses").select("id", { count: "exact", head: true }),
        supabase.from("customer_profiles").select("id", { count: "exact", head: true }),
        supabase.from("queues").select("id", { count: "exact", head: true }),
        supabase.from("businesses").select("id", { count: "exact", head: true }).ilike("category", "%clinic%"),
        supabase.from("businesses").select("id", { count: "exact", head: true }).ilike("category", "%government%"),
      ]);
      const visitors = v.data || [];
      const totalMinutes = visitors.reduce((s, x: any) => {
        if (!x.joined_at || !x.served_at) return s;
        return s + (new Date(x.served_at).getTime() - new Date(x.joined_at).getTime()) / 60000;
      }, 0);
      const physicalEstimate = totalMinutes * 0.6; // assume 60% would have been physical wait
      setM({
        totalHours: Math.round(physicalEstimate / 60),
        totalServed: v.count || 0,
        businesses: b.count || 0,
        customers: c.count || 0,
        queues: q.count || 0,
        healthcare: hc.count || 0,
        government: gov.count || 0,
      });
    })();
  }, []);

  const cards = [
    { label: "Hours of physical waiting avoided", value: m.totalHours.toLocaleString(), icon: Clock, color: "from-warning to-warning" },
    { label: "Customers served", value: m.totalServed.toLocaleString(), icon: Users, color: "from-info to-info" },
    { label: "Businesses onboarded", value: m.businesses.toLocaleString(), icon: Building2, color: "from-success to-primary" },
    { label: "Active queues", value: m.queues.toLocaleString(), icon: Activity, color: "from-primary to-primary" },
    { label: "Healthcare queues", value: m.healthcare.toLocaleString(), icon: Stethoscope, color: "from-danger to-danger" },
    { label: "Government queues", value: m.government.toLocaleString(), icon: Landmark, color: "from-muted-foreground to-muted-foreground" },
  ];

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center gap-3"><HeartPulse className="w-6 h-6 text-primary" />
        <div><h1 className="text-2xl md:text-3xl font-bold text-foreground">Public Health Impact</h1>
          <p className="text-sm text-muted-foreground">Live social-impact metrics demonstrating Qblink's contribution.</p></div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-card rounded-2xl p-5 card-shadow">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-3`}><Icon className="w-5 h-5 text-white" /></div>
              <p className="text-3xl font-extrabold text-foreground tabular-nums">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
};

export default AdminImpact;