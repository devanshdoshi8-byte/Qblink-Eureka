/**
 * Web Push & Browser Notification Provider
 *
 * Handles standard Web Notification API and Service Worker Web Push
 * with permission state management, fallbacks, and sound/vibration alerts.
 */

export type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";

export interface PushSubscriptionData {
  endpoint: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
}

export class WebPushProvider {
  /** Check if notifications are supported by this browser */
  static isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  }

  /** Get current permission state */
  static getPermission(): NotificationPermissionState {
    if (!this.isSupported()) return "unsupported";
    return Notification.permission as NotificationPermissionState;
  }

  /** Request user permission */
  static async requestPermission(): Promise<NotificationPermissionState> {
    if (!this.isSupported()) return "unsupported";
    try {
      const result = await Notification.requestPermission();
      return result as NotificationPermissionState;
    } catch {
      return "denied";
    }
  }

  /**
   * Dispatch a local browser notification
   */
  static showNotification({
    title,
    body,
    icon = "/icon-192.png",
    tag,
    data,
    vibrate = [200, 100, 200],
  }: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    data?: Record<string, unknown>;
    vibrate?: number[];
  }): boolean {
    if (!this.isSupported() || this.getPermission() !== "granted") {
      return false;
    }

    try {
      // Haptic vibration feedback if supported
      if (typeof navigator !== "undefined" && "vibrate" in navigator && vibrate) {
        try {
          navigator.vibrate(vibrate);
        } catch {}
      }

      // Try Service Worker registration showNotification first if available
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready
          .then((reg) => {
            reg.showNotification(title, {
              body,
              icon,
              tag,
              data,
              badge: "/favicon.png",
            });
          })
          .catch(() => {
            new Notification(title, { body, icon, tag, data });
          });
        return true;
      }

      // Fallback to standard Notification constructor
      new Notification(title, { body, icon, tag, data });
      return true;
    } catch (err) {
      console.warn("Failed to display notification:", err);
      return false;
    }
  }
}
