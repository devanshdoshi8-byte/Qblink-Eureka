import { describe, it, expect } from "vitest";
import {
  getDateStringInTimeZone,
  getTimeUntilNextMidnight,
  isQueueStaleForNewDay,
  getEffectiveTimeZone,
} from "../lib/timezoneSync";

describe("timezoneSync", () => {
  describe("getDateStringInTimeZone", () => {
    it("converts UTC timestamps correctly to different global timezones", () => {
      // 2026-11-21 at 02:00:00 UTC
      const ref = new Date("2026-11-21T02:00:00Z");

      // In Tokyo (UTC+9), it is already 11:00 AM on Nov 21
      expect(getDateStringInTimeZone(ref, "Asia/Tokyo")).toBe("2026-11-21");

      // In New York (UTC-5), it is still 9:00 PM on Nov 20
      expect(getDateStringInTimeZone(ref, "America/New_York")).toBe("2026-11-20");

      // In Los Angeles (UTC-8), it is 6:00 PM on Nov 20
      expect(getDateStringInTimeZone(ref, "America/Los_Angeles")).toBe("2026-11-20");

      // In London (UTC+0), it is 2:00 AM on Nov 21
      expect(getDateStringInTimeZone(ref, "Europe/London")).toBe("2026-11-21");
    });
  });

  describe("getTimeUntilNextMidnight", () => {
    it("returns positive milliseconds until next midnight", () => {
      const ref = new Date("2026-11-21T18:00:00Z");
      const ms = getTimeUntilNextMidnight("UTC", ref);
      // Roughly 6 hours + 1s buffer = 21,601,000 ms
      expect(ms).toBeGreaterThan(5 * 3600 * 1000);
      expect(ms).toBeLessThanOrEqual(6 * 3600 * 1000 + 2000);
    });
  });

  describe("isQueueStaleForNewDay", () => {
    const queue = {
      id: "q-1",
      current_token: 15,
      next_token: 16,
      updated_at: "2026-11-20T17:00:00Z",
    };

    it("detects stale session when visitors joined on previous calendar day", () => {
      const ref = new Date("2026-11-21T10:00:00Z"); // Today is Nov 21 in London
      const visitors = [
        { joined_at: "2026-11-20T18:00:00Z", status: "waiting" },
      ];

      const res = isQueueStaleForNewDay(queue, visitors, "Europe/London", ref);
      expect(res.stale).toBe(true);
      expect(res.reason).toBe("past_day_visitors");
      expect(res.staleCount).toBe(1);
    });

    it("detects stale tokens when all visitors cleared yesterday but queue updated_at is yesterday", () => {
      const ref = new Date("2026-11-21T10:00:00Z");
      const visitors: any[] = []; // No active visitors currently

      const res = isQueueStaleForNewDay(queue, visitors, "Europe/London", ref);
      expect(res.stale).toBe(true);
      expect(res.reason).toBe("stale_tokens");
    });

    it("does not flag clean queue with today visitors", () => {
      const ref = new Date("2026-11-21T10:00:00Z");
      const freshQueue = {
        id: "q-1",
        current_token: 2,
        next_token: 3,
        updated_at: "2026-11-21T09:30:00Z",
      };
      const visitors = [
        { joined_at: "2026-11-21T09:15:00Z", status: "waiting" },
      ];

      const res = isQueueStaleForNewDay(freshQueue, visitors, "Europe/London", ref);
      expect(res.stale).toBe(false);
      expect(res.reason).toBe("clean");
    });
  });

  describe("getEffectiveTimeZone", () => {
    it("prioritizes business settings timezone over fallback", () => {
      const biz = { settings: { timezone: "America/Chicago" } };
      expect(getEffectiveTimeZone(biz)).toBe("America/Chicago");
    });

    it("falls back to operating_hours timezone if settings is missing", () => {
      const biz = { operating_hours: { timezone: "Asia/Singapore" } };
      expect(getEffectiveTimeZone(biz)).toBe("Asia/Singapore");
    });

    it("falls back to system/browser timezone if none configured", () => {
      const tz = getEffectiveTimeZone({});
      expect(typeof tz).toBe("string");
      expect(tz.length).toBeGreaterThan(0);
    });
  });
});
