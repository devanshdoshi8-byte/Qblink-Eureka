import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Activity, CheckCircle, Clock, Users, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const tabs = ["Live queue", "Insights", "Queue health", "Tokens"];

/**
 * A stylised frame of the operator surface with live interactive mechanics.
 */
export const DashboardPreview = () => {
  const [servingNum, setServingNum] = useState(95);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setServingNum((n) => (n >= 98 ? 93 : n + 1));
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const queueRows = [
    { t: `A-${servingNum + 1}`, w: "waiting 3 min", s: "Next" },
    { t: `A-${servingNum + 2}`, w: "waiting 6 min", s: "" },
    { t: `A-${servingNum + 3}`, w: "waiting 9 min", s: "" },
    { t: `A-${servingNum + 4}`, w: "waiting 14 min", s: "Remote" },
  ];

  return (
    <section className="relative hero-stage py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 stage-grid" aria-hidden />

      {/* Atmospheric lighting */}
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-[hsl(var(--brand-glow)/0.06)] rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 z-10">
        <div className="max-w-2xl">
          <div className="font-mono-caps stage-accent mb-4 flex items-center gap-2 text-xs tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--brand-glow))] animate-ping" />
            Ch. 06 · The Operator Surface
          </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl stage-text leading-[1.02]">
            Everything at the counter,
            <br />
            <span className="stage-accent">on one calm screen.</span>
          </h2>
          <p className="mt-5 stage-muted max-w-lg text-base sm:text-lg leading-relaxed">
            Serve, skip, recall, pause and transfer — with live wait forecasts, no-show protection
            and peak-hour intelligence updating as the queue moves.
          </p>
        </div>

        {/* Product frame */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 rounded-3xl glass-panel p-2.5 sm:p-4 overflow-hidden shadow-2xl border border-[hsl(var(--brand-glow)/0.2)]"
        >
          <div className="rounded-2xl bg-[hsl(var(--brand-navy))] border border-[hsl(var(--brand-cream)/0.08)] overflow-hidden">
            {/* Chrome Bar */}
            <div className="flex items-center justify-between px-5 h-12 border-b border-[hsl(var(--brand-cream)/0.08)] bg-[hsl(var(--brand-navy)/0.8)]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-destructive/60" />
                <span className="w-3 h-3 rounded-full bg-warning/60" />
                <span className="w-3 h-3 rounded-full bg-success/60" />
              </div>

              <div className="flex gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto no-scrollbar">
                {tabs.map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveTab(i)}
                    className={`whitespace-nowrap pb-1 transition-all ${
                      activeTab === i
                        ? "stage-text border-b-2 border-[hsl(var(--brand-glow))] text-[hsl(var(--brand-glow))]"
                        : "stage-muted hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] stage-accent font-mono-caps">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--brand-glow))] animate-pulse" />
                <span>Live Feed</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-px bg-[hsl(var(--brand-cream)/0.07)]">
              {/* Live Queue Column */}
              <div className="bg-[hsl(var(--brand-navy))] p-6 sm:p-8">
                <div className="flex items-center justify-between mb-8 p-4 rounded-2xl bg-[hsl(var(--brand-cream)/0.04)] border border-[hsl(var(--brand-cream)/0.08)]">
                  <div>
                    <div className="text-xs tracking-[0.2em] uppercase stage-muted font-mono-caps font-bold">Now serving</div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={servingNum}
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -15, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="font-display text-5xl sm:text-6xl stage-accent font-extrabold tabular-nums tracking-tight"
                      >
                        A-{servingNum}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="text-right">
                    <div className="text-xs tracking-[0.2em] uppercase stage-muted font-mono-caps font-bold">In queue</div>
                    <div className="font-display text-5xl sm:text-6xl stage-text font-bold tabular-nums">
                      12
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {queueRows.map((r, i) => (
                    <motion.div
                      key={r.t}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={{ x: 3 }}
                      className="flex items-center gap-4 rounded-xl px-4 py-3 border border-[hsl(var(--brand-cream)/0.08)] transition-colors"
                      style={{ background: `hsl(var(--brand-cream) / ${i === 0 ? 0.08 : 0.03})` }}
                    >
                      <span className="font-display stage-text tabular-nums font-bold text-lg w-16">{r.t}</span>
                      <span className="text-xs stage-muted flex-1 font-medium">{r.w}</span>
                      {r.s && (
                        <span className="text-xs tracking-wider uppercase rounded-full px-2.5 py-0.5 stage-accent font-bold bg-[hsl(var(--brand-glow)/0.15)] border border-[hsl(var(--brand-glow)/0.4)]">
                          {r.s}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-2.5">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setServingNum((n) => n + 1)}
                    className="text-xs rounded-xl px-4 py-3 bg-[hsl(var(--brand-glow))] text-[hsl(var(--brand-navy))] font-bold shadow-md shadow-[hsl(var(--brand-glow)/0.3)] transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Serve Next Token
                  </motion.button>

                  {["Skip", "Recall", "Pause Queue"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      className="text-xs rounded-xl px-3.5 py-3 glass-panel stage-muted hover:text-white transition-colors"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intelligence & Analytics Column */}
              <div className="bg-[hsl(var(--brand-navy))] p-6 sm:p-8 space-y-6">
                <div>
                  <div className="flex items-center justify-between text-xs tracking-[0.2em] uppercase stage-muted mb-3 font-mono-caps font-bold">
                    <span>Hourly Flow Intensity</span>
                    <span className="text-[hsl(var(--brand-glow))] flex items-center gap-1">
                      <Activity className="w-3 h-3 animate-pulse" /> 5–7 PM Peak
                    </span>
                  </div>

                  <div className="flex items-end gap-2 h-28 p-2 rounded-xl bg-[hsl(var(--brand-cream)/0.03)] border border-[hsl(var(--brand-cream)/0.06)]">
                    {[28, 41, 36, 52, 74, 96, 88, 61, 44, 33, 47, 39].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: i * 0.04 }}
                        whileHover={{ scaleY: 1.1 }}
                        className="flex-1 rounded-t cursor-pointer transition-all"
                        style={{
                          background:
                            h > 80
                              ? "linear-gradient(to top, hsl(var(--brand-glow)), hsl(var(--brand-cyan)))"
                              : "hsl(var(--brand-teal) / 0.45)",
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex justify-between text-[0.6875rem] text-cream/40 mt-1.5 font-mono-caps">
                    <span>8 AM</span>
                    <span>12 PM</span>
                    <span>4 PM</span>
                    <span>8 PM</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { l: "Avg wait", v: "11 min", icon: Clock },
                    { l: "Served today", v: "148", icon: Users },
                    { l: "No-shows", v: "4", icon: ShieldAlert },
                    { l: "Flow Health", v: "94 / 100", icon: Sparkles },
                  ].map((m) => (
                    <motion.div
                      key={m.l}
                      whileHover={{ scale: 1.02 }}
                      className="rounded-xl glass-panel p-3.5 border border-[hsl(var(--brand-cream)/0.08)]"
                    >
                      <div className="flex items-center justify-between text-xs tracking-wider uppercase stage-muted font-mono-caps">
                        <span>{m.l}</span>
                        <m.icon className="w-3.5 h-3.5 text-[hsl(var(--brand-glow))]" />
                      </div>
                      <div className="font-display text-2xl stage-text font-bold mt-1">{m.v}</div>
                    </motion.div>
                  ))}
                </div>

                <div className="rounded-xl border border-[hsl(var(--brand-glow)/0.35)] bg-[hsl(var(--brand-glow)/0.08)] p-4 shadow-sm">
                  <div className="text-xs tracking-[0.18em] uppercase stage-accent font-bold mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--brand-glow))]" />
                    Qblink Intelligence Dispatch
                  </div>
                  <p className="text-xs stage-muted leading-relaxed">
                    Peak load detected between 5–7 PM. Opening Counter 2 for those two hours is projected
                    to reduce customer wait times by 38%.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-10">
          <motion.div whileHover={{ x: 3 }}>
            <Link
              to="/auth"
              className="group inline-flex items-center gap-2 text-sm stage-accent hover:brightness-125 transition font-semibold"
            >
              Launch your own live operator counter
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
