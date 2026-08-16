import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

const spots = [
  { x: 15, y: 40, label: "Walk-outs", detail: "22% leave when the line is unclear", stat: "22% lost" },
  { x: 34, y: 62, label: "Repeat asks", detail: "\"How long?\" — asked ~11× per hour", stat: "11× / hour" },
  { x: 52, y: 32, label: "Bad reviews", detail: "Wait complaints top negative feedback", stat: "Top complaint" },
  { x: 70, y: 58, label: "Staff drain", detail: "40 min/day answering queue questions", stat: "40 min/day" },
  { x: 84, y: 38, label: "Lost sales", detail: "Peak-hour crowd caps daily revenue", stat: "Peak cap" },
];

export const ProblemInfographic = () => {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section
      id="act-move"
      className="relative ink-surface py-24 sm:py-32 overflow-hidden grain"
      aria-label="The problem"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-glow/5 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-24">
        <div className="font-mono-caps text-glow/80 mb-4 flex items-center gap-2 text-xs tracking-[0.2em]">
          <span className="w-1.5 h-1.5 rounded-full bg-glow animate-ping" />
          Ch. 02 · The Shape of Uncertainty
        </div>
        <h2 className="font-display text-4xl sm:text-6xl text-cream leading-[0.95] max-w-3xl">
          Uncertainty has a shape.
          <br />
          <span className="text-glow italic font-normal">This is it.</span>
        </h2>
        <p className="text-cream/60 mt-6 max-w-xl text-base sm:text-lg leading-relaxed">
          Hover across the waiting room. Every hotspot represents a quantifiable leak in footfall,
          patience, and counter throughput when queues are invisible.
        </p>

        {/* Interactive Silhouette Room Stage */}
        <div className="mt-16 relative aspect-[16/7] rounded-2xl bg-gradient-to-b from-deep/40 via-deep/10 to-transparent border border-glow/20 overflow-hidden shadow-2xl backdrop-blur-sm">
          {/* Animated Sonar Radar Sweep */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute -left-1/4 -top-1/2 w-[150%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_320deg,hsl(var(--glow)/0.4)_360deg)] animate-radar-sweep origin-center" />
          </div>

          <svg viewBox="0 0 100 44" className="w-full h-full relative z-10" preserveAspectRatio="none">
            {/* floor */}
            <line x1="0" y1="42" x2="100" y2="42" stroke="hsl(var(--glow) / 0.4)" strokeWidth="0.2" strokeDasharray="1 1" />

            {/* silhouettes */}
            {Array.from({ length: 18 }).map((_, i) => {
              const x = 4 + i * 5.2;
              const h = 12 + (i % 4) * 2.2;
              const isNearby = active !== null && Math.abs(spots[active].x - x) < 8;
              return (
                <g
                  key={i}
                  fill={isNearby ? "hsl(var(--glow) / 0.45)" : "hsl(var(--cream) / 0.16)"}
                  className="transition-colors duration-300"
                >
                  <circle cx={x} cy={42 - h - 2} r="1.6" />
                  <rect x={x - 1.8} y={42 - h} width="3.6" height={h} rx="1.5" />
                </g>
              );
            })}

            {/* hotspots */}
            {spots.map((s, i) => (
              <g
                key={i}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                tabIndex={0}
                className="cursor-pointer focus:outline-none group"
              >
                {/* Sonar wave rings */}
                <circle
                  cx={s.x}
                  cy={s.y * 0.44}
                  r="5.5"
                  fill="none"
                  stroke="hsl(var(--glow))"
                  strokeWidth="0.2"
                  opacity={active === i ? "0.8" : "0.3"}
                >
                  <animate attributeName="r" values="2;8;12" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.3;0" dur="3s" repeatCount="indefinite" />
                </circle>

                {/* Outer hit area */}
                <circle cx={s.x} cy={s.y * 0.44} r="7" fill="hsl(var(--glow) / 0.15)" className="group-hover:fill-glow/25 transition-all" />

                {/* Central Beacon */}
                <circle
                  cx={s.x}
                  cy={s.y * 0.44}
                  r={active === i ? "2" : "1.2"}
                  fill="hsl(var(--glow))"
                  opacity={active === i ? 1 : 0.85}
                  className="transition-all duration-300"
                />
              </g>
            ))}
          </svg>

          {/* Dynamic Floating Tooltip */}
          <AnimatePresence>
            {active !== null && (
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="absolute pointer-events-none cream-surface px-4 py-3.5 rounded-xl border border-border shadow-xl z-20 max-w-[260px]"
                style={{
                  left: `clamp(16%, ${spots[active].x}%, 84%)`,
                  top: `${spots[active].y}%`,
                  transform: "translate(-50%, -115%)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-caps text-xs font-bold text-ink/70 uppercase">
                    {spots[active].label}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                    {spots[active].stat}
                  </span>
                </div>
                <div className="font-display text-base font-semibold text-ink leading-snug mt-1.5">
                  {spots[active].detail}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Interactive Legend Grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {spots.map((s, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                active === i
                  ? "bg-glow/20 border-glow text-cream shadow-lg shadow-glow/10"
                  : "bg-deep/20 border-glow/15 hover:border-glow/40 text-cream/70"
              }`}
            >
              <div className="font-mono-caps text-glow text-xs font-bold flex items-center justify-between">
                <span>0{i + 1}</span>
                {active === i && <AlertCircle className="w-3.5 h-3.5 text-glow animate-pulse" />}
              </div>
              <div className="text-cream font-semibold mt-1 text-sm">{s.label}</div>
              <div className="text-[11px] text-cream/50 mt-0.5">{s.stat}</div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};