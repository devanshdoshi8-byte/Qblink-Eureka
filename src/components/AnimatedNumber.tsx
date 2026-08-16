import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  /** Animation duration in seconds. */
  duration?: number;
  /** Optional formatter (e.g. `(n) => \`\${n}m\``). */
  format?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** Highlight decrease as amber instead of green (rare — e.g. "ahead" going up is bad). Default: decrease=green, increase=amber. */
  invertHighlight?: boolean;
  /** How long the highlight color stays on (ms). */
  highlightMs?: number;
  /** Expose as an ARIA live region. Disable when a parent composes the announcement. */
  ariaLive?: boolean;
}

/**
 * Renders a number that count-up/down animates on change with subtle easing.
 * - Skips animation on first mount (no flash on load).
 * - Uses tabular numbers so layout never shifts.
 * - Flashes soft green on decrease, soft amber on increase.
 * - Theme-aware colors that read cleanly in Light and Dark.
 */
export const AnimatedNumber = ({
  value,
  duration = 0.4,
  format,
  prefix = "",
  suffix = "",
  className,
  invertHighlight = false,
  highlightMs = 900,
  ariaLive = true,
}: AnimatedNumberProps) => {
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const prevRef = useRef<number | null>(null);
  const [highlight, setHighlight] = useState<"up" | "down" | null>(null);

  const render = (n: number) => {
    if (!spanRef.current) return;
    const rounded = Number.isFinite(n) ? Math.round(n) : 0;
    const text = format ? format(rounded) : String(rounded);
    spanRef.current.textContent = `${prefix}${text}${suffix}`;
  };

  useEffect(() => {
    const prev = prevRef.current;
    // First mount → paint value instantly, no animation, no highlight.
    if (prev === null || prev === value) {
      render(value);
      prevRef.current = value;
      return;
    }

    const goingDown = value < prev;
    const decreaseGood = !invertHighlight; // default: down = good (green)
    setHighlight(goingDown ? (decreaseGood ? "down" : "up") : (decreaseGood ? "up" : "down"));

    const controls = animate(prev, value, {
      duration,
      ease: [0.22, 1, 0.36, 1], // gentle easeOut
      onUpdate: render,
      onComplete: () => render(value),
    });

    const t = window.setTimeout(() => setHighlight(null), highlightMs);
    prevRef.current = value;

    return () => {
      controls.stop();
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span
      ref={spanRef}
      className={cn(
        "tabular-nums transition-colors duration-500 ease-out",
        highlight === "down" && "text-success",
        highlight === "up" && "text-warning",
        className,
      )}
      aria-live={ariaLive ? "polite" : undefined}
    >
      {`${prefix}${format ? format(value) : value}${suffix}`}
    </span>
  );
};

export default AnimatedNumber;