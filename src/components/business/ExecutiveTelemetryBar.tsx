import React, { useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Gauge,
  HelpCircle,
  Info,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import {
  calculateQueueCongestion,
  calculateFlowVelocity,
  calculateArrivalReliability,
  calculateDailyOutput,
  getBusinessCustomerNoun,
  VisitorRecord,
} from "@/lib/telemetryEngine";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExecutiveTelemetryBarProps {
  queue?: {
    id: string;
    name: string;
    status: string;
    estimated_service_time: number | null;
  } | null;
  visitors?: VisitorRecord[];
  businessName?: string;
  className?: string;
}

export const ExecutiveTelemetryBar: React.FC<ExecutiveTelemetryBarProps> = ({
  queue,
  visitors = [],
  businessName,
  className = "",
}) => {
  const [activeInfo, setActiveInfo] = useState<string | null>(null);

  const waitingCount = visitors.filter((v) => v.status === "waiting").length;
  const nouns = getBusinessCustomerNoun(businessName || queue?.name);

  // 1. Congestion
  const congestion = calculateQueueCongestion({
    waitingCount,
    estimatedServiceMinutes: queue?.estimated_service_time,
    recentVisitors: visitors,
  });

  // 2. Velocity
  const velocity = calculateFlowVelocity({
    visitors,
    baselineMinutes: queue?.estimated_service_time,
  });

  // 3. Arrival Reliability
  const reliability = calculateArrivalReliability({
    visitors,
  });

  // 4. Daily Output
  const dailyOutput = calculateDailyOutput({
    visitors,
    customerNoun: nouns.plural,
  });

  const isQueueActive = queue?.status === "active";
  const isQueuePaused = queue?.status === "paused";

  return (
    <div
      aria-label="Executive Operations Telemetry"
      className={`w-full rounded-2xl bg-card border border-border/80 p-3.5 sm:p-4 shadow-sm mb-6 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isQueueActive ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isQueueActive ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          </span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Live Telemetry Strip
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
          <span className="text-xs font-semibold text-foreground hidden sm:inline truncate max-w-xs">
            {queue?.name || "All Queues"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              isQueueActive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : isQueuePaused
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                : "bg-muted text-muted-foreground border-border"
            }`}
          >
            {isQueueActive ? "Active Flow" : isQueuePaused ? "Paused" : "Closed"}
          </span>
        </div>
      </div>

      {/* The 4 Telemetry Signals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Signal 1: Congestion Level */}
        <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" />
              <span>Congestion</span>
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Congestion calculation explanation"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs p-2.5">
                <p className="font-bold text-foreground mb-1">Queue Congestion Logic</p>
                <p className="text-muted-foreground">{congestion.reason}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="mt-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border ${congestion.badgeClass}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>{congestion.label}</span>
            </span>
            <span className="block text-[11px] text-muted-foreground mt-1">
              {waitingCount} {waitingCount === 1 ? nouns.singular : nouns.plural} waiting (~{congestion.estimatedWaitMinutes}m)
            </span>
          </div>
        </div>

        {/* Signal 2: Flow Velocity */}
        <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              <span>Flow Velocity</span>
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Flow velocity calculation explanation"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs p-2.5">
                <p className="font-bold text-foreground mb-1">Service Velocity</p>
                <p className="text-muted-foreground">{velocity.explanation}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="mt-2">
            <span
              className={`font-mono text-sm sm:text-base font-black ${
                velocity.hasData ? "text-foreground" : "text-muted-foreground italic text-xs"
              }`}
            >
              {velocity.displayValue}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
              {velocity.trend === "faster" && (
                <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
              )}
              {velocity.trend === "slower" && (
                <TrendingDown className="w-3 h-3 text-amber-500 shrink-0" />
              )}
              <span className="truncate">{velocity.trendLabel}</span>
            </div>
          </div>
        </div>

        {/* Signal 3: Arrival Reliability */}
        <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Attendance</span>
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Attendance calculation explanation"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs p-2.5">
                <p className="font-bold text-foreground mb-1">On-Time Attendance</p>
                <p className="text-muted-foreground">{reliability.explanation}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="mt-2">
            <span
              className={`font-mono text-sm sm:text-base font-black ${
                reliability.hasData ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground italic text-xs"
              }`}
            >
              {reliability.displayValue}
            </span>
            <span className="block text-[11px] text-muted-foreground mt-1 truncate">
              {reliability.hasData
                ? `${reliability.onTimeCount} of ${reliability.totalDecisions} on time`
                : "Awaiting 3 calls today"}
            </span>
          </div>
        </div>

        {/* Signal 4: Today's Output */}
        <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Served Today</span>
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Served today explanation"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs p-2.5">
                <p className="font-bold text-foreground mb-1">Completed Customers</p>
                <p className="text-muted-foreground">
                  Total {nouns.plural} marked as served during today's session.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="mt-2">
            <span className="font-mono text-sm sm:text-base font-black text-foreground">
              {dailyOutput.servedCount} {nouns.plural}
            </span>
            <span className="block text-[11px] text-muted-foreground mt-1">
              Completed since midnight
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveTelemetryBar;
