import { describe, it, expect } from "vitest";
import {
  createInitialSimpleState,
  callNextInSimpleQueue,
} from "../features/chaosToClarity/engine/simpleSimulationEngine";
import {
  createInitialSimulationState,
  INDUSTRY_CONFIGS,
  STORY_STEPS,
  HOTSPOTS,
} from "../features/chaosToClarity/engine/simulationState";

describe("Rebuilt 10-Second ChaosToClarity Engine", () => {
  it("initializes clean simple queue state (Now Serving #22, Anya #26, 4 ahead, ~12m wait)", () => {
    const state = createInitialSimpleState();
    expect(state.step).toBe(1);
    expect(state.nowServing).toBe(22);
    expect(state.protagonistToken).toBe(26);
    expect(state.peopleAhead).toBe(4);
    expect(state.estimatedWaitMinutes).toBe(12);
    expect(state.isCalled).toBe(false);
  });

  it("advances queue deterministically when Call Next is triggered", () => {
    let state = createInitialSimpleState();
    
    // Call 1
    state = callNextInSimpleQueue(state);
    expect(state.nowServing).toBe(23);
    expect(state.peopleAhead).toBe(3);
    expect(state.estimatedWaitMinutes).toBe(9);
    expect(state.isCalled).toBe(false);

    // Call 2
    state = callNextInSimpleQueue(state);
    expect(state.nowServing).toBe(24);
    expect(state.peopleAhead).toBe(2);
    expect(state.estimatedWaitMinutes).toBe(6);

    // Call 3 (1 ahead -> Grace alert)
    state = callNextInSimpleQueue(state);
    expect(state.nowServing).toBe(25);
    expect(state.peopleAhead).toBe(1);
    expect(state.hasGraceAlert).toBe(true);

    // Call 4 (Anya is called!)
    state = callNextInSimpleQueue(state);
    expect(state.nowServing).toBe(26);
    expect(state.peopleAhead).toBe(0);
    expect(state.isCalled).toBe(true);
  });
});

describe("ChaosToClarityExperience Comprehensive Presets", () => {
  it("initializes in predictable before-state with clinic preset", () => {
    const state = createInitialSimulationState("clinic");
    expect(state.phase).toBe("before");
    expect(state.storyStep).toBe(1);
    expect(state.mode).toBe("guided");
    expect(state.fastForwardMinutes).toBe(0);
    expect(state.industry).toBe("clinic");
  });

  it("contains all 7 narrative story steps with before and after descriptions", () => {
    expect(STORY_STEPS.length).toBe(7);
    STORY_STEPS.forEach((step) => {
      expect(step.number).toBeGreaterThanOrEqual(1);
      expect(step.number).toBeLessThanOrEqual(7);
      expect(step.title).toBeTruthy();
      expect(step.beforeDescription).toBeTruthy();
      expect(step.afterDescription).toBeTruthy();
      expect(step.humanContext).toBeTruthy();
      expect(step.presenterCue).toBeTruthy();
    });
  });

  it("provides 5 context-aware industry configurations", () => {
    const industries = Object.keys(INDUSTRY_CONFIGS);
    expect(industries).toEqual(["clinic", "restaurant", "salon", "government", "diagnostic"]);
  });
});
