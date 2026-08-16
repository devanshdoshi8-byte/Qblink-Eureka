import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, UtensilsCrossed, Loader2, Plus, Minus, ArrowRight, ArrowLeft } from "lucide-react";
import logo from "@/assets/qblink-logo.png";
import { supportsPickup } from "@/lib/categories";
import PrefillNotice from "@/components/PrefillNotice";
import { hapticSuccess } from "@/lib/haptics";

interface Business {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
}

interface MenuRow { id: string; name: string; price: number; prep: number; description?: string | null }

const SAMPLE_MENU: MenuRow[] = [
  { id: "m1", name: "Signature Burger", price: 220, prep: 8 },
  { id: "m2", name: "Margherita Pizza", price: 320, prep: 14 },
  { id: "m3", name: "Crispy Fries", price: 120, prep: 5 },
  { id: "m4", name: "Cold Coffee", price: 140, prep: 3 },
  { id: "m5", name: "Veg Wrap", price: 180, prep: 6 },
  { id: "m6", name: "Brownie Sundae", price: 160, prep: 4 },
];

const PickupOrder = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [activeOrders, setActiveOrders] = useState(0);
  const [menu, setMenu] = useState<MenuRow[]>(SAMPLE_MENU);
  const [pickupBlocked, setPickupBlocked] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  const isUuid = (v: string | undefined) =>
    !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      if (isUuid(businessId)) {
        const { data } = await supabase.from("businesses").select("id,name,category,address").eq("id", businessId).maybeSingle();
        if (data) {
          setBusiness(data as Business);
          if (!supportsPickup(data.category)) setPickupBlocked(true);
        }
        const { data: activeCount } = await (supabase as any).rpc("get_active_pickup_count", { p_business_id: businessId });
        setActiveOrders(typeof activeCount === "number" ? activeCount : 0);

        const { data: rows } = await supabase
          .from("menu_items")
          .select("id,name,price,prep_minutes,description,is_available,sort_order")
          .eq("business_id", businessId)
          .eq("is_available", true)
          .order("sort_order", { ascending: true });
        if (rows && rows.length > 0) {
          setMenu(rows.map(r => ({ id: r.id, name: r.name, price: Number(r.price), prep: r.prep_minutes, description: r.description })));
        }
      } else {
        // Demo business — synthesise a friendly state.
        setBusiness({ id: businessId, name: "Demo Restaurant", category: "Restaurant", address: "Sample address" });
        setActiveOrders(3);
      }
      setLoading(false);
    })();
  }, [businessId]);

  // Prefill name/phone from previous session — collect once, never repeat
  useEffect(() => {
    try {
      if (localStorage.getItem("qb_prefill_optout") === "1") return;
      const n = localStorage.getItem("qb_visitor_name");
      const p = localStorage.getItem("qb_visitor_phone");
      if (n) setName(n);
      if (p) setPhone(p);
      if (n || p) setPrefilled(true);
    } catch {}
  }, []);

  const items = useMemo(() => menu.filter(m => (qty[m.id] ?? 0) > 0).map(m => ({ ...m, qty: qty[m.id] })), [qty, menu]);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const baseTime = items.reduce((s, i) => Math.max(s, i.prep), 0);
  const loadFactor = 1 + Math.min(activeOrders, 8) * 0.15;
  const eta = items.length === 0 ? 0 : Math.max(8, Math.round(baseTime * loadFactor + items.length * 1.2));

  const bump = (id: string, d: number) =>
    setQty(q => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) + d) }));

  const placeOrder = async () => {
    if (!business || items.length === 0 || !name.trim() || !phone.trim()) {
      toast.error("Add at least one item, your name and phone");
      return;
    }
    try {
      if (localStorage.getItem("qb_prefill_optout") !== "1") {
        localStorage.setItem("qb_visitor_name", name.trim());
        localStorage.setItem("qb_visitor_phone", phone.trim());
      }
    } catch {}
    if (!isUuid(businessId)) {
      // Demo mode — simulate without DB write.
      hapticSuccess();
      toast.success(`Order placed — token P-${Math.floor(Math.random() * 900 + 100)} (demo)`);
      navigate("/customer-dashboard");
      return;
    }
    setSubmitting(true);
    const token = `P-${Math.floor(Math.random() * 900 + 100)}`;
    const orderId = crypto.randomUUID();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("pickup_orders")
      .insert({
        id: orderId,
        business_id: business.id,
        customer_user_id: user?.id ?? null,
        customer_name: name.trim(),
        customer_phone: phone.trim() || null,
        token,
        items,
        notes: notes.trim() || null,
        eta_minutes: eta,
        status: "received",
      });
    setSubmitting(false);
    if (error) {
      toast.error("Could not place order");
      return;
    }
    hapticSuccess();
    toast.success(`Order placed — token ${token}`);
    navigate(`/pickup/track/${orderId}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!business) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Restaurant not found</div>;
  if (pickupBlocked) return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div className="max-w-sm">
        <UtensilsCrossed className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="font-bold text-foreground mb-1">Pickup not available</p>
        <p className="text-sm text-muted-foreground">Pickup ordering is only offered for restaurants and cafes.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen soft-bg pb-32">
      <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
          aria-label="Go back"
          className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <Link to="/" className="shrink-0">
          <img src={logo} alt="Qblink" className="h-9 w-9 rounded-lg object-contain" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-foreground truncate">{business.name}</p>
          <p className="text-xs text-muted-foreground truncate">{business.address || "Pickup order"}</p>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-card rounded-2xl card-shadow p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Live prep time</p>
            <p className="font-bold text-foreground">
              {items.length === 0 ? "Pick items to see ETA" : `~${eta} min`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="font-bold text-foreground">{activeOrders}</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl card-shadow p-4">
          <p className="font-bold text-foreground mb-3 flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-primary" /> Menu
          </p>
          <div className="divide-y divide-border">
            {menu.map(m => {
              const q = qty[m.id] ?? 0;
              return (
                <div key={m.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">₹{m.price} · ~{m.prep} min</p>
                    {m.description && <p className="text-[11px] text-muted-foreground mt-0.5">{m.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => bump(m.id, -1)} disabled={q === 0} className="w-8 h-8 rounded-lg bg-muted text-foreground disabled:opacity-40 flex items-center justify-center"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="w-6 text-center text-sm font-bold">{q}</span>
                    <button onClick={() => bump(m.id, 1)} className="w-8 h-8 rounded-lg gradient-bg text-primary-foreground flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card rounded-2xl card-shadow p-4 space-y-3">
          <PrefillNotice
            visible={prefilled}
            onClear={() => { setName(""); setPhone(""); setPrefilled(false); }}
            onUpdate={(n, p) => { setName(n); setPhone(p); setPrefilled(true); }}
          />
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="Your name *" className="w-full px-4 py-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone *" className="w-full px-4 py-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes for kitchen (optional)" rows={2} className="w-full px-4 py-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-card border-t border-border p-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-bold text-foreground">₹{total} · {items.reduce((s, i) => s + i.qty, 0)} items</p>
          </div>
          <button onClick={placeOrder} disabled={submitting || items.length === 0 || !name.trim() || !phone.trim()} className="gradient-bg text-primary-foreground px-5 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Confirm <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PickupOrder;