import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  Hourglass,
  QrCode,
  ShieldCheck,
  ChevronRight,
  Zap,
  Wifi,
  Battery,
} from "lucide-react";
import { PitchSimulatorState, deriveCustomerViewMetrics } from "@/lib/pitchSimulationEngine";

interface CustomerMobileMockupProps {
  state: PitchSimulatorState;
  onRequestGrace: () => void;
}

export const CustomerMobileMockup: React.FC<CustomerMobileMockupProps> = ({
  state,
  onRequestGrace,
}) => {
  const metrics = deriveCustomerViewMetrics(state);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Trigger dynamic phone notification toast on status changes
  useEffect(() => {
    if (metrics.status === "called") {
      setNotificationToast(`🎉 It's your turn! Proceed to ${state.counterName}`);
    } else if (metrics.status === "next") {
      setNotificationToast(`⚡ You're next in line! (0 people ahead)`);
    } else if (metrics.status === "grace") {
      setNotificationToast(`⏳ Arrival grace active (2 min hold)`);
    } else if (metrics.aheadCount <= 2 && metrics.aheadCount > 0) {
      setNotificationToast(`Ticket ${state.userToken}: ${metrics.aheadCount} people ahead`);
    }
    const timer = setTimeout(() => setNotificationToast(null), 4500);
    return () => clearTimeout(timer);
  }, [metrics.status, metrics.aheadCount, state.counterName, state.userToken]);

  return (
    <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[360px] aspect-[9/18.5] rounded-[48px] p-3.5 bg-slate-900 border-[7px] border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden select-none">
      {/* Dynamic Island / Top Notch Area */}
      <div className="relative z-30 pt-2 pb-1 px-4 flex items-center justify-between text-[11px] font-semibold text-slate-300">
        <span className="font-mono">9:41</span>
        {/* Dynamic Island Pill */}
        <div className="w-24 h-5 rounded-full bg-black flex items-center justify-center gap-2 px-2 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-mono text-emerald-400 font-bold">Qblink</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3" />
          <Battery className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Simulated Notification Dropper */}
      <AnimatePresence>
        {notificationToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-11 inset-x-4 z-40 p-3 rounded-2xl bg-slate-900/95 border border-primary/40 text-slate-100 shadow-2xl backdrop-blur-xl flex items-center gap-2.5"
          >
            <div className="w-7 h-7 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wide">Qblink Alert</p>
              <p className="text-xs font-semibold truncate">{notificationToast}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Internal Phone Viewport (Customer Ticket) */}
      <div className="relative z-10 flex-1 rounded-[36px] bg-background border border-border/50 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto text-foreground">
        {/* Customer Ticket Top Branding */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Digital Queue Pass</p>
              <h3 className="text-sm font-black text-foreground truncate max-w-[190px]">{state.businessName}</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live
            </span>
          </div>

          {/* Token Hero Showcase */}
          <div className="my-4 text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Your Token</span>
            <motion.div
              key={state.userToken}
              className="font-mono font-black text-4xl text-primary tracking-tight my-1"
              whileHover={{ scale: 1.05 }}
            >
              {state.userToken}
            </motion.div>
            <p className="text-xs text-muted-foreground font-medium">{state.queueName}</p>
          </div>

          {/* Dynamic Status Display Box */}
          <motion.div
            key={metrics.status}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`p-4 rounded-2xl border text-center transition-all ${
              metrics.status === "called"
                ? "bg-emerald-500/15 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-lg shadow-emerald-500/10"
                : metrics.status === "next"
                ? "bg-amber-500/15 border-amber-500 text-amber-950 dark:text-amber-100"
                : metrics.status === "grace"
                ? "bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-100 animate-pulse"
                : "bg-card border-border shadow-xs"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              {metrics.status === "called" ? (
                <Sparkles className="w-4 h-4 text-emerald-500" />
              ) : metrics.status === "next" ? (
                <Zap className="w-4 h-4 text-amber-500" />
              ) : metrics.status === "grace" ? (
                <Hourglass className="w-4 h-4 text-amber-500" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-primary" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider">{metrics.headline}</span>
            </div>
            <p className="text-xs opacity-80 leading-snug">{metrics.subtext}</p>
          </motion.div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-2.5 my-4">
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-center">
              <span className="text-[10px] text-muted-foreground block">Ahead of You</span>
              <span className="text-lg font-bold font-mono text-foreground">{metrics.aheadCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-center">
              <span className="text-[10px] text-muted-foreground block">Estimated Wait</span>
              <span className="text-lg font-bold font-mono text-foreground">{metrics.estimatedWaitMinutes}m</span>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
              <span>Queue Journey</span>
              <span className="font-mono">{metrics.progressPercentage}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${metrics.progressPercentage}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            </div>
          </div>
        </div>

        {/* Customer Interactive Grace Action */}
        <div className="space-y-3 pt-2">
          {(metrics.aheadCount <= 1 || metrics.status === "called") && metrics.status !== "grace" && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRequestGrace}
              className="w-full py-3 px-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-xs hover:bg-amber-500/20 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Hourglass className="w-3.5 h-3.5" />
              <span>I'm 2 Mins Away (Hold Spot)</span>
            </motion.button>
          )}

          <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40 text-[10px] text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Real-time browser updates. No app download needed.</span>
          </div>
        </div>
      </div>

      {/* iPhone Home Indicator Bar */}
      <div className="pt-2 pb-1 flex justify-center">
        <div className="w-32 h-1 rounded-full bg-slate-600" />
      </div>
    </div>
  );
};
