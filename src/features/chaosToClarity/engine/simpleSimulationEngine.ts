/**
 * Simple, ultra-clean simulation engine for the rebuilt ChaosToClarity experience.
 * 
 * 100% In-memory state. Zero database mutations.
 */

export interface SimpleQueueState {
  step: 1 | 2 | 3; // 1: Chaos, 2: Scan & Transform, 3: Live Pocket Queue
  nowServing: number;
  protagonistToken: number;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  isCalled: boolean;
  hasGraceAlert: boolean;
}

export function createInitialSimpleState(): SimpleQueueState {
  return {
    step: 1,
    nowServing: 22,
    protagonistToken: 26,
    peopleAhead: 4,
    estimatedWaitMinutes: 12,
    isCalled: false,
    hasGraceAlert: false,
  };
}

export function callNextInSimpleQueue(state: SimpleQueueState): SimpleQueueState {
  if (state.isCalled) return state;

  const nextServing = state.nowServing + 1;
  const newAhead = Math.max(0, state.protagonistToken - nextServing);
  const newWait = newAhead * 3;
  const isNowCalled = nextServing >= state.protagonistToken;

  return {
    ...state,
    nowServing: nextServing,
    peopleAhead: newAhead,
    estimatedWaitMinutes: newWait,
    isCalled: isNowCalled,
    hasGraceAlert: newAhead === 1,
  };
}
