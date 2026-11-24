import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  normalizeIndianPhone,
  isFast2SmsConfigured,
  sendFast2Sms,
  checkFast2SmsWallet,
  sendFast2SmsOtp,
} from "@/lib/notifications/fast2sms";
import { SMSAdapter } from "@/lib/notifications/providers/externalAdapters";

describe("Fast2SMS Integration Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("normalizeIndianPhone", () => {
    it("handles standard 10-digit Indian numbers", () => {
      const res = normalizeIndianPhone("9876543210");
      expect(res.isValid).toBe(true);
      expect(res.cleanPhone).toBe("9876543210");
    });

    it("strips country code +91 and spaces", () => {
      const res = normalizeIndianPhone("+91 98765 43210");
      expect(res.isValid).toBe(true);
      expect(res.cleanPhone).toBe("9876543210");
    });

    it("strips prefix 91 without plus", () => {
      const res = normalizeIndianPhone("919876543210");
      expect(res.isValid).toBe(true);
      expect(res.cleanPhone).toBe("9876543210");
    });

    it("strips leading 0", () => {
      const res = normalizeIndianPhone("09876543210");
      expect(res.isValid).toBe(true);
      expect(res.cleanPhone).toBe("9876543210");
    });

    it("rejects invalid numbers not starting with 6, 7, 8, or 9", () => {
      const res = normalizeIndianPhone("1234567890");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("Must be a 10-digit number");
    });

    it("rejects short or empty numbers", () => {
      expect(normalizeIndianPhone("").isValid).toBe(false);
      expect(normalizeIndianPhone("98765").isValid).toBe(false);
    });
  });

  describe("API Dispatch and Responses", () => {
    it("detects configuration when API key is present", () => {
      expect(isFast2SmsConfigured()).toBe(true);
    });

    it("dispatches Quick SMS with correct payload headers and body", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          return: true,
          request_id: "req_f2s_abc123",
          message: ["Message sent successfully"],
        }),
      });
      globalThis.fetch = mockFetch;

      const res = await sendFast2Sms({
        phone: "+91 98765 43210",
        message: "Your token #14 is now serving at Counter 1.",
      });

      expect(res.success).toBe(true);
      expect(res.requestId).toBe("req_f2s_abc123");
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://www.fast2sms.com/dev/bulkV2");
      expect(options.method).toBe("POST");
      expect(options.headers.authorization).toBeDefined();

      const body = JSON.parse(options.body);
      expect(body.route).toBe("q");
      expect(body.numbers).toBe("9876543210");
      expect(body.message).toContain("token #14");
    });

    it("handles Fast2SMS API errors gracefully", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          return: false,
          message: ["Invalid mobile numbers"],
        }),
      });

      const res = await sendFast2Sms({
        phone: "9876543210",
        message: "Test message",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Invalid mobile numbers");
    });

    it("dispatches OTP messages formatted for verification", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          return: true,
          request_id: "req_otp_999",
          message: ["OTP sent successfully"],
        }),
      });
      globalThis.fetch = mockFetch;

      const res = await sendFast2SmsOtp("9876543210", "482910");
      expect(res.success).toBe(true);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.message).toContain("482910");
    });

    it("retrieves wallet balance accurately", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          return: true,
          wallet: "50.0000",
          sms_count: 200,
        }),
      });

      const status = await checkFast2SmsWallet();
      expect(status.success).toBe(true);
      expect(status.wallet).toBe("50.0000");
      expect(status.smsCount).toBe(200);
    });
  });

  describe("SMSAdapter Integration", () => {
    it("routes through Fast2SMS provider in production mode", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          return: true,
          request_id: "req_adapter_test",
          message: ["Message sent"],
        }),
      });

      const result = await SMSAdapter.send({
        toPhone: "9876543210",
        businessName: "Aroma Cafe",
        queueName: "Order Counter",
        tokenNumber: 5,
        messageType: "called",
        bodyText: "Aroma Cafe is now serving ticket #5 at Counter 1.",
      });

      expect(result.success).toBe(true);
      expect(result.channel).toBe("sms");
      expect(result.provider).toBe("fast2sms");
      expect(result.mode).toBe("production");
      expect(result.messageId).toBe("req_adapter_test");
    });
  });
});
