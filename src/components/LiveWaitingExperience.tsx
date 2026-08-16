import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Activity, Clock, MapPin, RefreshCw, Sparkles, Users, Wifi, BellRing, Timer, Hourglass, ShieldCheck, Zap } from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { WebPushProvider, NotificationPermissionState } from "@/lib/notifications/providers/webPushProvider";
import { formatGraceCountdown, getRemainingGraceSeconds, GraceStatus } from "@/lib/arrivalGraceEngine";
import { toast } from "sonner";
import { hapticSuccess } from "@/lib/haptics";

interface Props {
  ahead: number;
  waitMinutes: number;
  liveStatus: string;
  myToken: number | null;
  nowServing: number | null;
  serviceTime: number;
  onRefresh: () => void;
  /** Number of people ahead when the user first joined. Used to compute true progress %. */
  initialAhead?: number;
  /** Epoch ms when the user joined. Used to compute saved-time counter. */
  joinedAt?: number;
  /** Arrival grace period support */
  graceStatus?: GraceStatus;
  graceExpiresAt?: number | null;
  onRequestGrace?: () => void;
  /** Dynamic rolling velocity metadata */
  velocityConfidence?: number;
  effectiveVelocity?: number;
}

/**
 * Futuristic live waiting experience.
 * Enhanced with:
 * - Feature A: "I'm 2 mins away" customer arrival grace action & countdown
 * - Feature B: Proactive notification preferences and push activation
 * - Feature E: Dynamic rolling velocity indicator & predictive bounds
 */
