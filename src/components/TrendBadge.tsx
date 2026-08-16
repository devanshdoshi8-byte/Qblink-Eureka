import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendBadgeProps {
  /** Percentage delta. Positive = up, negative = down, 0/undefined = flat. */
  value?: number;
  /** If true, downward movement is the positive outcome (e.g. wait time). */
  invert?: boolean;
  /** Optional label appended after the percentage. */
  label?: string;
  className?: string;
}

const formatPct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(n >= 10 || n <= -10 ? 0 : 1)}%`;

/**
 * Compact trend indicator: arrow + signed percentage in a pill.
 * Green = good, red = bad, muted = flat.
 */
const TrendBadge = ({ value, invert = false, label, className }: TrendBadgeProps) => {
  const v = value ?? 0;
  const isFlat = !value || Math.abs(v) < 0.05;
  const isUp = v > 0;
  const good = isFlat ? false : invert ? !isUp : isUp;
  const bad = !isFlat && !good;

  const Icon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        good && "bg-success-soft text-success",
        bad && "bg-danger-soft text-danger",
        isFlat && "bg-muted text-muted-foreground",
        className,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {isFlat ? "0%" : formatPct(v)}
      {label && <span className="font-medium opacity-80">· {label}</span>}
    </span>
  );
};

export default TrendBadge;