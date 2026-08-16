import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Star, Users, Clock, X, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getOpenState } from "@/lib/operatingHours";

interface FavBiz {
  favorite_id: string;
  business_id: string;
  name: string;
  category: string | null;
  address: string | null;
  last_used_at: string;
  queue_id: string | null;
  queue_name: string | null;
  queue_status: string | null;
  est_time: number;
  waiting: number;
  show_live: boolean;
  remote_join: boolean;
  hours_status: "open" | "closed" | "holiday" | "unknown";
  hours_label: string;
}

const formatRecency = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

const FavoriteBusinesses = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<FavBiz[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    setLoading(true);

    const { data: favs } = await (supabase as any)
      .from("customer_favorites")
      .select("id, business_id, last_used_at")
      .eq("user_id", user.id)
      .order("last_used_at", { ascending: false });

    if (!favs || favs.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const bizIds = favs.map((f: any) => f.business_id);
    const { data: businesses } = await supabase
      .from("businesses")
      .select("id, name, category, address, show_live_queue_info, remote_joining_enabled, operating_hours")
      .in("id", bizIds);

    const { data: queues } = await supabase
      .from("queues")
      .select("id, business_id, name, status, estimated_service_time")
      .in("business_id", bizIds);

    const queueIds = (queues || []).map(q => q.id);
    let waitingByQueue: Record<string, number> = {};
    if (queueIds.length > 0) {
      const { data: visitors } = await (supabase as any)
        .from("queue_visitors_public")
        .select("queue_id, status")
        .in("queue_id", queueIds)
        .eq("status", "waiting");
      (visitors || []).forEach((v: any) => {
        waitingByQueue[v.queue_id] = (waitingByQueue[v.queue_id] || 0) + 1;
      });
    }

    const merged: FavBiz[] = favs.map((f: any) => {
      const b = (businesses || []).find(x => x.id === f.business_id);
      const bizQueues = (queues || []).filter(q => q.business_id === f.business_id);
      const active = bizQueues.find(q => q.status === "active") || bizQueues[0] || null;
      return {
        favorite_id: f.id,
        business_id: f.business_id,
        name: b?.name || "Business",
        category: b?.category ?? null,
        address: b?.address ?? null,
        last_used_at: f.last_used_at,
        queue_id: active?.id ?? null,
        queue_name: active?.name ?? null,
        queue_status: active?.status ?? null,
        est_time: active?.estimated_service_time || 5,
        waiting: active ? (waitingByQueue[active.id] || 0) : 0,
        show_live: (b as any)?.show_live_queue_info !== false,
        remote_join: (b as any)?.remote_joining_enabled !== false,
        hours_status: getOpenState((b as any)?.operating_hours).status,
        hours_label: getOpenState((b as any)?.operating_hours).label,
      };
    });

    setItems(merged);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  // Live sync: refresh whenever queue or visitor data changes.
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("favorites-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "queues" }, () => load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "queue_live_signals" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "customer_favorites", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, load]);

  const remove = async (fav: FavBiz) => {
    if (!user) return;
    const prev = items;
    setItems(items.filter(i => i.favorite_id !== fav.favorite_id));
    const { error } = await (supabase as any)
      .from("customer_favorites")
      .delete()
      .eq("id", fav.favorite_id);
    if (error) {
      setItems(prev);
      toast.error("Could not remove favorite");
    } else {
      toast.success(`Removed ${fav.name} from favorites`);
    }
  };

  if (!user) return null;
  if (loading) {
    return (
      <div className="mb-8 bg-card rounded-2xl p-5 card-shadow space-y-3" aria-hidden="true">
        <div className="h-4 w-44 rounded bg-muted animate-pulse" />
        <div className="h-3 w-64 rounded bg-muted animate-pulse" />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="mb-8 bg-card rounded-2xl p-5 card-shadow">
        <div className="flex items-center gap-2 mb-1">
          <Star className="w-4 h-4 text-warning fill-warning" />
          <h2 className="text-base font-bold text-foreground">My Favorite Businesses</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          You haven't joined any queues yet. Tap the ⭐ on any business page to save it here for one-tap re-joining.
        </p>
      </div>
    );
  }

  return (
    <section className="mb-8" aria-label="My favorite businesses">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-warning fill-warning" />
          <h2 className="text-lg font-bold text-foreground">My Favorite Businesses</h2>
        </div>
        <span className="text-xs text-muted-foreground">{items.length} saved</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(it => {
          const closedByHours = it.hours_status === "closed" || it.hours_status === "holiday";
          const isActive = it.queue_status === "active" && !closedByHours;
          return (
            <div key={it.favorite_id} className="bg-card rounded-2xl p-4 card-shadow flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-foreground text-sm line-clamp-1">{it.name}</h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {it.category || "Business"} · Last visit {formatRecency(it.last_used_at)}
                  </p>
                </div>
                <button
                  onClick={() => remove(it)}
                  className="p-1 rounded-full hover:bg-muted text-muted-foreground"
                  aria-label={`Remove ${it.name} from favorites`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-3 text-[11px] mb-3">
                <span className={`px-2 py-0.5 rounded-full font-medium ${
                  isActive ? "bg-success-soft text-success" :
                  it.queue_status ? "bg-muted text-muted-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {isActive
                    ? (it.show_live ? `● ${it.waiting} waiting` : "● Open")
                    : closedByHours ? it.hours_label
                    : it.queue_status ? "Queue closed" : "No queue"}
                </span>
                {isActive && it.show_live && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" /> ~{it.waiting * it.est_time}m wait
                  </span>
                )}
              </div>

              {isActive && it.queue_id ? (
                <Link
                  to={`/join/${it.queue_id}`}
                  className="mt-auto w-full text-center gradient-bg text-primary-foreground py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  {it.remote_join ? "Rejoin Queue" : "Visit Business"}
                </Link>
              ) : (
                <button
                  disabled
                  className="mt-auto w-full bg-muted text-muted-foreground py-2 rounded-xl text-xs font-medium cursor-not-allowed"
                >
                  Queue Unavailable
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FavoriteBusinesses;