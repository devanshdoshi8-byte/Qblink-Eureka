import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Clock,
  MapPin,
  RefreshCw,
  Sparkles,
  Users,
  Wifi,
  BellRing,
  Timer,
  Hourglass,
  ShieldCheck,
  Zap,
  Bookmark,
  Share2,
  CheckCircle2,
  AlertCircle,
  Footprints,
} from "lucide-react";
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
 * Enhanced Tactile Boarding Pass & Live Waiting Experience.
 * Features:
 * - 3-Step Dynamic Journey Stepper (Joined -> Get Ready -> Head to Counter)
 * - Tactile Ticket Pass styling with cut-out notches and watermark
 * - One-tap arrival grace extension ("I'm 2 mins away")
 * - Pass bookmark / Native Web Share helper
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

  const handleSharePass = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My Qblink Queue Pass #${myToken}`,
          text: `Tracking my live queue position (#${myToken}) on Qblink. Estimated wait: ${waitMinutes} mins.`,
          url: window.location.href,
        });
        hapticSuccess();
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      hapticSuccess();
      toast.success("Pass link copied!", {
        description: "Bookmark or save this link to reopen your pass anytime.",
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

  // Keyboard shortcut: R to refresh
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
        try {
          (navigator as any).vibrate?.(20);
        } catch {}
      }
    }
    prevAheadRef.current = ahead;
  }, [ahead]);

  // Determine current Stepper stage: 1 = Joined, 2 = Getting Closer (ahead <= 2), 3 = Called / Now Serving (ahead === 0)
  const currentStep = ahead === 0 ? 3 : ahead <= 2 ? 2 : 1;

  // Rotating microcopy
  const lines = [
    "You are waiting with live visibility.",
    "Adaptive service velocity updates automatically in real-time.",
    "Qblink gives you freedom to wait comfortably anywhere.",
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
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
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

      {/* Tactile Boarding Pass Container with Notch Cutouts */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative rounded-3xl border-2 border-primary/20 bg-card/85 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_24px_70px_-20px_hsl(var(--primary)/0.35)] dark:bg-[hsl(215_50%_14%)] dark:border-primary/40 overflow-hidden"
      >
        {/* Ticket Watermark */}
        <div className="absolute right-3 top-2 text-[6.5rem] font-black tracking-tighter text-primary/5 select-none pointer-events-none -rotate-12">
          #{myToken}
        </div>

        {/* Top Pass Status Strip */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-mono font-bold tracking-wider uppercase border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Queue Pass
            </span>
            <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
              Verified Token
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSharePass}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Save or Share Pass"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
              <Wifi className="w-3 h-3 text-emerald-500" />
              <span>Synced</span>
            </div>
          </div>
        </div>

        {/* 3-Step Journey Stepper */}
        <div className="mb-6 bg-muted/40 dark:bg-muted/20 rounded-2xl p-3 border border-border/60">
          <div className="flex items-center justify-between relative">
            {/* Connecting Track */}
            <div className="absolute left-6 right-6 top-3.5 h-0.5 bg-border -z-0" />
            <div
              className="absolute left-6 top-3.5 h-0.5 bg-primary transition-all duration-700 -z-0"
              style={{
                width: currentStep === 3 ? "calc(100% - 3rem)" : currentStep === 2 ? "calc(50% - 1.5rem)" : "0%",
              }}
            />

            {/* Step 1 */}
            <div className="flex flex-col items-center gap-1 relative z-10">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  currentStep >= 1
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                ✓
              </div>
              <span className="text-[10px] font-bold text-foreground">Joined Line</span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-1 relative z-10">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  currentStep >= 2
                    ? "bg-amber-500 text-white ring-4 ring-amber-500/20 animate-pulse"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
              <span className="text-[10px] font-bold text-foreground">Get Ready</span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-1 relative z-10">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  currentStep >= 3
                    ? "bg-emerald-600 text-white ring-4 ring-emerald-500/30 animate-bounce"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                3
              </div>
              <span className="text-[10px] font-bold text-foreground">Now Serving</span>
            </div>
          </div>
        </div>

        {/* Hero Token & Progress Ring */}
        <div className="flex items-center gap-5 sm:gap-6 my-2">
          {/* SVG Progress Ring with Token */}
          <div
            className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0"
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
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="url(#qb-ring)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 50}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - progressPct / 100) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground dark:text-foreground/70">
                Your Token
              </span>
              <span className="text-3xl sm:text-4xl font-black text-foreground leading-none tracking-tight">
                #{myToken}
              </span>
              <span className="text-[10px] text-primary font-bold mt-1">
                <AnimatedNumber value={progressPct} suffix="% closer" ariaLive={false} />
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground dark:text-foreground/70">
              Now Serving At Counter
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight">
              {typeof nowServing === "number" ? (
                <AnimatedNumber value={nowServing} prefix="#" invertHighlight ariaLive={false} />
              ) : (
                <span>—</span>
              )}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Activity className="w-3.5 h-3.5" />
              <span>{liveStatus}</span>
            </div>
          </div>
        </div>

        {/* Arrival Grace Window / Action Card */}
        {(ahead === 0 || liveStatus.includes("next") || currentStep >= 2) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-2 border-primary/30"
          >
            {graceStatus === "active" || graceStatus === "requested" ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center animate-pulse shrink-0">
                    <Hourglass className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Arrival Grace Window Active</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Staff knows you're walking over • Please head to the counter
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
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
                    <Footprints className="w-4 h-4 text-primary" />
                    <span>{ahead === 0 ? "You're called right now!" : "Your turn is approaching!"}</span>
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Walking from nearby? Tap to give staff a 2-minute arrival heads-up.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onRequestGrace}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Footprints className="w-3.5 h-3.5" />
                  <span>I'm 2 mins away</span>
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Dynamic Live Flow Track */}
        <div className="mt-5" aria-hidden="true">
          <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-muted-foreground dark:text-foreground/70 mb-2">
            <span>Counter</span>
            <span>Your Position</span>
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
                  <span className="text-[10px] text-muted-foreground ml-1 font-mono">+{ahead - aheadDots}</span>
                )}
              </div>
              <div className="h-6 px-2 rounded-md bg-foreground/90 text-background flex items-center text-[10px] font-bold shadow-md font-mono">
                #{myToken}
              </div>
            </div>
          </div>
        </div>

        {/* Stat Tiles */}
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <motion.div
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-border bg-background/70 backdrop-blur p-3.5 dark:bg-[hsl(215_45%_18%)] dark:border-primary/25 shadow-sm"
          >
            <dt className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-muted-foreground dark:text-foreground/70 mb-1">
              <Users className="w-3.5 h-3.5 text-primary" /> Ahead of you
            </dt>
            <dd className="text-xl font-black text-foreground">
              <AnimatedNumber value={ahead} ariaLive={false} />
            </dd>
          </motion.div>
          <motion.div
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-border bg-background/70 backdrop-blur p-3.5 dark:bg-[hsl(215_45%_18%)] dark:border-primary/25 shadow-sm"
          >
            <dt className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-muted-foreground dark:text-foreground/70 mb-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" /> Est. wait
              </span>
              {velocityConfidence && velocityConfidence >= 70 && (
                <span className="text-[9px] text-emerald-500 font-semibold flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" /> Live
                </span>
              )}
            </dt>
            <dd className="text-xl font-black text-foreground">
              <AnimatedNumber value={waitMinutes} suffix=" min" ariaLive={false} />
            </dd>
          </motion.div>
        </dl>

        {/* Push Notification Banner */}
        {pushState !== "granted" && (
          <motion.div
            layout
            className="mt-3.5 rounded-2xl border border-border bg-muted/40 p-3.5 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <BellRing className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Enable Turn Alerts</p>
                <p className="text-[10px] text-muted-foreground">Receive sound alerts when you're 2nd and Next.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors shrink-0"
            >
              Enable
            </button>
          </motion.div>
        )}

        {/* Saved-Time Counter */}
        {joinedAt && (
          <motion.div
            layout
            className="mt-3.5 rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3.5 flex items-center gap-3 dark:border-primary/35"
          >
            <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Timer className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground dark:text-foreground/70">
                Physical waiting avoided
              </p>
              <p className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                Qblink saved you <span className="text-primary font-black"><AnimatedNumber value={minutesSaved} suffix=" min" /></span> of standing in line.
              </p>
            </div>
          </motion.div>
        )}

        {/* Rotating Microcopy */}
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
              <Sparkles className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
              {lines[lineIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Bottom Refresh Button */}
        <button
          ref={refreshBtnRef}
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="mt-3.5 w-full min-h-11 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border/60 hover:bg-muted/50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
          <span>{isRefreshing ? "Updating live data…" : "Refresh live status"}</span>
          <kbd className="ml-1 hidden sm:inline-flex items-center rounded border border-border px-1.5 text-[10px] font-mono text-muted-foreground">
            R
          </kbd>
        </button>
      </motion.div>
    </section>
  );
};

export default LiveWaitingExperience;