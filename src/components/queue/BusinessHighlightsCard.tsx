import { motion, useReducedMotion } from "framer-motion";
import { Gauge, Heart, ShieldCheck, Star, Timer, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { QueuePulse } from "@/hooks/useCustomerQueueIntel";
import { cn } from "@/lib/utils";

interface Props {
  rating?: number | null;
  totalReviews?: number | null;
  pulse?: QueuePulse | null;
  /** True while the first backend read is still in flight. */
  loading?: boolean;
  className?: string;
}

interface Metric {
  key: string;
  label: string;
  value: string;
  Icon: typeof Star;
}

/**
 * Compact highlights strip. Every metric is backend-derived; anything the
 * backend can't answer yet is simply omitted (never zero-filled, never faked).
 */
const BusinessHighlightsCard = ({ rating, totalReviews, pulse, loading = false, className }: Props) => {
  const reduce = useReducedMotion();
  const metrics: Metric[] = [];

  if (typeof rating === "number" && rating > 0) {
    metrics.push({ key: "rating", label: "Rating", value: rating.toFixed(1), Icon: Star });
  }
  if (typeof totalReviews === "number" && totalReviews > 0) {
    metrics.push({ key: "reviews", label: "Reviews", value: String(totalReviews), Icon: Heart });
  }
  if (pulse?.avg_wait_minutes != null && pulse.avg_wait_minutes > 0) {
    metrics.push({
      key: "wait",
      label: "Avg wait today",
      value: `${Math.round(pulse.avg_wait_minutes)}m`,
      Icon: Timer,
    });
  }
  if (pulse?.avg_service_minutes != null && pulse.avg_service_minutes > 0) {
    metrics.push({
      key: "speed",
      label: "Service speed",
      value: `${Math.round(pulse.avg_service_minutes)}m`,
      Icon: Gauge,
    });
  }
  if (pulse?.reliability_pct != null) {
    metrics.push({
      key: "reliability",
      label: "Reliability",
      value: `${Math.round(pulse.reliability_pct)}%`,
      Icon: ShieldCheck,
    });
  }
  if (pulse?.served_today != null && pulse.served_today > 0) {
    metrics.push({
      key: "served",
      label: "Served today",
      value: String(pulse.served_today),
      Icon: Users,
    });
  }

  if (loading) {
    return (
      <div
        className={cn("min-h-[142px] rounded-2xl border border-border bg-card p-3", className)}
        data-reserved-height="142"
        aria-hidden="true"
      >
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[62px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div
        className={cn("min-h-[142px] rounded-2xl border border-border bg-card p-3 text-center", className)}
        data-reserved-height="142"
        aria-label="Business highlights"
      >
        <p className="text-xs leading-relaxed text-muted-foreground">
          Insights will become available once this business receives activity.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn("min-h-[142px] rounded-2xl border border-border bg-card p-3", className)}
      data-reserved-height="142"
      aria-label="Business highlights"
    >
      <div className="grid grid-cols-3 gap-2">
        {metrics.map(({ key, label, value, Icon }) => (
          <div key={key} className="rounded-xl bg-muted/40 px-2 py-2 text-center">
            <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <p className="text-sm font-bold leading-none text-foreground tabular-nums">{value}</p>
            <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default BusinessHighlightsCard;
