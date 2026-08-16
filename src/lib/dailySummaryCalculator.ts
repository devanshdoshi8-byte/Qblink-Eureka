/**
 * Daily Business Performance Summary Calculator
 *
 * Computes verifiable, data-backed operational summaries for business owners
 * at the close of each day or on-demand.
 *
 * Strict Rule: Never synthesize or fabricate metrics. If sample count is 0,
 * explicitly flag hasSufficientData = false.
 */

export interface VisitorHistoryRecord {
  id: string;
  token_number: number;
  status: string;
  joined_at: string;
  called_at: string | null;
  served_at: string | null;
}

export interface DailySummaryMetric<T> {
  value: T;
  hasData: boolean;
  sampleSize: number;
}

export interface DailyPerformanceReport {
  date: string;
  businessId: string;
  businessName: string;
  totalJoined: DailySummaryMetric<number>;
  totalServed: DailySummaryMetric<number>;
  totalNoShow: DailySummaryMetric<number>;
  totalSkipped: DailySummaryMetric<number>;
  avgWaitMinutes: DailySummaryMetric<number>;
  avgServiceMinutes: DailySummaryMetric<number>;
  noShowRatePct: DailySummaryMetric<number>;
  peakHour: DailySummaryMetric<string | null>;
  peakHourCount: number;
  flowEfficiencyScore: DailySummaryMetric<number>;
  hourlyDistribution: Array<{ hour: number; label: string; count: number }>;
}

export function computeDailyPerformanceSummary({
  businessId,
  businessName,
  date = new Date().toISOString().split("T")[0],
  visitors = [],
}: {
  businessId: string;
  businessName: string;
  date?: string;
  visitors: VisitorHistoryRecord[];
}): DailyPerformanceReport {
  const totalJoinedCount = visitors.length;
  const servedList = visitors.filter((v) => v.status === "served");
  const noShowList = visitors.filter((v) => v.status === "skipped" || v.status === "removed");

  // Average wait time calculation (joined_at -> served_at / called_at)
  const waitDurations: number[] = [];
  servedList.forEach((v) => {
    const end = v.called_at ? new Date(v.called_at).getTime() : v.served_at ? new Date(v.served_at).getTime() : null;
    const start = new Date(v.joined_at).getTime();
    if (end && start && end > start) {
      const mins = (end - start) / 60000;
      if (mins < 480) waitDurations.push(mins);
    }
  });

  const avgWait = waitDurations.length
    ? Math.round(waitDurations.reduce((a, b) => a + b, 0) / waitDurations.length)
    : 0;

  // Average service duration calculation (called_at -> served_at)
  const serviceDurations: number[] = [];
  servedList.forEach((v) => {
    if (v.called_at && v.served_at) {
      const start = new Date(v.called_at).getTime();
      const end = new Date(v.served_at).getTime();
      if (end > start) {
        const mins = (end - start) / 60000;
        if (mins < 240) serviceDurations.push(mins);
      }
    }
  });

  const avgService = serviceDurations.length
    ? Math.round((serviceDurations.reduce((a, b) => a + b, 0) / serviceDurations.length) * 10) / 10
    : 0;

  // Hourly distribution & peak hour
  const hourBuckets: Record<number, number> = {};
  for (let h = 8; h <= 21; h++) hourBuckets[h] = 0;

  visitors.forEach((v) => {
    const d = new Date(v.joined_at);
    const hour = d.getHours();
    if (hour >= 0 && hour <= 23) {
      hourBuckets[hour] = (hourBuckets[hour] || 0) + 1;
    }
  });

  let maxHour = -1;
  let maxCount = 0;
  const hourlyDistribution = Object.entries(hourBuckets).map(([hStr, count]) => {
    const h = parseInt(hStr, 10);
    if (count > maxCount) {
      maxCount = count;
      maxHour = h;
    }
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return {
      hour: h,
      label: `${displayH} ${ampm}`,
      count,
    };
  });

  const peakHourLabel = maxHour !== -1 && maxCount > 0
    ? `${maxHour % 12 === 0 ? 12 : maxHour % 12} ${maxHour >= 12 ? "PM" : "AM"} – ${(maxHour + 1) % 12 === 0 ? 12 : (maxHour + 1) % 12} ${maxHour + 1 >= 12 ? "PM" : "AM"}`
    : null;

  const noShowRate = totalJoinedCount > 0 ? Math.round((noShowList.length / totalJoinedCount) * 100) : 0;

  // Flow efficiency score (100 - penalties for high wait and no-show)
  const waitPenalty = Math.min(40, avgWait * 1.5);
  const noShowPenalty = Math.min(30, noShowRate * 1.2);
  const flowScore = Math.max(10, Math.min(100, Math.round(100 - waitPenalty - noShowPenalty)));

  return {
    date,
    businessId,
    businessName,
    totalJoined: { value: totalJoinedCount, hasData: totalJoinedCount > 0, sampleSize: totalJoinedCount },
    totalServed: { value: servedList.length, hasData: servedList.length > 0, sampleSize: servedList.length },
    totalNoShow: { value: noShowList.length, hasData: true, sampleSize: noShowList.length },
    totalSkipped: { value: noShowList.length, hasData: true, sampleSize: noShowList.length },
    avgWaitMinutes: { value: avgWait, hasData: waitDurations.length > 0, sampleSize: waitDurations.length },
    avgServiceMinutes: { value: avgService, hasData: serviceDurations.length > 0, sampleSize: serviceDurations.length },
    noShowRatePct: { value: noShowRate, hasData: totalJoinedCount > 0, sampleSize: totalJoinedCount },
    peakHour: { value: peakHourLabel, hasData: Boolean(peakHourLabel), sampleSize: maxCount },
    peakHourCount: maxCount,
    flowEfficiencyScore: { value: flowScore, hasData: totalJoinedCount > 0, sampleSize: totalJoinedCount },
    hourlyDistribution,
  };
}
