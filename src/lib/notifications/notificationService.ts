/**
 * Qblink Master Notification Service
 *
 * Central orchestration service for multi-stage proactive notifications:
 * - Position 5: "You're 5th in line."
 * - Position 2: "You're almost up."
 * - Position 1: "You're next. Please get ready."
 * - Turn / Called: "It's your turn. Please head to the counter."
 * - Grace: "Your arrival grace window is running."
 *
 * Features idempotency caching, user preference storage, and audio chime triggers.
 */

import { WebPushProvider, NotificationPermissionState } from "./providers/webPushProvider";
import { WhatsAppAdapter, SMSAdapter, ExternalDispatchResult } from "./providers/externalAdapters";

export type NotificationChannel = "push" | "whatsapp" | "sms" | "in_app";

export type NotificationEventType =
  | "joined"
  | "position_5"
  | "position_2"
  | "position_1"
  | "called"
  | "grace_active"
  | "grace_expiring";

export interface CustomerNotificationPreferences {
  enabledChannels: NotificationChannel[];
  phone?: string;
  allowSound: boolean;
}

export interface DispatchNotificationParams {
  visitorId: string;
  tokenNumber: number;
  businessName: string;
  queueName: string;
  eventType: NotificationEventType;
  aheadCount?: number;
  waitMinutes?: number;
  phone?: string;
  preferences?: CustomerNotificationPreferences;
}

class NotificationService {
  private dispatchedCache: Set<string> = new Set();
  private storageKey = "qblink:notif_dispatched";

  constructor() {
    this.restoreCache();
  }

