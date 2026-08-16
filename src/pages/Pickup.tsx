import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/business/BusinessLayout";
import { toast } from "sonner";
import { ChefHat, Bell, PackageCheck, CheckCircle2, QrCode, ArrowRight, Loader2 } from "lucide-react";
import { publicUrl } from "@/lib/publicUrl";
import AIInsights from "@/components/AIInsights";

interface Order {
  id: string;
  token: string;
  customer_name: string;
  customer_phone: string | null;
  items: { name: string; qty: number; price: number }[];
  notes: string | null;
  status: string;
  eta_minutes: number;
  created_at: string;
}

const COLUMNS = [
  { key: "received", label: "Received", icon: CheckCircle2, next: "preparing", nextLabel: "Start preparing" },
  { key: "preparing", label: "Preparing", icon: ChefHat, next: "almost_ready", nextLabel: "Almost ready" },
  { key: "almost_ready", label: "Almost Ready", icon: Bell, next: "ready", nextLabel: "Mark ready" },
  { key: "ready", label: "Ready for Pickup", icon: PackageCheck, next: "picked_up", nextLabel: "Handed over" },
];

const Pickup = () => {
  return (
    <BusinessLayout>
      {(business) => <PickupBoard businessId={business.id} businessName={business.name} />}
    </BusinessLayout>
  );
};

const PickupBoard = ({ businessId, businessName }: { businessId: string; businessName: string }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("pickup_orders")
      .select("*")
      .eq("business_id", businessId)
      .neq("status", "picked_up")
      .order("created_at", { ascending: true });
    setOrders((data ?? []) as unknown as Order[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`biz-pickup-${businessId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pickup_orders", filter: `business_id=eq.${businessId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [businessId]);

  const advance = async (o: Order, next: string) => {
    const patch: { status: string; ready_at?: string; picked_up_at?: string } = { status: next };
    if (next === "ready") patch.ready_at = new Date().toISOString();
    if (next === "picked_up") patch.picked_up_at = new Date().toISOString();
    const { error } = await supabase.from("pickup_orders").update(patch).eq("id", o.id);
    if (error) { toast.error("Could not update"); return; }
    await supabase.from("pickup_status_events").insert({ order_id: o.id, status: next });
    toast.success(`${o.token} → ${next.replace("_", " ")}`);
  };

  const todayCount = orders.length;
  const readyCount = orders.filter(o => o.status === "ready").length;
  const cookingCount = orders.filter(o => ["preparing", "almost_ready"].includes(o.status)).length;

  const pickupUrl = publicUrl(`/pickup/${businessId}`);

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pickup Board</h1>
          <p className="text-sm text-muted-foreground">Live takeaway orders for {businessName}</p>
        </div>
        <a href={pickupUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted">
          <QrCode className="w-3.5 h-3.5 text-primary" /> Customer link
        </a>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Active" value={todayCount} />
        <Stat label="Cooking" value={cookingCount} />
        <Stat label="Ready" value={readyCount} />
      </div>

      <div className="mb-6">
        <AIInsights insight="pickup" mode="business" businessId={businessId} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map(col => {
            const Icon = col.icon;
            const colOrders = orders.filter(o => o.status === col.key);
            return (
              <div key={col.key} className="bg-card rounded-2xl card-shadow p-4 min-h-[200px]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground text-sm flex-1">{col.label}</p>
                  <span className="text-xs font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5">{colOrders.length}</span>
                </div>
                <div className="space-y-2">
                  {colOrders.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No orders</p>}
                  {colOrders.map(o => {
                    const ageMin = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000);
                    return (
                      <div key={o.id} className="bg-muted/50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-foreground text-sm">{o.token}</span>
                          <span className="text-xs text-muted-foreground">{ageMin}m</span>
                        </div>
                        <p className="text-xs text-foreground font-medium mb-1 truncate">{o.customer_name}</p>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {o.items?.map(i => `${i.qty}× ${i.name}`).join(", ")}
                        </p>
                        {o.notes && <p className="text-[10px] text-muted-foreground italic mb-2">"{o.notes}"</p>}
                        <button onClick={() => advance(o, col.next)} className="w-full gradient-bg text-primary-foreground rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1">
                          {col.nextLabel} <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-card rounded-xl card-shadow p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-xl font-bold text-foreground">{value}</p>
  </div>
);

export default Pickup;