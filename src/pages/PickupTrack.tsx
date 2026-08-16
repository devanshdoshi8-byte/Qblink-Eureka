import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, ChefHat, Bell, PackageCheck, Clock } from "lucide-react";
import logo from "@/assets/qblink-logo.png";
import AIInsights from "@/components/AIInsights";

interface Order {
  id: string;
  business_id: string;
  token: string;
  items: { name: string; qty: number; price: number }[];
  notes: string | null;
  status: string;
  eta_minutes: number;
  created_at: string;
  ready_at: string | null;
  picked_up_at: string | null;
}

const STAGES = [
  { key: "received", label: "Received", icon: CheckCircle2 },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "almost_ready", label: "Almost Ready", icon: Bell },
  { key: "ready", label: "Ready for Pickup", icon: PackageCheck },
];

const PickupTrack = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [businessName, setBusinessName] = useState("");

  useEffect(() => {
    if (!orderId) return;
    let businessLoaded = false;
    const load = async () => {
      // Secure lookup by unguessable order id — excludes customer phone number
      const { data } = await (supabase as any).rpc("get_pickup_order", { p_order_id: orderId });
      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        setOrder(row as Order);
        if (!businessLoaded) {
          businessLoaded = true;
          const { data: b } = await supabase.from("businesses").select("name").eq("id", row.business_id).maybeSingle();
          setBusinessName(b?.name ?? "");
        }
      }
    };
    load();
    const poll = setInterval(load, 5000);
    return () => clearInterval(poll);
  }, [orderId]);

  if (!order) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const stageIdx = STAGES.findIndex(s => s.key === order.status);
  const isDone = order.status === "picked_up";
  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000));
  const remaining = Math.max(0, order.eta_minutes - elapsed);

  return (
    <div className="min-h-screen soft-bg">
      <header className="bg-card border-b border-border px-4 py-4 flex items-center gap-3">
        <img src={logo} alt="Qblink" className="h-9 w-9 rounded-lg object-contain" />
        <div>
          <p className="font-bold text-foreground">{businessName}</p>
          <p className="text-xs text-muted-foreground">Pickup order · {order.token}</p>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-card rounded-3xl card-shadow p-6 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Your token</p>
          <p className="text-5xl font-bold text-primary mb-3">{order.token}</p>
          {isDone ? (
            <p className="text-sm text-foreground font-semibold">Order completed — enjoy!</p>
          ) : order.status === "ready" ? (
            <div className="bg-primary/10 text-primary rounded-2xl p-3 text-sm font-semibold">Pickup now — your order is ready</div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>~{remaining} min remaining</span>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl card-shadow p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Status</p>
          <div className="space-y-3">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              const reached = isDone || i <= stageIdx;
              const current = !isDone && i === stageIdx;
              return (
                <div key={s.key} className={`flex items-center gap-3 ${reached ? "" : "opacity-40"}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${current ? "gradient-bg text-primary-foreground" : reached ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{s.label}</p>
                    {current && <p className="text-xs text-primary">In progress</p>}
                  </div>
                  {reached && !current && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
              );
            })}
          </div>
        </div>

        <AIInsights
          insight="customer_pickup"
          mode="customer"
          payload={{ status: order.status, eta: order.eta_minutes, elapsed, itemCount: order.items?.length ?? 0 }}
          compact
        />

        <div className="bg-card rounded-2xl card-shadow p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Order</p>
          <div className="space-y-2">
            {order.items?.map((it, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-foreground">{it.qty}× {it.name}</span>
                <span className="text-muted-foreground">₹{it.price * it.qty}</span>
              </div>
            ))}
          </div>
          {order.notes && <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">Note: {order.notes}</p>}
        </div>

        <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-foreground py-2">Back to Qblink</Link>
      </div>
    </div>
  );
};

export default PickupTrack;