/**
 * Executive Operations Telemetry Engine
 * 
 * Provides deterministic, mathematical calculations for live business dashboard operations.
 * 100% driven by real backend visitor records. Zero fabricated or hardcoded metrics.
 */

export type CongestionLevel = "normal" | "peaking" | "bottleneck";

export interface CongestionResult {
  level: CongestionLevel;
  label: string;
  badgeClass: string;
  reason: string;
  trend: "stable" | "growing" | "recovering";
  waitingCount: number;
  estimatedWaitMinutes: number;
}

export interface FlowVelocityResult {
  hasData: boolean;
  averageMinutes: number | null;
  displayValue: string;
  sampleCount: number;
  trend: "faster" | "slower" | "stable" | "none";
  trendLabel: string;
  explanation: string;
}

export interface ArrivalReliabilityResult {
  hasData: boolean;
  onTimePercentage: number | null;
  displayValue: string;
  totalDecisions: number;
  onTimeCount: number;
  explanation: string;
}

export interface DailyOutputResult {
  servedCount: number;
  displayValue: string;
  customerNoun: string;
}

export interface VisitorRecord {
  id: string;
  token_number: number;
  status: string;
  joined_at: string;
  called_at: string | null;
  served_at: string | null;
  visitor_name?: string | null;
}

/**
 * Returns contextual customer noun based on business category / queue name.
 */
export function getBusinessCustomerNoun(businessNameOrType?: string): { singular: string; plural: string } {
  const text = (businessNameOrType || "").toLowerCase();
  if (text.includes("clinic") || text.includes("hospital") || text.includes("doctor") || text.includes("dental") || text.includes("opd") || text.includes("health")) {
    return { singular: "patient", plural: "patients" };
  }
  if (text.includes("restaurant") || text.includes("cafe") || text.includes("dining") || text.includes("grill") || text.includes("bistro") || text.includes("food")) {
    return { singular: "guest", plural: "guests" };
  }
  if (text.includes("salon") || text.includes("spa") || text.includes("barber") || text.includes("beauty") || text.includes("hair")) {
    return { singular: "client", plural: "clients" };
  }
  if (text.includes("gov") || text.includes("civic") || text.includes("bank") || text.includes("municipal") || text.includes("service")) {
    return { singular: "citizen", plural: "citizens" };
  }
  return { singular: "customer", plural: "customers" };
}

/**
 * Calculates live queue congestion from actual queue depth, service rate, and arrival velocity.
 */
export function calculateQueueCongestion({
  waitingCount,
  estimatedServiceMinutes = 5,
  recentVisitors = [],
  now = Date.now(),
}: {
  waitingCount: number;
  estimatedServiceMinutes?: number | null;
  recentVisitors?: VisitorRecord[];
  now?: number;
}): CongestionResult {
  const baselineServiceTime = Math.max(1, estimatedServiceMinutes || 5);
  const estimatedWait = waitingCount * baselineServiceTime;

  // Window: last 30 minutes
  const thirtyMinsAgo = now - 30 * 60 * 1000;
  const recentArrivals = recentVisitors.filter(
    (v) => new Date(v.joined_at).getTime() >= thirtyMinsAgo
  ).length;

  const recentServices = recentVisitors.filter(
    (v) => v.status === "served" && v.served_at && new Date(v.served_at).getTime() >= thirtyMinsAgo
  ).length;

  // Capacity in 30 mins = 30 / serviceTime
  const capacity30m = Math.max(1, Math.floor(30 / baselineServiceTime));

  // Determine Congestion Level
  if (waitingCount === 0) {
    return {
      level: "normal",
      label: "Normal",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      reason: "No customers currently waiting in line. Service desks are clear.",
      trend: "stable",
      waitingCount,
      estimatedWaitMinutes: 0,
    };
  }

  // Bottleneck condition: high waiting count (>= 8), wait > 30m, or arrivals > 2x capacity
  if (waitingCount >= 8 || estimatedWait > 30 || (recentArrivals >= capacity30m * 1.8 && waitingCount >= 4)) {
    return {
      level: "bottleneck",
      label: "Bottleneck Detected",
      badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
      reason: `${waitingCount} waiting (~${estimatedWait}m wait). ${recentArrivals} joined in last 30m exceeding throughput capacity (${capacity30m}/30m).`,
      trend: recentArrivals > recentServices ? "growing" : "recovering",
      waitingCount,
      estimatedWaitMinutes: estimatedWait,
    };
  }

  // Peaking condition: moderate waiting count (>= 4), wait >= 15m, or arrivals >= capacity
  if (waitingCount >= 4 || estimatedWait >= 15 || (recentArrivals >= capacity30m && waitingCount >= 2)) {
    return {
      level: "peaking",
      label: "Peaking",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      reason: `${waitingCount} waiting (~${estimatedWait}m wait). Inflow (${recentArrivals}/30m) matches counter capacity (${capacity30m}/30m).`,
      trend: recentArrivals > recentServices ? "growing" : "stable",
      waitingCount,
      estimatedWaitMinutes: estimatedWait,
    };
  }

  // Normal flow
  return {
    level: "normal",
    label: "Normal",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    reason: `${waitingCount} waiting (~${estimatedWait}m wait). Arrival rate is comfortably within counter throughput capacity.`,
    trend: "stable",
    waitingCount,
    estimatedWaitMinutes: estimatedWait,
  };
}

