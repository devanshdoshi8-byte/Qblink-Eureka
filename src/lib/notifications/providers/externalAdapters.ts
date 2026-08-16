/**
 * External Communication Provider Adapters (SMS & WhatsApp)
 *
 * Implements decoupled provider adapters configured via environment variables
 * with production webhooks and robust simulation/demo modes.
 */

export interface ExternalDispatchPayload {
  toPhone: string;
  customerName?: string;
  businessName: string;
  queueName: string;
  tokenNumber: number;
  messageType: "position_5" | "position_2" | "position_1" | "called" | "grace_active" | "grace_expiring";
  bodyText: string;
}

export interface ExternalDispatchResult {
  success: boolean;
  channel: "sms" | "whatsapp";
  provider: string;
  messageId?: string;
  mode: "production" | "demo" | "disabled";
  error?: string;
}

/**
 * WhatsApp Business Provider Adapter
 */
export class WhatsAppAdapter {
  static isConfigured(): boolean {
    return Boolean(
      import.meta.env.VITE_WHATSAPP_API_KEY ||
      import.meta.env.VITE_WHATSAPP_PHONE_ID
    );
  }

  static async send(payload: ExternalDispatchPayload): Promise<ExternalDispatchResult> {
    if (!payload.toPhone) {
      return { success: false, channel: "whatsapp", provider: "meta-cloud", mode: "disabled", error: "Missing phone number" };
    }

    if (!this.isConfigured()) {
      // Demo / Developer mode
      console.log("[Qblink WhatsApp Demo Dispatch]", {
        to: payload.toPhone,
        messageType: payload.messageType,
        text: payload.bodyText,
      });
      return {
        success: true,
        channel: "whatsapp",
        provider: "qblink-simulated-meta",
        messageId: `wa_demo_${Date.now()}`,
        mode: "demo",
      };
    }

    try {
      // Production webhook trigger to configured backend endpoint
      const response = await fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`WhatsApp endpoint returned status ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        channel: "whatsapp",
        provider: "meta-cloud",
        messageId: data.messageId || `wa_${Date.now()}`,
        mode: "production",
      };
    } catch (err: any) {
      return {
        success: false,
        channel: "whatsapp",
        provider: "meta-cloud",
        mode: "production",
        error: err?.message || "Failed to dispatch WhatsApp message",
      };
    }
  }
}

/**
 * SMS Provider Adapter (Twilio / AWS SNS / MessageBird)
 */
export class SMSAdapter {
  static isConfigured(): boolean {
    return Boolean(
      import.meta.env.VITE_SMS_API_KEY ||
      import.meta.env.VITE_TWILIO_ACCOUNT_SID
    );
  }

  static async send(payload: ExternalDispatchPayload): Promise<ExternalDispatchResult> {
    if (!payload.toPhone) {
      return { success: false, channel: "sms", provider: "twilio", mode: "disabled", error: "Missing phone number" };
    }

    if (!this.isConfigured()) {
      // Demo / Developer mode
      console.log("[Qblink SMS Demo Dispatch]", {
        to: payload.toPhone,
        messageType: payload.messageType,
        text: payload.bodyText,
      });
      return {
        success: true,
        channel: "sms",
        provider: "qblink-simulated-sms",
        messageId: `sms_demo_${Date.now()}`,
        mode: "demo",
      };
    }

    try {
      const response = await fetch("/api/notifications/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`SMS endpoint returned status ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        channel: "sms",
        provider: "twilio",
        messageId: data.messageId || `sms_${Date.now()}`,
        mode: "production",
      };
    } catch (err: any) {
      return {
        success: false,
        channel: "sms",
        provider: "twilio",
        mode: "production",
        error: err?.message || "Failed to dispatch SMS",
      };
    }
  }
}
