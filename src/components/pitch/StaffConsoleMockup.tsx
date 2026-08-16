import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  CheckCircle2,
  Users,
  Clock,
  Zap,
  Plus,
  Pause,
  Play,
  Activity,
  UserCheck,
  Hourglass,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { PitchSimulatorState, SimulatedVisitor } from "@/lib/pitchSimulationEngine";

interface StaffConsoleMockupProps {
  state: PitchSimulatorState;
  onCallNext: () => void;
  onServeCurrent: () => void;
  onSimulateTraffic: () => void;
  onTogglePause: () => void;
}

export const StaffConsoleMockup: React.FC<StaffConsoleMockupProps> = ({
  state,
  onCallNext,
  onServeCurrent,
  onSimulateTraffic,
  onTogglePause,
}) => {
  return (
    <div className="flex flex-col h-full rounded-3xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden">
      {/* Mac Window Frame Header */}
      <div className="px-5 py-3.5 border-b border-border/60 bg-muted/40 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="ml-3 text-xs font-bold font-mono tracking-tight text-foreground/80">
            Qblink Counter Terminal • {state.counterName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync Active
          </span>
        </div>
      </div>

      {/* Main Console Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-6 overflow-y-auto">
        {/* Venue & Queue Header */}
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">{state.businessName}</h2>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{state.queueName}</p>
          </div>
          <button
            onClick={onTogglePause}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              state.isPaused
                ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
            }`}
          >
            {state.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{state.isPaused ? "Resume Queue" : "Pause Queue"}</span>
          </button>
        </div>

        {/* Live Metrics Quad */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Now Serving Card */}
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
              <Phone className="w-3 h-3" /> Now Serving
            </span>
            <motion.p
              key={state.nowServing?.token || "none"}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-black font-mono text-foreground mt-1"
            >
              {state.nowServing ? state.nowServing.token : "—"}
            </motion.p>
            <span className="text-[11px] text-muted-foreground truncate">
              {state.nowServing ? state.nowServing.name : "Queue idle"}
            </span>
          </div>

          {/* Waiting Count */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" /> In Line
            </span>
            <p className="text-2xl font-black text-foreground mt-1">{state.waitingList.length}</p>
            <span className="text-[11px] text-muted-foreground">Waiting guests</span>
          </div>

          {/* Flow Pace */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Velocity
            </span>
            <p className="text-2xl font-black text-foreground mt-1">{state.velocityMinutes}m</p>
            <span className="text-[11px] text-muted-foreground">Per turn pace</span>
          </div>

          {/* Total Served */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-emerald-500" /> Served
            </span>
            <p className="text-2xl font-black text-foreground mt-1">{state.servedList.length}</p>
            <span className="text-[11px] text-muted-foreground">Completed today</span>
          </div>
        </div>

        {/* Primary Staff Dispatch Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCallNext}
            disabled={state.waitingList.length === 0 || state.isPaused}
            className="flex-1 min-w-[160px] py-3.5 px-6 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm shadow-lg shadow-primary/25 hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            <Phone className="w-4 h-4" />
            <span>Call Next Guest</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono hidden sm:inline-block">
              [Space]
            </span>
          </motion.button>

          {state.nowServing && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onServeCurrent}
              className="py-3.5 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-500/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Served</span>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSimulateTraffic}
            className="py-3.5 px-4 rounded-2xl bg-muted/60 border border-border text-foreground font-bold text-xs hover:bg-muted flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-primary" />
            <span>+3 Walk-ins</span>
          </motion.button>
        </div>

        {/* Live Waiting Queue Table */}
        <div className="flex-1 border border-border/60 rounded-2xl overflow-hidden bg-background/50 flex flex-col">
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Live Queue Manifest ({state.waitingList.length} waiting)</span>
            <span className="text-[10px] text-muted-foreground">Order of Arrival</span>
          </div>

          <div className="divide-y divide-border/40 overflow-y-auto max-h-[220px]">
            {state.waitingList.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Queue is empty. Click "+3 Walk-ins" to simulate arrivals.
              </div>
            ) : (
              state.waitingList.map((visitor, idx) => {
                const isJudge = visitor.isUser;
                const isGrace = visitor.status === "grace";
                return (
                  <motion.div
                    key={visitor.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`px-4 py-2.5 flex items-center justify-between text-xs transition-colors ${
                      isJudge
                        ? "bg-primary/10 border-l-4 border-l-primary font-semibold"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-muted-foreground font-mono text-[11px]">
                        #{idx + 1}
                      </span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        {visitor.token}
                      </span>
                      <span className="text-foreground/90 font-medium">
                        {visitor.name}
                      </span>
                      {isJudge && (
                        <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-wide">
                          Judge Phone
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isGrace ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center gap-1">
                          <Hourglass className="w-3 h-3 animate-spin" /> Grace Hold (2m)
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px] font-mono">
                          ~{(idx + 1) * state.velocityMinutes}m wait
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Activity Log Bar */}
        <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            <span className="truncate">
              {state.recentActivity[0]?.text || "Queue initialized"}
            </span>
          </div>
          <span className="font-mono text-[10px] shrink-0 text-muted-foreground/70">
            {state.recentActivity[0]?.time || "Live"}
          </span>
        </div>
      </div>
    </div>
  );
};
