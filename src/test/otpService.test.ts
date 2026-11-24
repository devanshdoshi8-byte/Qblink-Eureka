import { describe, it, expect, beforeEach, vi } from "vitest";
import { otpService } from "@/lib/auth/otpService";
import { otpReplayGuard } from "@/lib/securitySuite";
import { rateLimiter } from "@/lib/rateLimit";

describe("OTP Security and Dispatch Service", () => {
  beforeEach(() => {
    otpService.clear();
    otpReplayGuard.clear();
    rateLimiter.clearAll();
    vi.restoreAllMocks();
  });

  describe("sendOtp", () => {
    it("normalizes phone, generates crypto OTP, and dispatches via Fast2SMS", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          return: true,
          request_id: "req_otp_test_123",
          message: ["OTP sent successfully"],
        }),
      });
      globalThis.fetch = mockFetch;

      const res = await otpService.sendOtp("+91 98765 43210");
      expect(res.success).toBe(true);
      expect(res.phone).toBe("9876543210");
      expect(res.message).toContain("Security code sent via SMS");
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://www.fast2sms.com/dev/bulkV2");
      const body = JSON.parse(options.body);
      expect(body.route).toBe("q");
      expect(body.numbers).toBe("9876543210");
      expect(body.message).toMatch(/Your Qblink security code is \d{6}\./);
    });

    it("rejects invalid Indian mobile numbers", async () => {
      const res = await otpService.sendOtp("1234567890");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Must be a 10-digit number");
    });

    it("enforces rate limiting after 3 rapid requests", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ return: true, request_id: "req_ok", message: ["OK"] }),
      });

      const phone = "9876543210";
      const r1 = await otpService.sendOtp(phone);
      const r2 = await otpService.sendOtp(phone);
      const r3 = await otpService.sendOtp(phone);
      expect(r1.success).toBe(true);
      expect(r2.success).toBe(true);
      expect(r3.success).toBe(true);

      // 4th request blocked by rate limiter
      const r4 = await otpService.sendOtp(phone);
      expect(r4.success).toBe(false);
      expect(r4.error).toContain("Too many code resend attempts");
    });
  });

  describe("verifyOtp", () => {
    it("successfully verifies valid OTP code", () => {
      const phone = "9876543210";
      otpService.setMockOtpForTesting(phone, "482910");

      const res = otpService.verifyOtp(phone, "482910");
      expect(res.success).toBe(true);
    });

    it("rejects incorrect OTP code", () => {
      const phone = "9876543210";
      otpService.setMockOtpForTesting(phone, "482910");

      const res = otpService.verifyOtp(phone, "000000");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Invalid verification code");
    });

    it("permanently prevents 2FA code replay attack", () => {
      const phone = "9876543210";
      otpService.setMockOtpForTesting(phone, "482910");

      const first = otpService.verifyOtp(phone, "482910");
      expect(first.success).toBe(true);

      // Subsequent attempt with identical code fails (consumed from store and guard)
      const second = otpService.verifyOtp(phone, "482910");
      expect(second.success).toBe(false);
    });

    it("locks out and deletes code after 5 failed attempts", () => {
      const phone = "9876543210";
      otpService.setMockOtpForTesting(phone, "482910");

      for (let i = 0; i < 5; i++) {
        expect(otpService.verifyOtp(phone, "111111").success).toBe(false);
      }

      // 6th attempt is locked out
      const lockedRes = otpService.verifyOtp(phone, "111111");
      expect(lockedRes.success).toBe(false);
      expect(lockedRes.error).toContain("Too many incorrect attempts");
    });

    it("rejects expired OTP code", () => {
      const phone = "9876543210";
      // Expired 1 second ago
      otpService.setMockOtpForTesting(phone, "482910", -1000);

      const res = otpService.verifyOtp(phone, "482910");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Verification code has expired");
    });
  });
});
