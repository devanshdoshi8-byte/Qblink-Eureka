import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  score: number | null;
  read_at: string | null;
  created_at: string;
}

const QueueHealthAlerts = ({ businessId }: { businessId: string }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("queue_health_alerts")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(20);
    setAlerts((data as any) || []);
  };

  useEffect(() => {
    load();
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      // Ask once, silently
      setTimeout(() => { Notification.requestPermission().catch(() => {}); }, 4000);
    }
    // Poll for new alerts (alerts are no longer broadcast over realtime for privacy)
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("queue_health_alerts")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(20);
      const rows = ((data as any) || []) as Alert[];
      setAlerts((prev) => {
        const known = new Set(prev.map((a) => a.id));
        rows.filter((a) => !known.has(a.id)).forEach((a) => {
          toast.warning(a.message);
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try { new Notification("Qblink Queue Health", { body: a.message }); } catch {}
          }
        });
        return rows;
      });
    }, 20000);
    return () => clearInterval(poll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const unread = alerts.filter(a => !a.read_at).length;

  const markAllRead = async () => {
    const ids = alerts.filter(a => !a.read_at).map(a => a.id);
    if (!ids.length) return;
    await supabase.from("queue_health_alerts").update({ read_at: new Date().toISOString() }).in("id", ids);
    setAlerts(prev => prev.map(a => ({ ...a, read_at: a.read_at || new Date().toISOString() })));
  };

  return (
    <div className="relative">
      <button onClick={() => { setOpen(o => !o); if (!open) markAllRead(); }}
        className="relative inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-card border border-border text-foreground hover:bg-muted transition-colors">
        <Bell className="w-3.5 h-3.5" /> Alerts
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-30 w-80 max-h-96 overflow-y-auto bg-card border border-border rounded-2xl card-shadow">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Health Alerts</span>
            <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          {alerts.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">No alerts. Your queues are healthy.</p>
          ) : (
            <ul className="divide-y divide-border">
              {alerts.map(a => (
                <li key={a.id} className="px-4 py-3 flex gap-2">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${a.severity === "critical" ? "text-danger" : "text-warning"}`} />
                  <div className="min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{a.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default QueueHealthAlerts;