import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { ReactNode, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Props {
  tokens: Array<{ token: number; status: string }>;
  myToken?: number | null;
  nowServing?: number | null;
  /** True while the first backend read is still in flight. */
  loading?: boolean;
  className?: string;
}

const DONE = new Set(["served", "completed", "no_show", "skipped", "removed"]);

/**
 * Live token timeline built from the queue state the page already loads.
 * Completed tokens rise out, the serving token pulses, the customer's own
 * token stays highlighted. Never resets — it's derived, not stateful.
 */
const QueueTimeline = ({ tokens, myToken, nowServing, loading = false, className }: Props) => {
  const reduce = useReducedMotion();

  const rows = useMemo(() => {
    if (!tokens.length) return [];
    const sorted = [...tokens].sort((a, b) => a.token - b.token);
    const anchorIdx = (() => {
      if (typeof myToken === "number") {
        const i = sorted.findIndex((t) => t.token === myToken);
        if (i >= 0) return i;
      }
      if (typeof nowServing === "number") {
        const i = sorted.findIndex((t) => t.token === nowServing);
        if (i >= 0) return i;
      }
      return 0;
    })();
    return sorted.slice(Math.max(0, anchorIdx - 3), anchorIdx + 4);
  }, [myToken, nowServing, tokens]);

  const shell = (children: ReactNode) => (
    <section
      className={cn("min-h-[188px] rounded-2xl border border-border bg-card p-4 text-left", className)}
      data-reserved-height="188"
      aria-label="Queue timeline"
    >
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Queue timeline</h3>
      {children}
    </section>
  );

  if (loading) {
    return shell(
      <div className="max-h-[140px] space-y-2 overflow-hidden pl-4" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full rounded-lg" />
        ))}
      </div>,
    );
  }

  if (rows.length < 2) {
    return shell(
      <p className="text-xs leading-relaxed text-muted-foreground">
        No queue activity yet. Customer events will appear here in real time.
      </p>,
    );
  }

  return (
    <section
      className={cn("min-h-[188px] rounded-2xl border border-border bg-card p-4 text-left", className)}
      data-reserved-height="188"
      aria-label="Queue timeline"
    >
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Queue timeline</h3>
      <ol className="relative max-h-[140px] space-y-1.5 overflow-y-auto pl-4">
        <span className="absolute left-[5px] top-1 bottom-1 w-px bg-border" aria-hidden="true" />
        <AnimatePresence initial={false}>
          {rows.map(({ token, status }) => {
            const isMe = myToken === token;
            const isServing = nowServing === token || status === "called" || status === "serving";
            const isDone = DONE.has(status);
            return (
              <motion.li
                key={token}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: isDone ? 0.5 : 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={cn(
                  "relative flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs",
                  isMe && "bg-primary/10 font-semibold text-primary",
                  !isMe && "text-foreground",
                )}
              >
                <span
                  className={cn(
                    "absolute -left-4 h-2.5 w-2.5 rounded-full border-2 border-card",
                    isServing ? "bg-primary" : isDone ? "bg-muted-foreground/50" : "bg-muted-foreground/25",
                  )}
                  aria-hidden="true"
                />
                {isServing && !reduce && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute -left-4 h-2.5 w-2.5 rounded-full bg-primary"
                    animate={{ scale: [1, 2.1, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <span className="tabular-nums">#{token}</span>
                {isDone && <Check className="h-3 w-3 text-muted-foreground" aria-label="served" />}
                {isServing && <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">Now serving</span>}
                {isMe && <span className="ml-auto text-[10px] font-bold uppercase tracking-wide">You</span>}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </section>
  );
};

export default QueueTimeline;
