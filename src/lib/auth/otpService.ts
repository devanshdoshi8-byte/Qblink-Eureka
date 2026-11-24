/**
 * Qblink OTP Security and Dispatch Service
 *
 * Handles generation, dispatch via Fast2SMS, rate limiting, and replay-resistant
 * verification for 6-digit one-time passwords (OTP).
 */

import { sendFast2SmsOtp, normalizeIndianPhone, isFast2SmsConfigured } from "@/lib/notifications/fast2sms";
import { cryptoSecureOTP, otpReplayGuard } from "@/lib/securitySuite";
import { rateLimiter, getRateLimitMessage } from "@/lib/rateLimit";

export interface SendOtpResult {
  success: boolean;
  message: string;
  phone?: string;
  error?: string;
  remainingSec?: number;
}

export interface VerifyOtpResult {
  success: boolean;
  error?: string;
}

interface StoredOtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

export class OTPService {
  private activeOtps: Map<string, StoredOtpRecord> = new Map();
  private readonly OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_VERIFY_ATTEMPTS = 5;

  /**
   * Generates and dispatches a cryptographically secure 6-digit OTP via Fast2SMS.
   */
  async sendOtp(rawPhone: string): Promise<SendOtpResult> {
    const { isValid, cleanPhone, error: phoneErr } = normalizeIndianPhone(rawPhone);
    if (!isValid) {
      return {
        success: false,
        message: "",
        error: phoneErr || "Invalid mobile number. Please enter a 10-digit Indian number.",
      };
    }

    // Rate limiting: max 3 requests per 3 minutes per phone number
    const limitCheck = rateLimiter.check("auth:otp-resend", cleanPhone);
    if (!limitCheck.allowed) {
      const msg = getRateLimitMessage("auth:otp-resend", limitCheck.remainingSec);
      return {
        success: false,
        message: "",
        error: msg,
        remainingSec: limitCheck.remainingSec,
      };
    }

    // Generate crypto-secure 6-digit OTP
    const code = cryptoSecureOTP(6);
    const expiresAt = Date.now() + this.OTP_EXPIRY_MS;

    // Send via Fast2SMS
    const smsRes = await sendFast2SmsOtp(cleanPhone, code);
    if (!smsRes.success) {
      return {
        success: false,
        message: "",
        error: smsRes.error || "Failed to dispatch SMS OTP.",
      };
    }

    // Record attempt in rate limiter
    rateLimiter.record("auth:otp-resend", cleanPhone);

    // Store in active OTP cache
    this.activeOtps.set(cleanPhone, {
      code,
      expiresAt,
      attempts: 0,
    });

    return {
      success: true,
      phone: cleanPhone,
      message: `Security code sent via SMS to +91 ${cleanPhone}. Valid for 10 minutes.`,
    };
  }

  /**
   * Verifies an OTP code against the active record and guards against replay attacks.
   */
  verifyOtp(rawPhone: string, inputCode: string): VerifyOtpResult {
    const { isValid, cleanPhone } = normalizeIndianPhone(rawPhone);
    if (!isValid) {
      return { success: false, error: "Invalid phone number." };
    }

    const trimmedCode = inputCode.trim();
    if (trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
      return { success: false, error: "Please enter a valid 6-digit code." };
    }

    const record = this.activeOtps.get(cleanPhone);
    if (!record) {
      return {
        success: false,
        error: "No active verification code found or code expired. Please request a new code.",
      };
    }

    if (Date.now() > record.expiresAt) {
      this.activeOtps.delete(cleanPhone);
      return {
        success: false,
        error: "Verification code has expired. Please request a new code.",
      };
    }

    record.attempts += 1;
    if (record.attempts > this.MAX_VERIFY_ATTEMPTS) {
      this.activeOtps.delete(cleanPhone);
      return {
        success: false,
        error: "Too many incorrect attempts. Please request a new code.",
      };
    }

    if (record.code !== trimmedCode) {
      return {
        success: false,
        error: "Invalid verification code. Please check and try again.",
      };
    }

    // 2FA Replay protection check
    const replayCheck = otpReplayGuard.consumeOTP(cleanPhone, trimmedCode, this.OTP_EXPIRY_MS);
    if (!replayCheck.success) {
      return {
        success: false,
        error: replayCheck.error || "Code has already been consumed.",
      };
    }

    // Consume and remove from active store
    this.activeOtps.delete(cleanPhone);

    return { success: true };
  }

  /**
   * Test helper to inject an active OTP record for testing without calling SMS.
   */
  setMockOtpForTesting(phone: string, code: string, ttlMs = 600000): void {
    const { cleanPhone } = normalizeIndianPhone(phone);
    this.activeOtps.set(cleanPhone, {
      code,
      expiresAt: Date.now() + ttlMs,
      attempts: 0,
    });
  }

  /**
   * Clear active records (used for test teardown)
   */
  clear(): void {
    this.activeOtps.clear();
  }
}

export const otpService = new OTPService();
