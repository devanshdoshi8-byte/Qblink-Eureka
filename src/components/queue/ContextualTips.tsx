import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { useMemo } from "react";
import type { QueuePulse } from "@/hooks/useCustomerQueueIntel";
import { cn } from "@/lib/utils";

interface Props {
  pulse?: QueuePulse | null;
  /** Live people-ahead figure computed by the page (single source of truth). */
  ahead?: number | null;
  /** Live estimated wait in minutes computed by the page. */
  waitMinutes?: number | null;
  /** Configured expected service time. */
  serviceTime?: number | null;
  /** Recent real call timestamps (ms) for the current queue. */
  callTimes?: number[];
  className?: string;
}

/**
 * Contextual tips derived strictly from live backend metrics.
 * If no metric supports a statement, nothing is rendered.
 */
const ContextualTips = ({ pulse, ahead, waitMinutes, serviceTime, callTimes = [], className }: Props) => {
  const reduce = useReducedMotion();

  const tips = useMemo(() => {
    const out: string[] = [];
    const expected = Math.max(1, serviceTime || 5);

    // Observed pace from real call timestamps.
    const recent = callTimes.slice(-7);
    const intervals: number[] = [];
    for (let i = 1; i < recent.length; i += 1) {
      const m = (recent[i] - recent[i - 1]) / 60000;
      if (m >= 0 && m < 240) intervals.push(m);
    }
    if (intervals.length >= 2) {
      const sorted = [...intervals].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      if (median <= expected * 0.75) out.push("The queue is moving faster than this counter's usual pace.");
      else if (median >= expected * 1.3) out.push("Service is running a little slower than usual right now.");
      else out.push("The queue is progressing at its normal pace.");
    }

    if (
      typeof waitMinutes === "number" &&
      pulse?.avg_wait_minutes != null &&
      pulse.avg_wait_minutes > 0 &&
      waitMinutes > 0
    ) {
      if (waitMinutes < pulse.avg_wait_minutes * 0.8) {
        out.push(`Your wait is shorter than today's average of ${Math.round(pulse.avg_wait_minutes)} minutes.`);
      } else if (waitMinutes > pulse.avg_wait_minutes * 1.25) {
        out.push(`Today's average wait here is about ${Math.round(pulse.avg_wait_minutes)} minutes.`);
      }
    }

    if (pulse?.avg_service_minutes != null && pulse.avg_service_minutes > 0) {
      out.push(`Most customers are served within about ${Math.max(1, Math.round(pulse.avg_service_minutes))} minutes at the counter.`);
    }

    if (typeof ahead === "number" && typeof waitMinutes === "number" && ahead > 0 && waitMinutes >= 5) {
      out.push(`Leaving in about ${Math.max(1, Math.round(waitMinutes - 5))} minutes should get you here right on time.`);
    }

    if (pulse?.reliability_pct != null && pulse.reliability_pct >= 90) {
      out.push(`${Math.round(pulse.reliability_pct)}% of today's customers were served without being skipped.`);
    }

    if (pulse?.served_today != null && pulse.served_today > 0) {
      out.push(`${pulse.served_today} customers have already been served here today.`);
    }

    return out.slice(0, 3);
  }, [ahead, callTimes, pulse, serviceTime, waitMinutes]);

  if (!tips.length) return null;

  return (
    <section className={cn("rounded-2xl border border-border bg-card p-4 text-left", className)} aria-label="Queue insights">
      <div className="mb-2 flex items-center gap-2">
        <Lightbulb className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Insights</h3>
      </div>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.ul
          key={tips.join("|")}
          initial={reduce ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-1.5"
        >
          {tips.map((t) => (
            <li key={t} className="flex gap-2 text-xs leading-relaxed text-foreground">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              <span>{t}</span>
            </li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </section>
  );
};

export default ContextualTips;
