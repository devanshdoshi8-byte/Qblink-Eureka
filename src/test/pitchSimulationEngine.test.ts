import { describe, it, expect } from "vitest";
import {
  createInitialPitchState,
  callNextVisitor,
  serveCurrentVisitor,
  simulateTrafficWalkins,
  requestGrace,
  deriveCustomerViewMetrics,
  INDUSTRY_PRESETS,
} from "../lib/pitchSimulationEngine";

describe("Pitch Simulation Engine (Dual-Device Isolated Demo)", () => {
  it("initializes a clean canonical pitch state with customer at position 3 (4th in line)", () => {
    const state = createInitialPitchState("clinic");
    expect(state.businessName).toBe("Apex Multi-Speciality Clinic");
    expect(state.nowServing?.token).toBe("A-100");
    expect(state.waitingList).toHaveLength(5);
    expect(state.userToken).toBe("A-104");

    const userMetrics = deriveCustomerViewMetrics(state);
    expect(userMetrics.status).toBe("waiting");
    expect(userMetrics.aheadCount).toBe(3); // 3 people ahead (A-101, A-102, A-103)
    expect(userMetrics.estimatedWaitMinutes).toBe(12); // (3+1) * 3min
    expect(userMetrics.progressPercentage).toBeGreaterThan(0);
  });

  it("decrements people ahead when staff calls next visitor", () => {
    let state = createInitialPitchState("clinic");

    // Call Next #1: A-101 is called
    state = callNextVisitor(state);
    expect(state.nowServing?.token).toBe("A-101");
    expect(state.servedList).toHaveLength(1);
    expect(state.servedList[0].token).toBe("A-100");

    let metrics = deriveCustomerViewMetrics(state);
    expect(metrics.aheadCount).toBe(2); // A-102, A-103 ahead
    expect(metrics.estimatedWaitMinutes).toBe(9);

    // Call Next #2: A-102 is called
    state = callNextVisitor(state);
    expect(state.nowServing?.token).toBe("A-102");
    metrics = deriveCustomerViewMetrics(state);
    expect(metrics.aheadCount).toBe(1); // A-103 ahead
    expect(metrics.estimatedWaitMinutes).toBe(6);

    // Call Next #3: A-103 is called (User is now next in line!)
    state = callNextVisitor(state);
    expect(state.nowServing?.token).toBe("A-103");
    metrics = deriveCustomerViewMetrics(state);
    expect(metrics.aheadCount).toBe(0);
    expect(metrics.status).toBe("next");
    expect(metrics.headline).toBe("You're Next in Line");

    // Call Next #4: User (A-104) is called!
    state = callNextVisitor(state);
    expect(state.nowServing?.token).toBe("A-104");
    expect(state.nowServing?.isUser).toBe(true);
    metrics = deriveCustomerViewMetrics(state);
    expect(metrics.status).toBe("called");
    expect(metrics.headline).toBe("It's your turn!");
    expect(metrics.progressPercentage).toBe(100);
  });

  it("activates 2-minute arrival grace properly", () => {
    let state = createInitialPitchState("clinic");
    // Advance to where user is next
    state = callNextVisitor(state); // A-101
    state = callNextVisitor(state); // A-102
    state = callNextVisitor(state); // A-103 (User is next)

    state = requestGrace(state);
    expect(state.userGraceExpiresAt).toBeGreaterThan(Date.now());
    const metrics = deriveCustomerViewMetrics(state);
    expect(metrics.status).toBe("grace");
    expect(metrics.headline).toContain("Grace Active");
  });

  it("supports multiple industry presets with clean data", () => {
    const cafeState = createInitialPitchState("cafe");
    expect(cafeState.businessName).toBe("Blue Harbor Artisan Roastery");
    expect(cafeState.userToken).toBe("T-24");

    const salonState = createInitialPitchState("salon");
    expect(salonState.businessName).toBe("Luxe Studio & Spa");
    expect(salonState.userToken).toBe("S-18");

    const counterState = createInitialPitchState("counter");
    expect(counterState.businessName).toBe("City Civil Administration");
    expect(counterState.userToken).toBe("C-82");
  });

  it("injects simulated walk-ins cleanly to the tail of the queue", () => {
    let state = createInitialPitchState("clinic");
    const initialCount = state.waitingList.length;
    state = simulateTrafficWalkins(state);
    expect(state.waitingList.length).toBe(initialCount + 3);
  });
});
