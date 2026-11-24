import { describe, it, expect, beforeEach } from "vitest";
import {
  sanitizeRedirectUrl,
  escapeHtml,
  isSafeUrl,
  safeExternalLinkProps,
  authRateLimiter,
} from "../lib/security";

describe("Frontend Security Suite", () => {
  describe("sanitizeRedirectUrl (Open Redirect Prevention)", () => {
    it("allows valid internal routes", () => {
      expect(sanitizeRedirectUrl("/dashboard")).toBe("/dashboard");
      expect(sanitizeRedirectUrl("/customer-dashboard")).toBe("/customer-dashboard");
      expect(sanitizeRedirectUrl("/admin/queues")).toBe("/admin/queues");
      expect(sanitizeRedirectUrl("/join/abc-123")).toBe("/join/abc-123");
    });

    it("rejects protocol-relative URLs", () => {
      expect(sanitizeRedirectUrl("//attacker.com")).toBe("/customer-dashboard");
      expect(sanitizeRedirectUrl("//google.com/evil")).toBe("/customer-dashboard");
    });

    it("rejects backslash evasion", () => {
      expect(sanitizeRedirectUrl("/\\attacker.com")).toBe("/customer-dashboard");
    });

    it("rejects javascript: and other dangerous pseudo-schemes", () => {
      expect(sanitizeRedirectUrl("javascript:alert(1)")).toBe("/customer-dashboard");
      expect(sanitizeRedirectUrl("/javascript:alert(1)")).toBe("/customer-dashboard");
      expect(sanitizeRedirectUrl("data:text/html,<script>alert(1)</script>")).toBe("/customer-dashboard");
    });

    it("rejects external absolute URLs", () => {
      expect(sanitizeRedirectUrl("https://evil.com")).toBe("/customer-dashboard");
      expect(sanitizeRedirectUrl("http://evil.com/phish")).toBe("/customer-dashboard");
    });

    it("falls back to custom fallback if provided", () => {
      expect(sanitizeRedirectUrl("https://evil.com", "/dashboard")).toBe("/dashboard");
      expect(sanitizeRedirectUrl(null, "/auth")).toBe("/auth");
    });
  });

  describe("escapeHtml (XSS Prevention)", () => {
    it("escapes all dangerous HTML characters", () => {
      const dirty = `<script>alert('XSS & "fun"')</script>`;
      const clean = escapeHtml(dirty);
      expect(clean).not.toContain("<script>");
      expect(clean).toContain("&lt;script&gt;");
      expect(clean).toContain("&amp;");
      expect(clean).toContain("&quot;");
      expect(clean).toContain("&#x27;");
    });

    it("handles empty or non-string inputs gracefully", () => {
      expect(escapeHtml("")).toBe("");
      expect(escapeHtml(null as any)).toBe("");
    });
  });

  describe("isSafeUrl", () => {
    it("accepts safe relative and HTTPS URLs", () => {
      expect(isSafeUrl("/dashboard")).toBe(true);
      expect(isSafeUrl("https://qblink.com")).toBe(true);
    });

    it("rejects unsafe schemes", () => {
      expect(isSafeUrl("javascript:void(0)")).toBe(false);
      expect(isSafeUrl("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
      expect(isSafeUrl("//evil.com")).toBe(false);
    });
  });

  describe("safeExternalLinkProps", () => {
    it("contains noopener and noreferrer", () => {
      expect(safeExternalLinkProps.target).toBe("_blank");
      expect(safeExternalLinkProps.rel).toContain("noopener");
      expect(safeExternalLinkProps.rel).toContain("noreferrer");
    });
  });

  describe("authRateLimiter", () => {
    beforeEach(() => {
      authRateLimiter.reset();
    });

    it("allows attempts up to the limit and blocks thereafter", () => {
      for (let i = 0; i < 6; i++) {
        expect(authRateLimiter.canAttempt()).toBe(true);
        authRateLimiter.recordAttempt();
      }
      expect(authRateLimiter.canAttempt()).toBe(false);
      expect(authRateLimiter.remainingTimeSec()).toBeGreaterThan(0);
    });

    it("resets when requested", () => {
      for (let i = 0; i < 6; i++) {
        authRateLimiter.recordAttempt();
      }
      expect(authRateLimiter.canAttempt()).toBe(false);
      authRateLimiter.reset();
      expect(authRateLimiter.canAttempt()).toBe(true);
    });
  });
});