const LiveWaitingExperience = ({
  ahead,
  waitMinutes,
  liveStatus,
  myToken,
  nowServing,
  serviceTime,
  onRefresh,
  initialAhead,
  joinedAt,
  graceStatus = "none",
  graceExpiresAt,
  onRequestGrace,
  velocityConfidence,
  effectiveVelocity,
}: Props) => {
  // Refresh button state — provides visible + assistive feedback while updating.
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshBtnRef = useRef<HTMLButtonElement | null>(null);
  const [pushState, setPushState] = useState<NotificationPermissionState>(() => WebPushProvider.getPermission());
  const [graceRemaining, setGraceRemaining] = useState<number>(0);

  useEffect(() => {
    if (graceExpiresAt) {
      const update = () => setGraceRemaining(getRemainingGraceSeconds(graceExpiresAt));
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }
  }, [graceExpiresAt]);

  const handleEnableNotifications = async () => {
    const res = await WebPushProvider.requestPermission();
    setPushState(res);
    if (res === "granted") {
      hapticSuccess();
      toast.success("Turn alerts enabled!", {
        description: "We'll notify you even if your phone screen is locked or browser is in the background.",
      });
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.resolve(onRefresh());
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Global keyboard shortcut: press "R" to refresh the queue
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        refreshBtnRef.current?.focus();
        handleRefresh();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRefreshing]);

  // True position-based progress
  const baseline = Math.max(initialAhead ?? ahead, ahead, 1);
  const moved = Math.max(baseline - ahead, 0);
  const progressPct = Math.min(100, Math.round((moved / baseline) * 100));

  // Saved-time counter
  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const minutesSaved = joinedAt ? Math.max(0, Math.floor((nowTs - joinedAt) / 60_000)) : 0;

  // Sound + haptic on queue progress
  const prevAheadRef = useRef<number>(ahead);
  const [pulseMove, setPulseMove] = useState(0);
  useEffect(() => {
    const prev = prevAheadRef.current;
    if (ahead < prev) {
      setPulseMove((n) => n + 1);
      try {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (Ctx) {
          const ctx = new Ctx();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.value = 880;
          g.gain.setValueAtTime(0, ctx.currentTime);
          g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
          g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);
          o.connect(g).connect(ctx.destination);
          o.start();
          o.stop(ctx.currentTime + 0.2);
          setTimeout(() => ctx.close(), 400);
        }
      } catch {}
      if ("vibrate" in navigator) {
        try { (navigator as any).vibrate?.(20); } catch {}
      }
    }
    prevAheadRef.current = ahead;
  }, [ahead]);

  // Rotating microcopy
  const lines = [
    "You are waiting with live visibility.",
    "Adaptive service velocity adapts to counter speed in real-time.",
    "Qblink is helping you wait comfortably anywhere.",
    "No crowded rooms. 100% time certainty.",
  ];
  const [lineIdx, setLineIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setLineIdx((i) => (i + 1) % lines.length), 4200);
    return () => clearInterval(t);
  }, []);

  const aheadDots = Math.min(ahead, 6);

  return (
    <section className="relative w-full" aria-label="Live queue status">
      {/* Ambient motion background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
        <motion.div
          aria-hidden
          className="absolute -top-16 -left-10 h-56 w-56 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.35), transparent 70%)" }}
          animate={{ x: [0, 30, -10, 0], y: [0, 20, -15, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--secondary)/0.30), transparent 70%)" }}
          animate={{ x: [0, -25, 15, 0], y: [0, -20, 10, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Glassy hero card with progress ring */}
      <motion.div
        initial={{ opacity: 0, y: 12, rotateX: -6 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        style={{ transformPerspective: 900 }}
        className="relative rounded-2xl border border-primary/15 bg-card/70 backdrop-blur-xl p-5 shadow-[0_20px_60px_-25px_hsl(var(--primary)/0.45)] dark:bg-[hsl(215_50%_15%)] dark:border-primary/40"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            <motion.span
              className="relative inline-flex h-2 w-2 rounded-full bg-primary"
              animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            Live Flow
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground dark:text-foreground/70">
            <Wifi className="w-3 h-3" /> Realtime
          </div>
        </div>

        <div className="flex items-center gap-5">
          {/* SVG progress ring */}
          <div
            className="relative h-28 w-28 shrink-0"
            role="progressbar"
            aria-label={`Queue progress for token ${myToken ?? ""}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPct}
          >
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id="qb-ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--secondary))" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="50" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" opacity="0.7" />
              <motion.circle
                cx="60" cy="60" r="50" fill="none"
                stroke="url(#qb-ring)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 50}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - progressPct / 100) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground dark:text-foreground/70">Token</span>
              <span className="text-2xl font-extrabold text-foreground leading-none">#{myToken}</span>
              <span className="text-[10px] text-primary font-semibold mt-0.5">
                <AnimatedNumber value={progressPct} suffix="% closer" ariaLive={false} />
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground dark:text-foreground/70">Now serving</p>
            <p className="text-3xl font-extrabold text-foreground leading-tight">
              {typeof nowServing === "number" ? (
                <AnimatedNumber value={nowServing} prefix="#" invertHighlight ariaLive={false} />
              ) : (
                <span>—</span>
              )}
            </p>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              <Activity className="w-3 h-3" /> {liveStatus}
            </div>
          </div>
        </div>

        {/* Feature A: "I'm 2 Minutes Away" Arrival Grace Card */}
        {(ahead === 0 || liveStatus.includes("next")) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-2 border-primary/30"
          >
            {graceStatus === "active" || graceStatus === "requested" ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center animate-pulse">
                    <Hourglass className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Arrival Grace Window Active</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Staff notified you're approaching • Head to the counter
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-base font-black text-amber-500 block">
                    {formatGraceCountdown(graceRemaining)}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Remaining</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span>You're next in line!</span>
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Walking from nearby or parking? Request a short 2-minute arrival grace.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onRequestGrace}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all shadow-sm shrink-0"
                >
                  I'm 2 mins away
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Queue flow line */}
        <div className="mt-5" aria-hidden="true">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground dark:text-foreground/70 mb-2">
            <span>Counter</span>
            <span>You</span>
          </div>
          <div className="relative h-10 rounded-xl bg-gradient-to-r from-primary/15 via-primary/8 to-transparent overflow-hidden border border-primary/15 dark:border-primary/30">
            <motion.div
              aria-hidden
              className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-primary/40 to-transparent"
              animate={{ x: ["-20%", "120%"] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-3">
              <div className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-md">
                {nowServing ?? "•"}
              </div>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: aheadDots }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary/40"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.18 }}
                  />
                ))}
                {ahead > aheadDots && (
                  <span className="text-[10px] text-muted-foreground ml-1">+{ahead - aheadDots}</span>
                )}
              </div>
              <div className="h-6 px-2 rounded-md bg-foreground/90 text-background flex items-center text-[10px] font-bold shadow-md">
                #{myToken}
              </div>
            </div>
          </div>
        </div>

        {/* Stat tiles */}
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <motion.div
            whileHover={{ y: -2 }}
            className="rounded-xl border border-border bg-background/70 backdrop-blur p-3 dark:bg-[hsl(215_45%_18%)] dark:border-primary/25"
          >
            <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground dark:text-foreground/70 mb-1">
              <Users className="w-3 h-3" /> Ahead of you
            </dt>
            <dd className="text-lg font-bold text-foreground">
              <AnimatedNumber value={ahead} ariaLive={false} />
            </dd>
          </motion.div>
          <motion.div
            whileHover={{ y: -2 }}
            className="rounded-xl border border-border bg-background/70 backdrop-blur p-3 dark:bg-[hsl(215_45%_18%)] dark:border-primary/25"
          >
            <dt className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground dark:text-foreground/70 mb-1">
              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Estimated wait</span>
              {velocityConfidence && velocityConfidence >= 70 && (
                <span className="text-[9px] text-emerald-500 font-semibold flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" /> Live Velocity
                </span>
              )}
            </dt>
            <dd className="text-lg font-bold text-foreground">
              <AnimatedNumber value={waitMinutes} suffix="m" ariaLive={false} />
            </dd>
          </motion.div>
        </dl>

        {/* Feature B: Proactive Push Notification Banner */}
        {pushState !== "granted" && (
          <motion.div
            layout
            className="mt-3 rounded-xl border border-border bg-muted/40 p-3 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <BellRing className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Get Turn Alerts</p>
                <p className="text-[10px] text-muted-foreground">Receive sound & push alerts when you're 5th, 2nd, and Next.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors shrink-0"
            >
              Enable
            </button>
          </motion.div>
        )}

        {/* Saved-time counter */}
        {joinedAt && (
          <motion.div
            layout
            className="mt-3 rounded-xl border border-primary/15 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3 flex items-center gap-3 dark:border-primary/35"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Timer className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground dark:text-foreground/70">
                Physical waiting avoided
              </p>
              <p className="text-sm font-bold text-foreground leading-tight">
                Qblink saved you <span className="text-primary"><AnimatedNumber value={minutesSaved} suffix=" min" /></span> of standing in line.
              </p>
            </div>
          </motion.div>
        )}

        {/* Rotating microcopy */}
        <div className="mt-4 h-5 overflow-hidden text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={lineIdx}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xs font-medium text-primary/90"
            >
              <Sparkles className="inline w-3 h-3 mr-1 -mt-0.5" />
              {lines[lineIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        <button
          ref={refreshBtnRef}
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="mt-3 w-full min-h-11 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Refreshing…" : "Refresh now"}</span>
          <kbd className="ml-1 hidden sm:inline-flex items-center rounded border border-border px-1 text-[10px] font-mono text-muted-foreground">R</kbd>
        </button>
      </motion.div>
    </section>
  );
};

export default LiveWaitingExperience;