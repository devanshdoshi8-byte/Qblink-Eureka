import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import SectionHeading from "./SectionHeading";

const MINUTES_OPTIONS = [10, 20, 30, 60];

function useAnimatedNumber(target: number, duration = 300) {
  const [display, setDisplay] = useState(target);
  const stateRef = useRef({ target, value: target, raf: 0 });

  useEffect(() => {
    if (stateRef.current.target === target) return;
    stateRef.current.target = target;

    const from = stateRef.current.value;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (target - from) * eased);
      stateRef.current.value = v;
      setDisplay(v);
      if (p < 1) {
        stateRef.current.raf = requestAnimationFrame(tick);
      }
    };

    stateRef.current.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(stateRef.current.raf);
  }, [target, duration]);

  return display;
}

export default function TimeCalculator() {
  const [index, setIndex] = useState(1); // default: 20 minutes
  const trackRef = useRef<HTMLDivElement>(null);

  const minutes = MINUTES_OPTIONS[index];
  const annualHours = Math.round((minutes * 365) / 60);
  const animatedHours = useAnimatedNumber(annualHours);

  const handlePointer = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const newIndex = Math.round(ratio * (MINUTES_OPTIONS.length - 1));
    setIndex(newIndex);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      handlePointer(e.clientX);

      const move = (ev: PointerEvent) => handlePointer(ev.clientX);
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up, { once: true });
    },
    [handlePointer]
  );

  const pct = (index / (MINUTES_OPTIONS.length - 1)) * 100;

  return (
    <section className="section-padding">
      <div className="section-container">
        <SectionHeading
          title="How Much Time Do You Lose Waiting?"
          subtitle="Move the slider to estimate how much time you spend waiting in queues every day."
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-card card-shadow rounded-2xl p-6 sm:p-10">
            {/* Slider */}
            <div className="px-1">
              <div
                ref={trackRef}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={MINUTES_OPTIONS.length - 1}
                aria-valuenow={index}
                aria-label="Daily waiting time in minutes"
                tabIndex={0}
                className="relative h-2.5 bg-secondary rounded-full cursor-pointer select-none touch-none"
                onPointerDown={onPointerDown}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                    e.preventDefault();
                    setIndex((i) => Math.max(0, i - 1));
                  } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                    e.preventDefault();
                    setIndex((i) => Math.min(MINUTES_OPTIONS.length - 1, i + 1));
                  }
                }}
              >
                {/* Fill */}
                <div
                  className="absolute top-0 left-0 h-full rounded-full gradient-bg transition-[width] duration-300 ease-out"
                  style={{ width: `${pct}%` }}
                />

                {/* Dots */}
                {MINUTES_OPTIONS.map((_, i) => {
                  const pos = (i / (MINUTES_OPTIONS.length - 1)) * 100;
                  return (
                    <div
                      key={i}
                      className="absolute top-1/2"
                      style={{ left: `${pos}%` }}
                    >
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-200",
                          i <= index ? "bg-primary" : "bg-muted-foreground/25",
                          i === index && "scale-150"
                        )}
                      />
                    </div>
                  );
                })}

                {/* Thumb */}
                <div
                  className="absolute top-1/2 w-6 h-6 rounded-full bg-background border-2 border-primary shadow-md cursor-grab active:cursor-grabbing transition-[left] duration-300 ease-out"
                  style={{ left: `${pct}%`, transform: "translate(-50%, -50%)" }}
                />
              </div>

              {/* Labels */}
              <div className="flex justify-between mt-5">
                {MINUTES_OPTIONS.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={cn(
                      "text-sm font-semibold transition-colors duration-200",
                      i === index ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </div>

            {/* Result */}
            <div className="text-center mt-10">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                You lose approximately
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-6xl sm:text-7xl font-extrabold gradient-text tabular-nums leading-none">
                  {animatedHours}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-foreground">
                  hours
                </span>
              </div>
              <p className="mt-2 text-muted-foreground">
                every year waiting in queues
              </p>
            </div>

            {/* Fade-in message */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45, ease: "easeOut" }}
              className="text-center text-foreground mt-6 max-w-md mx-auto leading-relaxed"
            >
              Qblink helps give that time back by letting you join queues remotely and arrive when it&apos;s your turn.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.6, ease: "easeOut" }}
              className="text-center mt-6"
            >
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                See How Qblink Works
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
