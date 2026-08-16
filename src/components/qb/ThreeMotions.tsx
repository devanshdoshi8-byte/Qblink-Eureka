import { motion } from "framer-motion";
import { Sparkles, ArrowRight, UserCheck, Clock, ShieldCheck } from "lucide-react";

export const ThreeMotions = () => (
  <section
    id="act-relief"
    className="relative ink-surface py-24 sm:py-32 overflow-hidden grain"
    aria-label="How it works"
  >
    {/* Atmospheric gradient backdrops */}
    <div className="absolute top-1/2 left-1/4 w-96 h-96 rounded-full bg-glow/5 blur-[100px] pointer-events-none" />
    <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-teal/10 blur-[120px] pointer-events-none" />

    <div className="max-w-7xl mx-auto px-6 lg:px-24 relative z-10">
      <div className="flex items-end justify-between flex-wrap gap-6 mb-8">
        <div>
          <div className="font-mono-caps text-glow/80 mb-4 flex items-center gap-2 text-xs tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-glow animate-ping" />
            Ch. 03 · Unified Kinetic Flow
          </div>
          <h2 className="font-display text-4xl sm:text-6xl text-cream leading-[0.95] max-w-3xl">
            One thread.
            <br />
            <span className="text-glow italic font-normal">Three fluid motions.</span>
          </h2>
        </div>
        <p className="text-cream/60 max-w-sm leading-relaxed text-sm sm:text-base">
          From the instant a QR code is scanned to the moment service begins, every token follows
          one synchronized trajectory.
        </p>
      </div>

      {/* Interactive Timeline Pipeline (Desktop) */}
      <div className="mt-16 relative hidden md:block rounded-3xl bg-deep/25 border border-glow/20 p-8 shadow-2xl backdrop-blur-sm">
        <svg viewBox="0 0 1200 240" className="w-full">
          <defs>
            <linearGradient id="threadGlow" x1="0" x2="1">
              <stop offset="0%" stopColor="hsl(var(--glow))" stopOpacity="0.2" />
              <stop offset="50%" stopColor="hsl(var(--glow))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--teal))" stopOpacity="0.4" />
            </linearGradient>

            <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background blurred laser track */}
          <path
            d="M 40 130 C 300 60, 500 200, 700 110 S 1100 130, 1160 130"
            fill="none"
            stroke="hsl(var(--glow))"
            strokeWidth="6"
            strokeOpacity="0.2"
            filter="url(#laserGlow)"
          />

          {/* Main animated thread path */}
          <path
            d="M 40 130 C 300 60, 500 200, 700 110 S 1100 130, 1160 130"
            fill="none"
            stroke="url(#threadGlow)"
            strokeWidth="2.5"
            strokeDasharray="8 4"
          >
            <animate attributeName="stroke-dashoffset" values="0;-120" dur="4s" repeatCount="indefinite" />
          </path>

          {/* Three key station nodes */}
          {[
            { x: 160, y: 92, n: "01", label: "Join", sub: "Scan QR · take spot", icon: "✦" },
            { x: 600, y: 148, n: "02", label: "Wait", sub: "Live position updates", icon: "●" },
            { x: 1060, y: 118, n: "03", label: "Serve", sub: "Arrival call alert", icon: "✓" },
          ].map((s, i) => (
            <g key={i} className="group cursor-pointer">
              {/* Outer pulsing beacon ring */}
              <circle cx={s.x} cy={s.y} r="18" fill="hsl(var(--glow) / 0.15)">
                <animate attributeName="r" values="14;24;14" dur={`${2.5 + i * 0.5}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.1;0.6" dur={`${2.5 + i * 0.5}s`} repeatCount="indefinite" />
              </circle>

              {/* Node container */}
              <circle cx={s.x} cy={s.y} r="12" fill="hsl(var(--ink))" stroke="hsl(var(--glow))" strokeWidth="2.5" />
              <circle cx={s.x} cy={s.y} r="4" fill="hsl(var(--glow))" />

              {/* Step number badge */}
              <rect x={s.x - 22} y={s.y - 44} width="44" height="20" rx="6" fill="hsl(var(--glow) / 0.2)" stroke="hsl(var(--glow) / 0.4)" strokeWidth="1" />
              <text x={s.x} y={s.y - 30} textAnchor="middle" fontFamily="DM Sans" fontSize="11" fontWeight="bold" letterSpacing="1" fill="hsl(var(--glow))">
                STEP {s.n}
              </text>

              {/* Main label */}
              <text x={s.x} y={s.y + 36} textAnchor="middle" fontFamily="Space Grotesk" fontSize="24" fontWeight="bold" fill="hsl(var(--cream))">
                {s.label}
              </text>
              <text x={s.x} y={s.y + 56} textAnchor="middle" fontFamily="DM Sans" fontSize="13" fill="hsl(var(--cream) / 0.7)">
                {s.sub}
              </text>
            </g>
          ))}

          {/* Traveling primary glowing token */}
          <g filter="url(#laserGlow)">
            <circle r="7" fill="hsl(var(--cream))">
              <animateMotion dur="7s" repeatCount="indefinite" path="M 40 130 C 300 60, 500 200, 700 110 S 1100 130, 1160 130" />
            </circle>
          </g>

          {/* Traveling secondary token */}
          <g filter="url(#laserGlow)">
            <circle r="5" fill="hsl(var(--glow))">
              <animateMotion dur="7s" begin="3.5s" repeatCount="indefinite" path="M 40 130 C 300 60, 500 200, 700 110 S 1100 130, 1160 130" />
            </circle>
          </g>
        </svg>
      </div>

      {/* Mobile Vertical Timeline */}
      <div className="md:hidden mt-12 space-y-6">
        {[
          { n: "01", label: "Join", sub: "Scan QR code · instant token in browser" },
          { n: "02", label: "Wait", sub: "Live position updates anywhere · zero line standing" },
          { n: "03", label: "Serve", sub: "Proactive alert when turn approaches · smooth arrival" },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="flex items-start gap-4 p-4 rounded-2xl bg-deep/30 border border-glow/20"
          >
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-glow/15 border border-glow flex items-center justify-center text-glow font-bold text-sm">
                {s.n}
              </div>
              {i < 2 && <div className="w-0.5 h-10 bg-gradient-to-b from-glow to-transparent mt-2" />}
            </div>
            <div>
              <div className="font-display text-xl text-cream font-bold">{s.label}</div>
              <div className="text-cream/70 text-xs mt-1 leading-relaxed">{s.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Interactive 3-Perspective Cards */}
      <div className="mt-16 grid md:grid-cols-3 gap-6 lg:gap-8">
        {[
          {
            icon: UserCheck,
            h: "For the customer",
            b: "One link, zero friction. See live queue position, estimated countdown, and exact moment to return.",
            tag: "Zero app download",
          },
          {
            icon: Clock,
            h: "For the staff",
            b: "A single unified counter dashboard combines physical walk-ins with remote joiners seamlessly.",
            tag: "One honest flow",
          },
          {
            icon: ShieldCheck,
            h: "For the owner",
            b: "Real-time analytics replace guesswork. Spot peak rushes, service bottlenecks, and revenue leaks.",
            tag: "Operational intelligence",
          },
        ].map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="relative rounded-2xl bg-gradient-to-b from-deep/40 to-deep/15 border border-glow/20 p-7 shadow-lg hover:border-glow/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-glow/10 border border-glow/30 flex items-center justify-center mb-5 group-hover:bg-glow/20 transition-colors">
              <c.icon className="w-6 h-6 text-glow" />
            </div>

            <div className="font-mono-caps text-glow text-xs font-bold tracking-wider mb-2">
              PERSPECTIVE 0{i + 1}
            </div>

            <h3 className="font-display text-2xl text-cream font-bold leading-snug">{c.h}</h3>
            <p className="text-cream/70 mt-3 text-sm leading-relaxed">{c.b}</p>

            <div className="mt-6 pt-4 border-t border-glow/15 flex items-center justify-between text-xs text-glow/80 font-mono-caps">
              <span>{c.tag}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);