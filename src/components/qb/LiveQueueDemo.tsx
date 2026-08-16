import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, FastForward, CheckCircle2, Bell, Sparkles, Activity } from "lucide-react";

const TOTAL_AHEAD = 6;
const TICK_MS = 2800;

export const LiveQueueDemo = () => {
  const [position, setPosition] = useState(TOTAL_AHEAD);
  const [phase, setPhase] = useState<"waiting" | "almost" | "called" | "done">("waiting");
  const [paused, setPaused] = useState(false);
  const [tokenNum] = useState("A-42");

  const estWait = Math.max(1, position * 3);

  const reset = useCallback(() => {
    setPosition(TOTAL_AHEAD);
    setPhase("waiting");
  }, []);

  const advanceOne = useCallback(() => {
    setPosition((p) => {
      const next = p - 1;
      if (next <= 0) {
        setPhase("called");
        setTimeout(() => setPhase("done"), 3200);
        return 0;
      }
      if (next <= 2) setPhase("almost");
      return next;
    });
  }, []);

  useEffect(() => {
    if (paused) return;
    if (phase === "done") return;

    const t = setInterval(advanceOne, TICK_MS);
    return () => clearInterval(t);
  }, [paused, phase, advanceOne]);

  // Radius for circular progress ring
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progressFraction = (TOTAL_AHEAD - position) / TOTAL_AHEAD;
  const strokeDashoffset = circumference - progressFraction * circumference;

  return (
    <section id="demo" className="relative py-24 md:py-32 overflow-hidden bg-[hsl(var(--surface-warm)/0.4)]" aria-label="Interactive demo">
      {/* Background kinetic ambient halos */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-[hsl(var(--brand-glow)/0.07)] blur-3xl animate-pulse-halo pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-[hsl(var(--brand-blue)/0.08)] blur-3xl animate-float-reverse pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Context & Interactive Controls */}
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 font-mono-caps text-primary mb-4 text-xs tracking-[0.2em] uppercase font-semibold">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                Ch. 04 · Interactive Simulation
              </div>

              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground leading-[1.02]">
                Watch the wait
                <br />
                <span className="text-primary relative inline-block">
                  dissolve in real time.
                  <span className="absolute left-0 bottom-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-60 rounded-full" />
                </span>
              </h2>

              <p className="mt-6 text-muted-foreground text-base sm:text-lg max-w-lg leading-relaxed">
                This is the exact experience waiting customers hold on their phone. An honest live counter,
                proactive arrival alerts, and zero anxiety standing in line.
              </p>

              {/* Interactive Director Controls */}
              <div className="mt-8 p-4 rounded-2xl bg-card border border-border/80 shadow-sm max-w-md">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Simulator Controls</span>
                  <span className="flex items-center gap-1 text-[11px] text-primary">
                    <Activity className="w-3 h-3 animate-pulse" /> Live engine
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaused((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:brightness-110 active:scale-95 transition-all shadow-sm"
                  >
                    {paused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                    {paused ? "Resume Flow" : "Pause"}
                  </button>

                  <button
                    type="button"
                    onClick={advanceOne}
                    disabled={phase === "done"}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted active:scale-95 transition-all disabled:opacity-40"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    Call Next
                  </button>

                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-full bg-success" />
                <span>Simulating 3-minute average service rhythm</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: High-Fidelity Smartphone Stage */}
          <div className="lg:col-span-6 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[340px] sm:max-w-[360px]"
            >
              {/* Kinetic Atmospheric Outer Halo */}
              <div className={`absolute -inset-4 rounded-[3.5rem] opacity-60 blur-xl transition-colors duration-1000 ${
                phase === "called" || phase === "done" ? "bg-success/30" : phase === "almost" ? "bg-warning/25" : "bg-primary/20"
              }`} />

              {/* Phone Frame */}
              <div className="relative rounded-[3rem] border-[7px] border-foreground/15 bg-card shadow-2xl overflow-hidden backdrop-blur-md">
                {/* Phone Speaker Notch */}
                <div className="h-8 bg-card flex items-center justify-between px-7 pt-1">
                  <span className="text-[0.6875rem] font-semibold text-foreground/80 tabular-nums">9:41</span>
                  <div className="w-20 h-4 bg-foreground/10 rounded-full flex items-center justify-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-foreground/20" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-2 rounded-sm bg-foreground/30" />
                  </div>
                </div>

                {/* App Content */}
                <div className="p-6 min-h-[460px] flex flex-col justify-between relative overflow-hidden">
                  {/* Top Bar / Brand header */}
                  <div className="flex items-center justify-between pb-4 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-sm">
                        <Sparkles className="w-5 h-5 text-white animate-pulse" />
                      </div>
                      <div>
                        <div className="font-display text-sm font-bold text-foreground">City Life Health</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                          Live Queue Active
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-mono-caps text-muted-foreground uppercase">Token</div>
                      <div className="font-display text-sm font-extrabold text-foreground">#{tokenNum}</div>
                    </div>
                  </div>

                  {/* Central Position Ring Display */}
                  <div className="my-auto py-6 flex flex-col items-center justify-center relative">
                    <AnimatePresence mode="wait">
                      {phase === "called" || phase === "done" ? (
                        <motion.div
                          key="called"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ type: "spring", damping: 15, stiffness: 200 }}
                          className="text-center space-y-4"
                        >
                          <div className="relative mx-auto w-24 h-24 rounded-full bg-success/15 flex items-center justify-center animate-pulse">
                            <div className="absolute inset-0 rounded-full border-2 border-success/40 animate-ping" />
                            <CheckCircle2 className="w-12 h-12 text-success" />
                          </div>

                          <div>
                            <div className="font-display text-2xl font-bold text-success">It's Your Turn!</div>
                            <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                              Please proceed to Counter 2 with Token <strong className="text-foreground">#{tokenNum}</strong>
                            </p>
                          </div>

                          <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-success text-white text-xs font-bold shadow-md shadow-success/30"
                          >
                            <Bell className="w-3.5 h-3.5" /> Check-in Confirmed
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="position"
                          className="relative flex flex-col items-center justify-center"
                        >
                          {/* Circular SVG Progress Ring */}
                          <div className="relative w-44 h-44 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                              {/* Background Track */}
                              <circle
                                cx="60"
                                cy="60"
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="7"
                                className="text-muted/40"
                              />
                              {/* Animated Progress Stroke */}
                              <motion.circle
                                cx="60"
                                cy="60"
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="7"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                animate={{ strokeDashoffset }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className={phase === "almost" ? "text-warning" : "text-primary"}
                              />
                            </svg>

                            {/* Centered Number */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-[10px] font-mono-caps text-muted-foreground uppercase tracking-widest font-semibold">
                                Position
                              </span>
                              <motion.span
                                key={position}
                                initial={{ scale: 0.7, opacity: 0, y: -10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                className="font-display text-5xl sm:text-6xl font-extrabold text-foreground tabular-nums tracking-tighter"
                              >
                                {position}
                              </motion.span>
                              <span className="text-[11px] text-muted-foreground font-medium">
                                {position === 1 ? "1 person ahead" : `${position} people ahead`}
                              </span>
                            </div>
                          </div>

                          {/* Sound wave activity bars */}
                          <div className="flex items-center gap-1 mt-4 h-4">
                            <span className="w-1 rounded-full bg-primary/70 animate-bar-1" />
                            <span className="w-1 rounded-full bg-primary/70 animate-bar-2" />
                            <span className="w-1 rounded-full bg-primary/70 animate-bar-3" />
                            <span className="w-1 rounded-full bg-primary/70 animate-bar-4" />
                            <span className="w-1 rounded-full bg-primary/70 animate-bar-5" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Bottom Status Card */}
                  <div className="pt-4 border-t border-border/60 space-y-3">
                    {phase !== "called" && phase !== "done" && (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Estimated wait:</span>
                          <motion.span
                            key={estWait}
                            initial={{ opacity: 0, x: 5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="font-bold text-foreground tabular-nums text-sm"
                          >
                            ~{estWait} minutes
                          </motion.span>
                        </div>

                        {phase === "almost" ? (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl bg-warning/15 border border-warning/30 p-2.5 text-center flex items-center justify-center gap-2"
                          >
                            <span className="w-2 h-2 rounded-full bg-warning animate-ping" />
                            <span className="text-xs font-bold text-warning">Almost your turn · Head to desk</span>
                          </motion.div>
                        ) : (
                          <div className="rounded-xl bg-muted/60 p-2.5 text-center">
                            <p className="text-[11px] text-muted-foreground">
                              Wait from anywhere · You'll get alerted at #2
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    <div className="text-center text-[10px] font-mono-caps text-muted-foreground/60">
                      Auto-synchronizing via Qblink Realtime
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
