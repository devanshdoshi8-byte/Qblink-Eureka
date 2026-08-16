import { useEffect, useRef, useState } from "react";
import { Bell, X, CalendarClock, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useCustomerNotifications } from "@/hooks/useCustomerRealtime";

const iconFor = (type: string) => {
  if (type === "appointment") return CalendarClock;
  if (type === "success") return CheckCircle2;
  if (type === "warning" || type === "alert") return AlertTriangle;
  return Info;
};

const NotificationBell = () => {
  const { notifications, loading, unreadCount, markAllRead, dismiss } = useCustomerNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open) markAllRead(); }}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[19rem] max-h-96 overflow-y-auto bg-card border border-border rounded-2xl card-shadow">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between sticky top-0 bg-card rounded-t-2xl">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            <button onClick={() => setOpen(false)} aria-label="Close notifications">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          {loading ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              You're all caught up. Updates about your queues and appointments show up here.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => {
                const Icon = iconFor(n.type);
                const body = (
                  <div className="flex gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id} className={`px-4 py-3 flex items-start gap-2 ${!n.read_at ? "bg-primary/5" : ""}`}>
                    <div className="flex-1 min-w-0">
                      {n.link ? <Link to={n.link} onClick={() => setOpen(false)}>{body}</Link> : body}
                    </div>
                    <button onClick={() => dismiss(n.id)} aria-label="Dismiss notification" className="p-1 rounded-lg hover:bg-muted">
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;