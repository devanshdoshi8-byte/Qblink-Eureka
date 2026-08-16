import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Zap, Sparkles, Check, ArrowUpRight } from "lucide-react";

export const ReliefBento = () => {
  const [pos, setPos] = useState(3);

  useEffect(() => {
    const t = setInterval(() => setPos((p) => (p <= 1 ? 5 : p - 1)), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      className="relative ink-surface py-24 sm:py-32 overflow-hidden grain"
      aria-label="The relief layer"
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-glow/5 blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-24 relative z-10">
        <div className="font-mono-caps text-glow/80 mb-4 flex items-center gap-2 text-xs tracking-[0.2em]">
          <span className="w-1.5 h-1.5 rounded-full bg-glow animate-ping" />
          Ch. 05 · The Relief Architecture
        </div>
        <h2 className="font-display text-4xl sm:text-6xl text-cream leading-[0.95] max-w-3xl">
          What replaces the anxiety
          <br />
          <span className="text-glow italic font-normal">of standing in line.</span>
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 grid grid-cols-1 md:grid-cols-6 md:grid-rows-4 gap-4 md:gap-5"
        >
          {/* Big Live Position Widget */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.3 }}
            className="md:col-span-4 md:row-span-3 relative deep-surface p-8 sm:p-10 rounded-3xl flex flex-col justify-between border border-glow/25 shadow-2xl overflow-hidden group"
          >
            {/* Animated corner light shimmer */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-glow/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />

            <div className="flex justify-between items-center font-mono-caps text-cream/70 text-xs">
              <span className="flex items-center gap-2 font-bold">
                <Radio className="w-4 h-4 text-glow animate-pulse" /> LIVE STREAMING POSITION
              </span>
              <span className="px-3 py-1 rounded-full bg-glow/15 border border-glow/30 text-glow font-bold text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-glow animate-ping" /> Realtime
              </span>
            </div>

            <div className="flex items-end gap-6 sm:gap-10 my-8">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={pos}
                  initial={{ y: 40, opacity: 0, scale: 0.85 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -40, opacity: 0, scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="font-display text-cream text-7xl sm:text-8xl md:text-[10rem] font-black leading-none tabular-nums tracking-tighter"
                >
                  {pos}
                </motion.div>
              </AnimatePresence>

              <div className="pb-4 sm:pb-8">
                <div className="font-mono-caps text-cream/50 text-xs sm:text-sm font-semibold tracking-wider">AHEAD OF YOU</div>
                <motion.div
                  key={`time-${pos}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-display text-3xl sm:text-4xl text-glow font-bold mt-1 tabular-nums"
                >
                  ~{pos * 2 + 2} min
                </motion.div>
              </div>
            </div>

            {/* Dynamic Step Progress Track */}
            <div>
              <div className="flex gap-1.5 sm:gap-2">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.span
                    key={i}
                    className={`h-7 flex-1 rounded-md transition-colors duration-500 ${
                      i < 20 - pos * 4 ? "bg-gradient-to-t from-glow to-teal shadow-sm shadow-glow/30" : "bg-cream/10"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between font-mono-caps text-cream/50 text-xs mt-4">
                <span>01 Joined #A-42</span>
                <span className="text-glow font-semibold">Moving steadily</span>
                <span>Counter 2</span>
              </div>
            </div>
          </motion.div>

          {/* Friction Removed Card */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="md:col-span-2 md:row-span-2 relative cream-surface p-8 rounded-3xl flex flex-col justify-between shadow-xl border border-border group"
          >
            <div className="font-mono-caps text-ink/60 text-xs font-bold tracking-wider">
              FRICTION ELIMINATED
            </div>
            <div className="my-auto space-y-1">
              <div className="font-display text-4xl sm:text-5xl text-ink font-bold leading-none">No app.</div>
              <div className="font-display text-3xl sm:text-4xl text-ink/30 line-through leading-none decoration-destructive decoration-2">
                Install.
              </div>
              <div className="font-display text-3xl sm:text-4xl text-ink/30 line-through leading-none decoration-destructive decoration-2">
                Sign up.
              </div>
              <div className="font-display text-3xl sm:text-4xl text-primary font-bold leading-none pt-2 flex items-center gap-2">
                Just a link <ArrowUpRight className="w-7 h-7" />
              </div>
            </div>
            <div className="text-xs text-ink/60 font-medium">100% web-native in any browser</div>
          </motion.div>

          {/* Pull Quote Card */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="md:col-span-2 md:row-span-2 relative rounded-3xl bg-gradient-to-b from-deep/50 to-deep/20 border border-glow/25 p-8 flex flex-col justify-between shadow-xl"
          >
            <div className="w-10 h-10 rounded-2xl bg-glow/15 border border-glow/30 flex items-center justify-center text-glow">
              <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '10s' }} />
            </div>
            <div className="font-display text-xl sm:text-2xl text-cream italic leading-relaxed my-3 font-medium">
              "The moment the number ticks down on your phone, the whole room breathes. That's the product."
            </div>
            <div className="font-mono-caps text-glow/70 text-xs font-semibold">— Human Design Principle 01</div>
          </motion.div>

          {/* Zero Hardware Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="md:col-span-2 md:row-span-1 relative deep-surface border border-glow/20 p-6 rounded-2xl flex items-center justify-between shadow-lg"
          >
            <div>
              <div className="font-mono-caps text-cream/50 text-xs font-semibold">HARDWARE NEEDED</div>
              <div className="font-display text-3xl text-cream font-bold mt-0.5">Zero.</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-glow/10 border border-glow/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-glow" />
            </div>
          </motion.div>

          {/* Setup Time Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="md:col-span-2 md:row-span-1 relative deep-surface border border-glow/20 p-6 rounded-2xl flex items-center justify-between shadow-lg"
          >
            <div>
              <div className="font-mono-caps text-glow/80 text-xs font-semibold">TIME TO GO LIVE</div>
              <div className="font-display text-3xl text-cream font-bold mt-0.5">&lt; 2 minutes</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/15 border border-success/30 flex items-center justify-center">
              <Check className="w-6 h-6 text-success" />
            </div>
          </motion.div>

          {/* Autonomous Insights Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="md:col-span-2 md:row-span-1 relative deep-surface border border-glow/20 p-6 rounded-2xl flex items-center justify-between shadow-lg"
          >
            <div>
              <div className="font-mono-caps text-cream/50 text-xs font-semibold">INTELLIGENCE</div>
              <div className="font-display text-xl text-cream font-bold leading-tight mt-0.5">
                Peak prediction & walk-out prevention
              </div>
            </div>
            <div className="flex items-center gap-1 h-6">
              <span className="w-1 rounded-full bg-glow animate-bar-1" />
              <span className="w-1 rounded-full bg-glow animate-bar-3" />
              <span className="w-1 rounded-full bg-glow animate-bar-5" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};