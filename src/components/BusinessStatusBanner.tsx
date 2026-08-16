import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, PauseCircle, Rocket, TimerReset } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusKey = "normal" | "behind" | "delayed" | "faster";

interface Props {
  /** Live queue the customer is looking at (child queue for restaurants). */
  queueId?: string | null;
  /** Current queue lifecycle status: active / paused / closed. */
  queueStatus?: string | null;
  /** Configured expected service time in minutes. */
  expectedServiceMinutes?: number | null;
  /** Real call timestamps (ms) from the shared queue intel hook. */
  callTimes?: number[];
  /** Live waiting count from the shared queue intel hook. */
  waiting?: number;
  /** True once the shared hook has loaded live data at least once. */
  hasData?: boolean;
  className?: string;
}

interface Meta {
  label: string;
  detail: string;
  dot: string;
  wrap: string;
  text: string;
  Icon: typeof Activity;
}

const META: Record<StatusKey, Meta> = {
  normal: {
    label: "Operating Normally",
    detail: "The queue is moving as expected.",
    dot: "bg-success",
    wrap: "border-success/25 bg-success/10",
    text: "text-success",
    Icon: Activity,
  },
  behind: {
    label: "Running Slightly Behind",
    detail: "Wait times are temporarily longer than usual.",
    dot: "bg-warning",
    wrap: "border-warning/30 bg-warning/10",
    text: "text-warning",
    Icon: TimerReset,
  },
  delayed: {
    label: "Temporary Delay",
    detail: "Service is paused or significantly delayed right now.",
    dot: "bg-danger",
    wrap: "border-danger/30 bg-danger/10",
    text: "text-danger",
    Icon: PauseCircle,
  },
  faster: {
    label: "Queue Moving Faster Than Expected",
    detail: "Customers are being served quicker than predicted.",
    dot: "bg-info",
    wrap: "border-info/30 bg-info/10",
    text: "text-info",
    Icon: Rocket,
  },
};

const MIN_UTES = 60_000;

/**
 * Live business operating-status banner.
 * Pure presentation layer: reads the same public queue data the page already
 * uses (`queue_visitors_public` + `queue_live_signals` realtime) and derives
 * the pace of service from real call timestamps. No demo/placeholder states.
 */
const BusinessStatusBanner = ({
  queueId,
  queueStatus,
  expectedServiceMinutes,
  callTimes = [],
  waiting = 0,
  hasData = false,
  className,
}: Props) => {
  const [tick, setTick] = useState(0);

  // Re-evaluate staleness once a minute (no network, no polling).
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), MIN_UTES);
    return () => clearInterval(t);
  }, []);

  const status: StatusKey | null = useMemo(() => {
    void tick;
    if (!queueId) return null;
    if (queueStatus && queueStatus !== "active") return "delayed";
    if (!hasData) return null;

    const expected = Math.max(1, expectedServiceMinutes || 5);

    // Recent real intervals between consecutive customers being called.
    const recent = callTimes.slice(-7);
    const intervals: number[] = [];
    for (let i = 1; i < recent.length; i += 1) {
      const mins = (recent[i] - recent[i - 1]) / MIN_UTES;
      if (mins >= 0 && mins < 240) intervals.push(mins);
    }

    const lastCall = recent[recent.length - 1];
    const sinceLast = lastCall ? (Date.now() - lastCall) / MIN_UTES : null;

    // Nobody has been called for far longer than a normal service cycle
    // while people are still waiting => real stall.
    if (waiting > 0 && sinceLast !== null && sinceLast > expected * 3) return "delayed";

    if (intervals.length < 2) return "normal";
    const sorted = [...intervals].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    if (median <= expected * 0.75) return "faster";
    if (median >= expected * 2) return "delayed";
    if (median >= expected * 1.3) return "behind";
    return "normal";
  }, [callTimes, expectedServiceMinutes, hasData, queueId, queueStatus, tick, waiting]);

  if (!status) return null;
  const meta = META[status];
  const { Icon } = meta;

  return (
    <div className={cn("relative", className)} aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={status}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          role="status"
          className={cn(
            "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left backdrop-blur-sm",
            meta.wrap,
          )}
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <motion.span
              className={cn("absolute inline-flex h-full w-full rounded-full opacity-60", meta.dot)}
              animate={{ scale: [1, 1.9, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", meta.dot)} />
          </span>
          <Icon className={cn("h-4 w-4 shrink-0", meta.text)} aria-hidden="true" />
          <div className="min-w-0">
            <p className={cn("text-[12px] font-semibold leading-tight", meta.text)}>{meta.label}</p>
            <p className="text-[11px] leading-tight text-muted-foreground">{meta.detail}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default BusinessStatusBanner;