  private restoreCache() {
    if (typeof sessionStorage === "undefined") return;
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          this.dispatchedCache = new Set(arr);
        }
      }
    } catch {}
  }

  private persistCache() {
    if (typeof sessionStorage === "undefined") return;
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.dispatchedCache)));
    } catch {}
  }

  private getDeduplicationKey(visitorId: string, eventType: NotificationEventType): string {
    return `${visitorId}:${eventType}`;
  }

  /**
   * Reset deduplication cache for testing or session resets
   */
  clearCache() {
    this.dispatchedCache.clear();
    this.persistCache();
  }

  /**
   * Check if a notification has already been sent
   */
  hasDispatched(visitorId: string, eventType: NotificationEventType): boolean {
    return this.dispatchedCache.has(this.getDeduplicationKey(visitorId, eventType));
  }

  /**
   * Compose notification headline and body based on event type
   */
  composeMessage({
    tokenNumber,
    businessName,
    queueName,
    eventType,
    aheadCount,
    waitMinutes,
  }: {
    tokenNumber: number;
    businessName: string;
    queueName: string;
    eventType: NotificationEventType;
    aheadCount?: number;
    waitMinutes?: number;
  }): { title: string; body: string } {
    switch (eventType) {
      case "position_5":
        return {
          title: `Ticket #${tokenNumber} • 5th in Line`,
          body: `You are now 5th in line at ${businessName}. Estimated wait: ~${waitMinutes ?? 15} min.`,
        };
      case "position_2":
        return {
          title: `Ticket #${tokenNumber} • Almost Up!`,
          body: `Only 1 person ahead of you at ${businessName}. Please start heading towards the waiting area.`,
        };
      case "position_1":
        return {
          title: `Ticket #${tokenNumber} • You're Next!`,
          body: `You are next in line at ${businessName}. Please get ready to approach the counter.`,
        };
      case "called":
        return {
          title: `🎉 It's Your Turn! Ticket #${tokenNumber}`,
          body: `${businessName} (${queueName}) is calling ticket #${tokenNumber}. Please proceed to the counter now.`,
        };
      case "grace_active":
        return {
          title: `⏳ Arrival Grace Window Active`,
          body: `Your grace period for ticket #${tokenNumber} has started. Head to the counter now.`,
        };
      case "grace_expiring":
        return {
          title: `⚠️ 1 Minute Grace Remaining`,
          body: `Your arrival window for ticket #${tokenNumber} expires in 1 minute.`,
        };
      case "joined":
      default:
        return {
          title: `Ticket #${tokenNumber} Confirmed`,
          body: `You've joined ${businessName} (${queueName}). Track live position anytime.`,
        };
    }
  }

  /**
   * Dispatch proactive notification across all enabled channels
   */
  async dispatch(params: DispatchNotificationParams): Promise<{
    dispatched: boolean;
    channelsDispatched: NotificationChannel[];
    skippedReason?: string;
  }> {
    const { visitorId, tokenNumber, businessName, queueName, eventType, aheadCount, waitMinutes, phone, preferences } = params;

    // Deduplication check
    const dedupKey = this.getDeduplicationKey(visitorId, eventType);
    if (this.dispatchedCache.has(dedupKey)) {
      return { dispatched: false, channelsDispatched: [], skippedReason: "already_dispatched" };
    }

    const { title, body } = this.composeMessage({
      tokenNumber,
      businessName,
      queueName,
      eventType,
      aheadCount,
      waitMinutes,
    });

    const enabledChannels = preferences?.enabledChannels || ["push"];
    const channelsDispatched: NotificationChannel[] = [];

    // 1. Browser Web Push / Web Notification API
    if (enabledChannels.includes("push")) {
      const shown = WebPushProvider.showNotification({
        title,
        body,
        tag: `qb-${visitorId}-${eventType}`,
        vibrate: eventType === "called" ? [300, 100, 300, 100, 500] : [200, 80, 200],
      });
      if (shown) channelsDispatched.push("push");
    }

    // 2. WhatsApp
    if (enabledChannels.includes("whatsapp") && (phone || preferences?.phone)) {
      const targetPhone = (phone || preferences?.phone)!;
      const res: ExternalDispatchResult = await WhatsAppAdapter.send({
        toPhone: targetPhone,
        businessName,
        queueName,
        tokenNumber,
        messageType: eventType as any,
        bodyText: body,
      });
      if (res.success) channelsDispatched.push("whatsapp");
    }

    // 3. SMS
    if (enabledChannels.includes("sms") && (phone || preferences?.phone)) {
      const targetPhone = (phone || preferences?.phone)!;
      const res: ExternalDispatchResult = await SMSAdapter.send({
        toPhone: targetPhone,
        businessName,
        queueName,
        tokenNumber,
        messageType: eventType as any,
        bodyText: body,
      });
      if (res.success) channelsDispatched.push("sms");
    }

    // Mark as dispatched in session cache
    this.dispatchedCache.add(dedupKey);
    this.persistCache();

    return {
      dispatched: true,
      channelsDispatched,
    };
  }

  /**
   * Evaluates current queue position and dispatches proactive notifications
   * for milestone transitions (5, 2, 1, 0).
   */
  evaluateQueueMilestone({
    visitorId,
    tokenNumber,
    aheadCount,
    myStatus,
    businessName,
    queueName,
    waitMinutes,
    phone,
    preferences,
  }: {
    visitorId: string;
    tokenNumber: number;
    aheadCount: number;
    myStatus: string;
    businessName: string;
    queueName: string;
    waitMinutes?: number;
    phone?: string;
    preferences?: CustomerNotificationPreferences;
  }) {
    if (!visitorId || !tokenNumber) return;

    if (myStatus === "called") {
      this.dispatch({
        visitorId,
        tokenNumber,
        businessName,
        queueName,
        eventType: "called",
        phone,
        preferences,
      });
      return;
    }

    if (aheadCount === 0) {
      this.dispatch({
        visitorId,
        tokenNumber,
        businessName,
        queueName,
        eventType: "position_1",
        aheadCount: 0,
        waitMinutes: 2,
        phone,
        preferences,
      });
    } else if (aheadCount === 1) {
      this.dispatch({
        visitorId,
        tokenNumber,
        businessName,
        queueName,
        eventType: "position_2",
        aheadCount: 1,
        waitMinutes,
        phone,
        preferences,
      });
    } else if (aheadCount === 4) {
      this.dispatch({
        visitorId,
        tokenNumber,
        businessName,
        queueName,
        eventType: "position_5",
        aheadCount: 4,
        waitMinutes,
        phone,
        preferences,
      });
    }
  }
}

export const notificationService = new NotificationService();
