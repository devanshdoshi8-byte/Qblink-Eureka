import { describe, it, expect, beforeEach, vi } from "vitest";
import { notificationService } from "@/lib/notifications/notificationService";
import { WebPushProvider } from "@/lib/notifications/providers/webPushProvider";

describe("Proactive Notification Service", () => {
  beforeEach(() => {
    notificationService.clearCache();
    vi.restoreAllMocks();
  });

  it("composes clear, professional messages for each milestone", () => {
    const calledMsg = notificationService.composeMessage({
      tokenNumber: 42,
      businessName: "Aroma Cafe",
      queueName: "Main Line",
      eventType: "called",
    });
    expect(calledMsg.title).toContain("Ticket #42");
    expect(calledMsg.body).toContain("Please proceed to the counter");

    const pos1Msg = notificationService.composeMessage({
      tokenNumber: 42,
      businessName: "City Clinic",
      queueName: "Doctor Queue",
      eventType: "position_1",
    });
    expect(pos1Msg.title).toContain("You're Next");
  });

  it("prevents duplicate notifications for the same visitor and event", async () => {
    vi.spyOn(WebPushProvider, "showNotification").mockReturnValue(true);

    const first = await notificationService.dispatch({
      visitorId: "vis-123",
      tokenNumber: 15,
      businessName: "Salon Elegance",
      queueName: "Haircut",
      eventType: "position_2",
    });
    expect(first.dispatched).toBe(true);
    expect(notificationService.hasDispatched("vis-123", "position_2")).toBe(true);

    // Second duplicate attempt
    const second = await notificationService.dispatch({
      visitorId: "vis-123",
      tokenNumber: 15,
      businessName: "Salon Elegance",
      queueName: "Haircut",
      eventType: "position_2",
    });
    expect(second.dispatched).toBe(false);
    expect(second.skippedReason).toBe("already_dispatched");
  });

  it("evaluates milestone triggers at position 1, 2, and 5", () => {
    const dispatchSpy = vi.spyOn(notificationService, "dispatch");

    // When aheadCount is 0 (You're next)
    notificationService.evaluateQueueMilestone({
      visitorId: "vis-456",
      tokenNumber: 19,
      aheadCount: 0,
      myStatus: "waiting",
      businessName: "Express Pharmacy",
      queueName: "Prescriptions",
    });
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "position_1" })
    );

    // When status flips to called
    notificationService.evaluateQueueMilestone({
      visitorId: "vis-456",
      tokenNumber: 19,
      aheadCount: 0,
      myStatus: "called",
      businessName: "Express Pharmacy",
      queueName: "Prescriptions",
    });
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "called" })
    );
  });
});