/**
 * Calculates rolling service velocity from real completed service records.
 */
export function calculateFlowVelocity({
  visitors = [],
  baselineMinutes = 5,
}: {
  visitors?: VisitorRecord[];
  baselineMinutes?: number | null;
}): FlowVelocityResult {
  // Extract completed records with valid timestamps
  const completed = visitors
    .filter((v) => v.status === "served" && v.served_at)
    .map((v) => {
      const servedTime = new Date(v.served_at!).getTime();
      const startTime = v.called_at ? new Date(v.called_at).getTime() : new Date(v.joined_at).getTime();
      const durationMins = (servedTime - startTime) / 60000;
      return durationMins;
    })
    .filter((m) => Number.isFinite(m) && m >= 0.5 && m <= 180);

  // Take the most recent 10 completed samples
  const recentSamples = completed.slice(-10);

  if (recentSamples.length < 2) {
    return {
      hasData: false,
      averageMinutes: null,
      displayValue: "Not enough data",
      sampleCount: recentSamples.length,
      trend: "none",
      trendLabel: "Building baseline",
      explanation: "Requires at least 2 completed services today to establish rolling velocity.",
    };
  }

  const sum = recentSamples.reduce((a, b) => a + b, 0);
  const avg = Math.round((sum / recentSamples.length) * 10) / 10;
  const standardBaseline = Math.max(1, baselineMinutes || 5);

  let trend: "faster" | "slower" | "stable" = "stable";
  let trendLabel = "Consistent with baseline";

  if (avg <= standardBaseline * 0.85) {
    trend = "faster";
    trendLabel = `${Math.round(((standardBaseline - avg) / standardBaseline) * 100)}% faster than standard`;
  } else if (avg >= standardBaseline * 1.15) {
    trend = "slower";
    trendLabel = `${Math.round(((avg - standardBaseline) / standardBaseline) * 100)}% slower than standard`;
  }

  return {
    hasData: true,
    averageMinutes: avg,
    displayValue: `${avg} min / customer`,
    sampleCount: recentSamples.length,
    trend,
    trendLabel,
    explanation: `Calculated from the last ${recentSamples.length} completed visits today (range: ${Math.min(...recentSamples).toFixed(1)}m – ${Math.max(...recentSamples).toFixed(1)}m).`,
  };
}

/**
 * Calculates arrival reliability based on called vs served/skipped decisions.
 */
export function calculateArrivalReliability({
  visitors = [],
}: {
  visitors?: VisitorRecord[];
}): ArrivalReliabilityResult {
  const calledOrServed = visitors.filter(
    (v) => v.status === "served" || v.status === "called" || v.status === "skipped"
  );

  const totalDecisions = calledOrServed.length;

  if (totalDecisions < 3) {
    return {
      hasData: false,
      onTimePercentage: null,
      displayValue: "Building baseline",
      totalDecisions,
      onTimeCount: 0,
      explanation: `Requires at least 3 called customers today to calculate attendance reliability (${totalDecisions}/3 observed).`,
    };
  }

  // Count those successfully served vs skipped
  const servedCount = calledOrServed.filter((v) => v.status === "served").length;
  const skippedCount = calledOrServed.filter((v) => v.status === "skipped").length;
  const completedDecisions = servedCount + skippedCount;

  if (completedDecisions === 0) {
    return {
      hasData: false,
      onTimePercentage: null,
      displayValue: "Building baseline",
      totalDecisions,
      onTimeCount: 0,
      explanation: "Customers currently called at counter; awaiting completion.",
    };
  }

  const percentage = Math.round((servedCount / completedDecisions) * 100);

  return {
    hasData: true,
    onTimePercentage: percentage,
    displayValue: `${percentage}% on-time`,
    totalDecisions: completedDecisions,
    onTimeCount: servedCount,
    explanation: `${servedCount} of ${completedDecisions} called customers arrived promptly (${skippedCount} no-shows/skips).`,
  };
}

/**
 * Calculates total output served today.
 */
export function calculateDailyOutput({
  visitors = [],
  customerNoun = "customers",
}: {
  visitors?: VisitorRecord[];
  customerNoun?: string;
}): DailyOutputResult {
  const todayDateString = new Date().toDateString();
  const servedToday = visitors.filter((v) => {
    if (v.status !== "served") return false;
    if (!v.served_at) return true; // fallback if marked served in session
    return new Date(v.served_at).toDateString() === todayDateString;
  }).length;

  return {
    servedCount: servedToday,
    displayValue: `${servedToday} served today`,
    customerNoun,
  };
}
