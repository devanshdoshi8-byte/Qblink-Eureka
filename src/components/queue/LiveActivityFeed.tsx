import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { QueueActivityEvent } from "@/hooks/useCustomerQueueIntel";
import { cn } from "@/lib/utils";

interface Props {
  events: QueueActivityEvent[];
  /** True while the first backend read is still in flight. */
  loading?: boolean;
  className?: string;
}

const describe = (e: QueueActivityEvent) => {
  const t = e.token_number != null ? `Token #${e.token_number}` : "A customer";
  switch (e.action) {
    case "joined":
      return `${t} joined the queue`;
    case "checked_in":
      return `${t} checked in at the counter`;
    case "called":
      return `${t} was called`;
    case "served":
    case "completed":
      return `${t} was served`;
    case "skipped":
      return `${t} was skipped`;
    case "recalled":
      return `${t} was called back`;
    case "no_show":
      return `${t} did not arrive`;
    case "cancelled":
      return `${t} left the queue`;
    default:
      return `${t} · ${e.action.replace(/_/g, " ")}`;
  }
};

const relative = (iso: string, now: number) => {
  const mins = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 minute ago";
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? "1 hour ago" : `${hrs} hours ago`;
};

/**
 * Live activity feed. Newest first, max 10, straight from the queue's own
 * activity log (no names, no personal data) via the shared realtime state.
 */
const LiveActivityFeed = ({ events, loading = false, className }: Props) => {
  const reduce = useReducedMotion();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const list = events.slice(0, 10);

  return (
    <section
      className={cn("min-h-[132px] rounded-2xl border border-border bg-card p-4 text-left", className)}
      data-reserved-height="132"
      aria-label="Live queue activity"
    >
      <div className="mb-3 flex items-center gap-2">
        <Radio className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Live activity</h3>
      </div>
      {loading && (
        <div className="max-h-[84px] space-y-2 overflow-hidden" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full rounded" />
          ))}
        </div>
      )}
      {!loading && list.length === 0 && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          No recent activity. New customer actions will appear automatically.
        </p>
      )}
      {!loading && list.length > 0 && (
      <ul className="max-h-[84px] space-y-2 overflow-y-auto" aria-live="polite">
        <AnimatePresence initial={false}>
          {list.map((e) => (
            <motion.li
              key={e.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-start justify-between gap-3"
            >
              <span className="flex min-w-0 items-start gap-2 text-xs text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden="true" />
                <span className="truncate">{describe(e)}</span>
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground">{relative(e.created_at, now)}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      )}
    </section>
  );
};

export default LiveActivityFeed;
