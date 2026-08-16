import { useMemo, useState } from "react";

export const TimeThread = () => {
  const [daily, setDaily] = useState(80); // customers/day
  const [avgWait, setAvgWait] = useState(12); // minutes

  const hoursPerYear = useMemo(
    () => Math.round((daily * avgWait * 6 * 52) / 60),
    [daily, avgWait]
  );
  const years = (hoursPerYear / (365 * 24)).toFixed(2);

  const ticks = Array.from({ length: 24 }, (_, i) => i);

  return (
    <section
      className="relative deep-surface overflow-hidden py-24 sm:py-32"
      aria-label="Time calculator"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-24 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <div className="font-mono-caps text-glow/80 mb-4">Ch. 02 · The math</div>
          <h2 className="font-display text-4xl sm:text-5xl text-cream leading-tight">
            How much of your customers' lives are you holding?
          </h2>
        </div>

        <div className="lg:col-span-8 space-y-10">
          <div>
            <label className="font-mono-caps text-cream/60 flex justify-between">
              <span>Customers per day</span>
              <span className="text-glow tabular-nums">{daily}</span>
            </label>
            <input
              type="range"
              min={10}
              max={400}
              value={daily}
              onChange={(e) => setDaily(Number(e.target.value))}
              className="w-full mt-3 accent-glow"
              aria-label="Customers per day"
            />
          </div>
          <div>
            <label className="font-mono-caps text-cream/60 flex justify-between">
              <span>Average wait (minutes)</span>
              <span className="text-glow tabular-nums">{avgWait}</span>
            </label>
            <input
              type="range"
              min={2}
              max={45}
              value={avgWait}
              onChange={(e) => setAvgWait(Number(e.target.value))}
              className="w-full mt-3 accent-glow"
              aria-label="Average wait minutes"
            />
          </div>

          {/* thread */}
          <div className="relative pt-6 pb-16">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-glow/40" />
            <div className="relative flex justify-between">
              {ticks.map((i) => {
                const active = i / 24 < Math.min(1, hoursPerYear / 4000);
                return (
                  <span
                    key={i}
                    className={`block w-px transition-all ${
                      active
                        ? "h-8 bg-glow shadow-[0_0_10px_hsl(var(--glow))]"
                        : "h-3 bg-cream/25"
                    }`}
                  />
                );
              })}
            </div>
            <div className="absolute -bottom-2 left-0 font-mono-caps text-cream/40">0 hrs</div>
            <div className="absolute -bottom-2 right-0 font-mono-caps text-cream/40">4,000+ hrs</div>
          </div>

          <blockquote className="border-l-2 border-glow pl-6 py-2">
            <div className="font-display text-3xl sm:text-4xl text-cream leading-snug">
              "You are collectively holding{" "}
              <span className="text-glow tabular-nums">
                {hoursPerYear.toLocaleString()}
              </span>{" "}
              hours of your customers' lives every year."
            </div>
            <div className="font-mono-caps text-cream/50 mt-4">
              That's roughly {years} human years — spent standing.
            </div>
          </blockquote>
        </div>
      </div>
    </section>
  );
};