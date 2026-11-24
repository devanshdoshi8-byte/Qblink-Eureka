import { describe, it, expect, beforeEach } from "vitest";
import {
  cryptoSecureToken,
  cryptoSecureInt,
  cryptoSecureOTP,
  cryptoSecureUUID,
  timingSafeEqual,
  validateUsernameSecurity,
  RapidResetGuard,
  validateOAuthSecurity,
  validateEmailSecurity,
  validateSAMLAssertionIntegrity,
  validateGraphQLQuery,
  otpReplayGuard,
  safeRegexMatch,
  validateJwtSecurity,
  detectRequestSmuggling,
  sanitizeClientIp,
  detectCachePoisoning,
  auditRLSViewSafety,
  validateCipherSuite,
  uniformCryptoError,
  safeDeepMerge,
  safeJsonParse,
  safeInterpolateTemplate,
  preventXXE,
  sanitizePathTraversal,
  validateWebSocketOrigin,
  createWebSocketAuthTicket,
} from "../lib/securitySuite";

describe("Enterprise Security Suite Hardening", () => {
  // 1. Math.random Non-Cryptographic Token Defense
  describe("Cryptographically Secure Random Tokens", () => {
    it("generates random hex tokens of correct length", () => {
      const token1 = cryptoSecureToken(16);
      const token2 = cryptoSecureToken(16);
      expect(token1).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(token2).toHaveLength(32);
      expect(token1).not.toBe(token2);
    });

    it("generates uniform unbiased integers within bounded range", () => {
      for (let i = 0; i < 50; i++) {
        const val = cryptoSecureInt(100, 999);
        expect(val).toBeGreaterThanOrEqual(100);
        expect(val).toBeLessThanOrEqual(999);
      }
    });

    it("generates 6-digit numeric OTPs", () => {
      const otp = cryptoSecureOTP(6);
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });

    it("generates valid RFC 4122 v4 UUIDs", () => {
      const uuid = cryptoSecureUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  // 2. Timing Attack Defense
  describe("Timing Attack Defense (Constant-Time Bitwise Comparison)", () => {
    it("returns true for identical strings", () => {
      expect(timingSafeEqual("secure_token_12345", "secure_token_12345")).toBe(true);
      expect(timingSafeEqual("987654", "987654")).toBe(true);
    });

    it("returns false for different strings of same length", () => {
      expect(timingSafeEqual("secure_token_12345", "secure_token_12346")).toBe(false);
      expect(timingSafeEqual("aaaa", "aaab")).toBe(false);
    });

    it("returns false for strings of different length", () => {
      expect(timingSafeEqual("short", "longer_string")).toBe(false);
    });
  });

  // 3. 52-char username & Unicode Clone Homoglyphs
  describe("Username Security & Unicode Confusable Defense", () => {
    it("rejects 52-character username overflow attempts", () => {
      const long52 = "a".repeat(52);
      const result = validateUsernameSecurity(long52);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds maximum allowed length of 30 characters");
    });

    it("rejects usernames shorter than 3 characters", () => {
      expect(validateUsernameSecurity("ab").valid).toBe(false);
    });

    it("rejects zero-width and invisible characters", () => {
      const invisibleUsername = "admin\u200Buser";
      const result = validateUsernameSecurity(invisibleUsername);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("invisible or directional formatting");
    });

    it("detects Cyrillic homoglyph attacks impersonating protected usernames", () => {
      // Cyrillic small letter a (\u0430) + "dmin" looks identical to "admin"
      const cyrillicAdmin = "\u0430dmin";
      const result = validateUsernameSecurity(cyrillicAdmin);
      expect(result.valid).toBe(false);
      expect(result.isConfusable).toBe(true);
      expect(result.error).toContain("confusable Unicode characters");
    });

    it("accepts safe standard usernames", () => {
      const result = validateUsernameSecurity("clinic_frontdesk");
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe("clinic_frontdesk");
    });
  });

  // 4. Rapid Reset Defense
  describe("Rapid Reset Defense", () => {
    it("blocks when reset rate exceeds threshold", () => {
      const guard = new RapidResetGuard(5, 1000, 5000);
      for (let i = 0; i < 5; i++) {
        expect(guard.recordReset().blocked).toBe(false);
      }
      // 6th reset triggers cooldown
      const blocked = guard.recordReset();
      expect(blocked.blocked).toBe(true);
      expect(guard.isBlocked()).toBe(true);
    });
  });

  // 5. SAML Bypass, nOAuth & Email Spoofing
  describe("SAML Bypass, nOAuth & Email Spoofing Defense", () => {
    it("rejects nOAuth unverified email identity provider accounts", () => {
      const result = validateOAuthSecurity({
        email: "victim@company.com",
        email_verified: false, // unverified!
        iss: "https://accounts.google.com",
      });
      expect(result.safe).toBe(false);
      expect(result.error).toContain("nOAuth Defense");
    });

    it("accepts verified OAuth accounts", () => {
      const result = validateOAuthSecurity({
        email: "verified@company.com",
        email_verified: true,
        iss: "https://accounts.google.com",
      });
      expect(result.safe).toBe(true);
    });

    it("rejects CRLF email header injection", () => {
      const poisonedEmail = "victim@domain.com\r\nBcc: attacker@evil.com";
      const result = validateEmailSecurity(poisonedEmail);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("CRLF line break");
    });

    it("rejects null byte email injection", () => {
      const nullByteEmail = "user@domain.com\0.evil.com";
      const result = validateEmailSecurity(nullByteEmail);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("null byte");
    });

    it("detects SAML XML Signature Wrapping (XSW) multiple assertions", () => {
      const xswPayload = `
        <samlp:Response>
          <saml:Assertion ID="fake"/>
          <saml:Assertion ID="real">
            <ds:Signature>...</ds:Signature>
          </saml:Assertion>
        </samlp:Response>
      `;
      const result = validateSAMLAssertionIntegrity(xswPayload);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("SAML XSW Defense");
    });
  });

  // 6. GraphQL Aliases & Query Amplification Defense
  describe("GraphQL Aliases & Query Amplification Defense", () => {
    it("detects and blocks excessive alias batching abuse", () => {
      // 12 aliases
      const aliasAbuse = `
        query {
          a1: user(id: 1) { id }
          a2: user(id: 2) { id }
          a3: user(id: 3) { id }
          a4: user(id: 4) { id }
          a5: user(id: 5) { id }
          a6: user(id: 6) { id }
          a7: user(id: 7) { id }
          a8: user(id: 8) { id }
          a9: user(id: 9) { id }
          a10: user(id: 10) { id }
          a11: user(id: 11) { id }
          a12: user(id: 12) { id }
        }
      `;
      const result = validateGraphQLQuery(aliasAbuse, { maxAliases: 5 });
      expect(result.safe).toBe(false);
      expect(result.aliasCount).toBe(12);
      expect(result.error).toContain("GraphQL Alias Batching Attack detected");
    });

    it("detects excessive query nesting depth", () => {
      const deepQuery = "{ a { b { c { d { e { f { g { h { id } } } } } } } } }";
      const result = validateGraphQLQuery(deepQuery, { maxDepth: 4 });
      expect(result.safe).toBe(false);
      expect(result.error).toContain("GraphQL Query Depth exceeded");
    });
  });

  // 7. 2FA Code Replay Defense
  describe("2FA Code Replay Defense", () => {
    beforeEach(() => {
      otpReplayGuard.clear();
    });

    it("allows first use of OTP code", () => {
      const result = otpReplayGuard.consumeOTP("user_123", "482910");
      expect(result.success).toBe(true);
    });

    it("blocks immediate replay of same OTP code", () => {
      otpReplayGuard.consumeOTP("user_123", "482910");
      const replayResult = otpReplayGuard.consumeOTP("user_123", "482910");
      expect(replayResult.success).toBe(false);
      expect(replayResult.error).toContain("2FA Code Replay Attack detected");
    });
  });

  // 8. ReDoS Defense
  describe("ReDoS Defense", () => {
    it("blocks inputs exceeding maximum safe length", () => {
      const pattern = /^[a-z]+$/;
      const longInput = "a".repeat(1500);
      const result = safeRegexMatch(pattern, longInput, 1000);
      expect(result.matched).toBe(false);
      expect(result.error).toContain("ReDoS Defense: Input length");
    });

    it("matches valid inputs safely", () => {
      const pattern = /^[a-z]+$/;
      const result = safeRegexMatch(pattern, "securetext", 1000);
      expect(result.matched).toBe(true);
    });
  });

  // 9. JWT Request Smuggling & Algorithm Confusion
  describe("JWT Request Smuggling & Algorithm Confusion Defense", () => {
    it("rejects tokens using 'none' algorithm", () => {
      const headerNone = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
      const payload = btoa(JSON.stringify({ sub: "user_1" }));
      const fakeToken = `${headerNone}.${payload}.signature`;
      const result = validateJwtSecurity(fakeToken);
      expect(result.valid).toBe(false);
      expect(result.error?.toLowerCase()).toContain('algorithm confusion defense: "none" algorithm is forbidden');
    });

    it("rejects tokens containing whitespace or smuggled HTTP line breaks", () => {
      const dirtyToken = "header.payload.sig\r\nTransfer-Encoding: chunked";
      const result = validateJwtSecurity(dirtyToken);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("JWT Smuggling Defense");
    });

    it("detects request smuggling header conflicts (CL.TE)", () => {
      const headers = {
        "Content-Length": "45",
        "Transfer-Encoding": "chunked",
      };
      const result = detectRequestSmuggling(headers);
      expect(result.hasSmuggling).toBe(true);
      expect(result.reason).toContain("CL.TE/TE.CL");
    });
  });

  // 10. Cache Poisoning & Spoofed IP Headers
  describe("Cache Poisoning & Spoofed IP Header Defense", () => {
    it("sanitizes X-Forwarded-For to valid client IP", () => {
      expect(sanitizeClientIp("203.0.113.195, 198.51.100.1")).toBe("203.0.113.195");
    });

    it("rejects CRLF header splitting in client IP", () => {
      expect(sanitizeClientIp("1.2.3.4\r\nSet-Cookie: evil=1")).toBeNull();
    });

    it("detects unkeyed host override headers in cache poisoning attempts", () => {
      const headers = {
        "X-Forwarded-Host": "attacker.com",
      };
      const result = detectCachePoisoning(headers);
      expect(result.suspicious).toBe(true);
      expect(result.reasons[0]).toContain("Unkeyed host override header");
    });
  });

  // 11. Views Bypass RLS Defense
  describe("Views Bypass RLS Defense (PostgreSQL / Supabase)", () => {
    it("warns when view creation lacks security_invoker = true", () => {
      const unsafeView = "CREATE VIEW customer_queue_summary AS SELECT * FROM queues;";
      const result = auditRLSViewSafety(unsafeView);
      expect(result.safe).toBe(false);
      expect(result.warnings[0]).toContain("WITH (security_invoker = true)");
    });

    it("approves views created with security_invoker = true", () => {
      const safeView = "CREATE VIEW customer_queue_summary WITH (security_invoker = true) AS SELECT * FROM queues;";
      const result = auditRLSViewSafety(safeView);
      expect(result.safe).toBe(true);
    });
  });

  // 12. Padding Oracle Defense
  describe("Padding Oracle Defense", () => {
    it("rejects vulnerable CBC mode ciphers", () => {
      const result = validateCipherSuite("AES-256-CBC");
      expect(result.secure).toBe(false);
      expect(result.recommendation).toContain("Padding Oracle");
    });

    it("approves modern AEAD ciphers (AES-GCM)", () => {
      const result = validateCipherSuite("AES-256-GCM");
      expect(result.secure).toBe(true);
      expect(result.isAead).toBe(true);
    });

    it("returns uniform generic decryption error", () => {
      expect(uniformCryptoError()).toEqual({ error: "DECRYPTION_FAILED" });
    });
  });

  // 13. Prototype Pollution Defense
  describe("Prototype Pollution Defense", () => {
    it("strips __proto__ and constructor from deep merges", () => {
      const target = { a: 1 };
      const malicious = JSON.parse('{"b": 2, "__proto__": {"polluted": true}}');
      const merged = safeDeepMerge(target, malicious);

      expect(merged.b).toBe(2);
      expect(({} as any).polluted).toBeUndefined();
    });

    it("safeJsonParse strips prototype-polluting keys", () => {
      const json = '{"name": "test", "__proto__": {"admin": true}}';
      const parsed = safeJsonParse<any>(json, {});
      expect(parsed.name).toBe("test");
      expect(({} as any).admin).toBeUndefined();
    });
  });

  // 14. Server-Side Template Injection (SSTI) Defense
  describe("Template Injection (SSTI) Defense", () => {
    it("safely interpolates simple placeholders", () => {
      const template = "Hello {name}, your token is {token}.";
      const result = safeInterpolateTemplate(template, { name: "Aarav", token: 42 });
      expect(result).toBe("Hello Aarav, your token is 42.");
    });

    it("neutralizes active expression execution syntax (${...})", () => {
      const malicious = "Welcome ${7*7} {user}";
      const result = safeInterpolateTemplate(malicious, { user: "Patron" });
      expect(result).not.toContain("49");
      expect(result).toContain("Welcome");
    });
  });

  // 15. XXE & Path Traversal Defense
  describe("XXE & Path Traversal Defense", () => {
    it("blocks XML External Entity (XXE) DOCTYPE payloads", () => {
      const xxe = `<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>`;
      const result = preventXXE(xxe);
      expect(result.safe).toBe(false);
      expect(result.error).toContain("XXE Defense");
    });

    it("blocks directory traversal paths (../)", () => {
      const result = sanitizePathTraversal("../../../etc/passwd");
      expect(result.safe).toBe(false);
      expect(result.error).toContain("Directory traversal sequence");
    });

    it("blocks encoded traversal sequences (%2e%2e)", () => {
      const result = sanitizePathTraversal("%2e%2e/config.json");
      expect(result.safe).toBe(false);
    });

    it("sanitizes safe relative filenames", () => {
      const result = sanitizePathTraversal("reports/daily_2026.csv");
      expect(result.safe).toBe(true);
      expect(result.sanitized).toBe("reports/daily_2026.csv");
    });
  });

  // 16. Cross-Site WebSocket Hijacking (CSWSH) Defense
  describe("Cross-Site WebSocket Hijacking (CSWSH) Defense", () => {
    it("validates origin against allowed origin list", () => {
      const allowed = ["https://qblink.app", "http://localhost:8080"];
      expect(validateWebSocketOrigin("https://qblink.app", allowed)).toBe(true);
      expect(validateWebSocketOrigin("http://localhost:8080", allowed)).toBe(true);
      expect(validateWebSocketOrigin("https://evil-attacker.com", allowed)).toBe(false);
    });

    it("generates time-bounded single-use WebSocket tickets", () => {
      const ticket = createWebSocketAuthTicket("user_456", 30000);
      expect(ticket.ticket).toMatch(/^ws_user_456_[0-9a-f]{48}$/);
      expect(ticket.expiresAt).toBeGreaterThan(Date.now());
    });
  });
});
