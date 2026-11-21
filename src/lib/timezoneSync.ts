/**
 * Timezone Synchronization & Automatic Day Rollover for Qblink
 *
 * Automatically detects day boundaries across global time zones, archives previous
 * sessions, and resets queue tokens to #1 at midnight without manual staff intervention.
 */

export interface QueueStateCheck {
  id: string;
  updated_at?: string | null;
  current_token?: number | null;
  next_token?: number | null;
}

export interface VisitorDateCheck {
  id?: string | null;
  joined_at: string;
  status?: string | null;
}

/**
 * Returns the effective timezone for a business, falling back to the browser / staff device timezone.
 */
export const getEffectiveTimeZone = (business?: any): string => {
  if (business?.settings?.timezone && typeof business.settings.timezone === "string") {
    return business.settings.timezone;
  }
  if (business?.operating_hours?.timezone && typeof business.operating_hours.timezone === "string") {
    return business.operating_hours.timezone;
  }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

/**
 * Formats a Date/timestamp into "YYYY-MM-DD" in the specified timezone.
 */
export const getDateStringInTimeZone = (dateInput: Date | string | number, timeZone: string): string => {
  try {
    const d = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "";

    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }
};

/**
 * Calculates milliseconds remaining until the next midnight (00:00:01) in the specified timezone.
 */
export const getTimeUntilNextMidnight = (timeZone: string, referenceDate: Date = new Date()): number => {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone || "UTC",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(referenceDate);
    const partMap: Record<string, number> = {};
    for (const p of parts) {
      if (p.type !== "literal") partMap[p.type] = parseInt(p.value, 10);
    }
    const hours = partMap.hour === 24 ? 0 : partMap.hour;
    const minutes = partMap.minute || 0;
    const seconds = partMap.second || 0;

    const millisToday = ((hours * 60 + minutes) * 60 + seconds) * 1000 + referenceDate.getMilliseconds();
    const totalMillisInDay = 24 * 60 * 60 * 1000;
    const diff = totalMillisInDay - millisToday;

    // Buffer by 1 second past midnight to ensure date has rolled over
    return Math.max(diff + 1000, 1000);
  } catch {
    // Fallback: 1 hour
    return 60 * 60 * 1000;
  }
};

export interface StaleCheckResult {
  stale: boolean;
  reason?: "past_day_visitors" | "stale_tokens" | "clean";
  todayStr: string;
  staleCount: number;
}

/**
 * Evaluates whether an active queue belongs to a previous day in the given timezone
 * and requires automatic session archival and reset.
 */
export const isQueueStaleForNewDay = (
  queue: QueueStateCheck | null | undefined,
  visitors: VisitorDateCheck[] | null | undefined,
  timeZone: string,
  referenceDate: Date = new Date()
): StaleCheckResult => {
  if (!queue) {
    return { stale: false, reason: "clean", todayStr: "", staleCount: 0 };
  }

  const todayStr = getDateStringInTimeZone(referenceDate, timeZone);
  if (!todayStr) {
    return { stale: false, reason: "clean", todayStr: "", staleCount: 0 };
  }

  const visitorList = visitors || [];

  // 1. Any unarchived visitor whose joined_at calendar date is strictly before today in this timezone
  const staleVisitors = visitorList.filter((v) => {
    if (!v.joined_at) return false;
    const visitorDateStr = getDateStringInTimeZone(v.joined_at, timeZone);
    return visitorDateStr !== "" && visitorDateStr < todayStr;
  });

  if (staleVisitors.length > 0) {
    return {
      stale: true,
      reason: "past_day_visitors",
      todayStr,
      staleCount: staleVisitors.length,
    };
  }

  // 2. If there are no unarchived visitors today, but the queue tokens are carried over from a previous day
  const hasTokens = (queue.current_token ?? 0) > 0 || (queue.next_token ?? 1) > 1;
  if (hasTokens && visitorList.length === 0 && queue.updated_at) {
    const updatedDateStr = getDateStringInTimeZone(queue.updated_at, timeZone);
    if (updatedDateStr !== "" && updatedDateStr < todayStr) {
      return {
        stale: true,
        reason: "stale_tokens",
        todayStr,
        staleCount: 0,
      };
    }
  }

  return { stale: false, reason: "clean", todayStr, staleCount: 0 };
};
