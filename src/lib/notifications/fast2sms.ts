/**
 * Fast2SMS Gateway Integration for Qblink
 * 
 * Provides transactional SMS, queue alerts, and OTP dispatch via Fast2SMS API.
 * Uses official Fast2SMS bulkV2 endpoints (Quick SMS & OTP routes).
 */

export interface Fast2SmsSendParams {
  phone: string;
  message: string;
  route?: "q" | "otp" | "dlt";
  variablesValues?: string;
  senderId?: string;
}

export interface Fast2SmsResponse {
  success: boolean;
  requestId?: string;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface Fast2SmsWalletStatus {
  success: boolean;
  wallet?: string;
  smsCount?: number;
  error?: string;
}

/**
 * Normalizes input phone numbers to 10-digit Indian mobile format.
 * Strips formatting, leading country codes (+91, 91), and leading zeros.
 */
export function normalizeIndianPhone(phone: string): {
  isValid: boolean;
  cleanPhone: string;
  error?: string;
} {
  if (!phone || typeof phone !== "string") {
    return { isValid: false, cleanPhone: "", error: "Phone number is required." };
  }

  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, "");

  // If 12 digits starting with 91, take last 10
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    // 11 digits starting with 0
    digits = digits.slice(1);
  }

  // Valid Indian mobile numbers are 10 digits starting with 6, 7, 8, or 9
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return { isValid: true, cleanPhone: digits };
  }

  return {
    isValid: false,
    cleanPhone: digits,
    error: `Invalid Indian mobile number: ${phone}. Must be a 10-digit number starting with 6, 7, 8, or 9.`,
  };
}

/**
 * Returns whether Fast2SMS is configured via environment variables.
 */
export function isFast2SmsConfigured(): boolean {
  return Boolean(import.meta.env.VITE_FAST2SMS_API_KEY);
}

/**
 * Gets the configured Fast2SMS API key.
 */
export function getFast2SmsApiKey(): string {
  return (import.meta.env.VITE_FAST2SMS_API_KEY as string) || "";
}

/**
 * Checks Fast2SMS account wallet balance and approximate SMS credits.
 */
export async function checkFast2SmsWallet(): Promise<Fast2SmsWalletStatus> {
  const apiKey = getFast2SmsApiKey();
  if (!apiKey) {
    return { success: false, error: "Fast2SMS API key not configured." };
  }

  try {
    const response = await fetch("https://www.fast2sms.com/dev/wallet", {
      method: "POST",
      headers: {
        authorization: apiKey,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Fast2SMS wallet check failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    if (data.return === true) {
      return {
        success: true,
        wallet: data.wallet,
        smsCount: data.sms_count,
      };
    }

    return {
      success: false,
      error: data.message || "Failed to retrieve wallet information.",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Network error checking Fast2SMS wallet.",
    };
  }
}

/**
 * Dispatches an SMS using the Fast2SMS API.
 */
export async function sendFast2Sms(params: Fast2SmsSendParams): Promise<Fast2SmsResponse> {
  const apiKey = getFast2SmsApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: "Fast2SMS API key is not configured.",
    };
  }

  const { isValid, cleanPhone, error: phoneErr } = normalizeIndianPhone(params.phone);
  if (!isValid) {
    return {
      success: false,
      error: phoneErr,
    };
  }

  const route = params.route || "q";

  let body: Record<string, any>;
  if (route === "otp" && params.variablesValues) {
    body = {
      route: "otp",
      variables_values: params.variablesValues,
      numbers: cleanPhone,
    };
  } else {
    // Quick SMS route (transactional / alerts)
    body = {
      route: "q",
      message: params.message,
      language: "english",
      flash: 0,
      numbers: cleanPhone,
    };
  }

  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);

    if (data && data.return === true) {
      const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
      return {
        success: true,
        requestId: data.request_id,
        message: msg || "Message sent successfully.",
        statusCode: response.status,
      };
    }

    const errorMsg = data
      ? (Array.isArray(data.message) ? data.message.join(", ") : data.message)
      : `HTTP ${response.status}`;

    return {
      success: false,
      error: errorMsg || "Fast2SMS transmission rejected.",
      statusCode: response.status,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Network error communicating with Fast2SMS.",
    };
  }
}

/**
 * Convenience helper to dispatch an OTP code using Fast2SMS Quick or OTP route.
 */
export async function sendFast2SmsOtp(phone: string, otpCode: string): Promise<Fast2SmsResponse> {
  return sendFast2Sms({
    phone,
    message: `Your Qblink security code is ${otpCode}. Valid for 10 minutes. Do not share this code with anyone.`,
    route: "q",
  });
}
