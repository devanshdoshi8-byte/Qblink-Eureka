/**
 * Pitch Simulation Engine
 * 
 * Provides an isolated, deterministic, in-memory state machine
 * for the Dual-Device Pitch Simulator.
 * 
 * GUARANTEE: Zero database mutations. Zero production table writes.
 */

export type IndustryType = "clinic" | "cafe" | "salon" | "counter";

export interface IndustryConfig {
  id: IndustryType;
  label: string;
  businessName: string;
  queueName: string;
  counterName: string;
  userToken: string;
  defaultVelocity: number; // minutes per guest
}

export const INDUSTRY_PRESETS: Record<IndustryType, IndustryConfig> = {
  clinic: {
    id: "clinic",
    label: "🏥 Healthcare Clinic",
    businessName: "Apex Multi-Speciality Clinic",
    queueName: "Dr. Mehta • General OPD",
    counterName: "Consultation Room 3",
    userToken: "A-104",
    defaultVelocity: 3,
  },
  cafe: {
    id: "cafe",
    label: "☕ Dining & Cafe",
    businessName: "Blue Harbor Artisan Roastery",
    queueName: "Table Seating • Main Dining",
    counterName: "Host Stand",
    userToken: "T-24",
    defaultVelocity: 4,
  },
  salon: {
    id: "salon",
    label: "💇 Salon & Spa",
    businessName: "Luxe Studio & Spa",
    queueName: "Senior Stylist • Hair & Spa",
    counterName: "Styling Station 2",
    userToken: "S-18",
    defaultVelocity: 5,
  },
  counter: {
    id: "counter",
    label: "🏛️ Citizen Counter",
    businessName: "City Civil Administration",
    queueName: "Document Verification & Permits",
    counterName: "Counter 4",
    userToken: "C-82",
    defaultVelocity: 2,
  },
};

export interface SimulatedVisitor {
  id: string;
  token: string;
  name: string;
  status: "waiting" | "called" | "served" | "grace";
  isUser: boolean;
  partySize?: number;
  graceExpiresAt?: number | null;
}

export interface PitchSimulatorState {
  industry: IndustryType;
  businessName: string;
  queueName: string;
  counterName: string;
  isPaused: boolean;
  nowServing: SimulatedVisitor | null;
  waitingList: SimulatedVisitor[];
  servedList: SimulatedVisitor[];
  velocityMinutes: number;
  recentActivity: { id: string; text: string; time: string }[];
  userToken: string;
  userGraceExpiresAt: number | null;
  stepCount: number;
}

/**
 * Creates the canonical starting state for a pitch demonstration.
 */
export function createInitialPitchState(industry: IndustryType = "clinic"): PitchSimulatorState {
  const config = INDUSTRY_PRESETS[industry];

  const prefix = industry === "clinic" ? "A-" : industry === "cafe" ? "T-" : industry === "salon" ? "S-" : "C-";
  const startNum = industry === "clinic" ? 100 : industry === "cafe" ? 20 : industry === "salon" ? 14 : 78;

  const nowServing: SimulatedVisitor = {
    id: "sim-0",
    token: `${prefix}${startNum}`,
    name: "Kavita Rao",
    status: "called",
    isUser: false,
  };

  const waitingList: SimulatedVisitor[] = [
    { id: "sim-1", token: `${prefix}${startNum + 1}`, name: "Aarav Sharma", status: "waiting", isUser: false },
    { id: "sim-2", token: `${prefix}${startNum + 2}`, name: "Priya Patel", status: "waiting", isUser: false },
    { id: "sim-3", token: `${prefix}${startNum + 3}`, name: "Vikram Malhotra", status: "waiting", isUser: false },
    { id: "sim-4", token: `${prefix}${startNum + 4}`, name: "You (Judge Demo)", status: "waiting", isUser: true },
    { id: "sim-5", token: `${prefix}${startNum + 5}`, name: "Rohan Verma", status: "waiting", isUser: false },
  ];

  return {
    industry,
    businessName: config.businessName,
    queueName: config.queueName,
    counterName: config.counterName,
    isPaused: false,
    nowServing,
    waitingList,
    servedList: [],
    velocityMinutes: config.defaultVelocity,
    recentActivity: [
      { id: "act-1", text: `Token ${nowServing.token} called to ${config.counterName}`, time: "Just now" },
      { id: "act-0", text: "Queue opened for today's session", time: "2m ago" },
    ],
    userToken: `${prefix}${startNum + 4}`,
    userGraceExpiresAt: null,
    stepCount: 0,
  };
}

/**
 * Advances the queue by calling the next customer.
 */
export function callNextVisitor(state: PitchSimulatorState): PitchSimulatorState {
  if (state.waitingList.length === 0) return state;

  const [next, ...remainingWaiting] = state.waitingList;
  const newServedList = state.nowServing
    ? [{ ...state.nowServing, status: "served" as const }, ...state.servedList]
    : state.servedList;

  const activeNowServing: SimulatedVisitor = {
    ...next,
    status: "called",
  };

  const newActivity = [
    {
      id: `act-${Date.now()}-${Math.random()}`,
      text: `Token ${activeNowServing.token} (${activeNowServing.name}) called to ${state.counterName}`,
      time: "Just now",
    },
    ...state.recentActivity.slice(0, 5),
  ];

  return {
    ...state,
    nowServing: activeNowServing,
    waitingList: remainingWaiting,
    servedList: newServedList,
    recentActivity: newActivity,
    stepCount: state.stepCount + 1,
  };
}

/**
 * Marks the currently serving customer as served without immediately calling the next.
 */
export function serveCurrentVisitor(state: PitchSimulatorState): PitchSimulatorState {
  if (!state.nowServing) return state;

  const completed = { ...state.nowServing, status: "served" as const };
  return {
    ...state,
    nowServing: null,
    servedList: [completed, ...state.servedList],
    recentActivity: [
      {
        id: `act-${Date.now()}`,
        text: `Token ${completed.token} marked as served`,
        time: "Just now",
      },
      ...state.recentActivity.slice(0, 5),
    ],
    stepCount: state.stepCount + 1,
  };
}

/**
 * Injects 3 simulated walk-in customers to the end of the line.
 */
export function simulateTrafficWalkins(state: PitchSimulatorState): PitchSimulatorState {
  const lastWaiting = state.waitingList[state.waitingList.length - 1];
  const lastTokenStr = lastWaiting ? lastWaiting.token : state.nowServing ? state.nowServing.token : "A-100";
  const prefix = lastTokenStr.split("-")[0] + "-";
  const lastNum = parseInt(lastTokenStr.split("-")[1] || "100", 10);

  const sampleNames = ["Ananya Desai", "Kabir Sen", "Meera Joshi", "Aditya Nair", "Sneha Rao"];
  const newWalkins: SimulatedVisitor[] = [
    {
      id: `sim-new-${Date.now()}-1`,
      token: `${prefix}${lastNum + 1}`,
      name: sampleNames[Math.floor(Math.random() * sampleNames.length)],
      status: "waiting",
      isUser: false,
    },
    {
      id: `sim-new-${Date.now()}-2`,
      token: `${prefix}${lastNum + 2}`,
      name: sampleNames[Math.floor(Math.random() * sampleNames.length)],
      status: "waiting",
      isUser: false,
    },
    {
      id: `sim-new-${Date.now()}-3`,
      token: `${prefix}${lastNum + 3}`,
      name: sampleNames[Math.floor(Math.random() * sampleNames.length)],
      status: "waiting",
      isUser: false,
    },
  ];

  return {
    ...state,
    waitingList: [...state.waitingList, ...newWalkins],
    recentActivity: [
      {
        id: `act-${Date.now()}`,
        text: `3 new walk-ins joined (${newWalkins[0].token} - ${newWalkins[2].token})`,
        time: "Just now",
      },
      ...state.recentActivity.slice(0, 5),
    ],
  };
}

/**
 * Triggers the customer 2-minute arrival grace period.
 */
export function requestGrace(state: PitchSimulatorState): PitchSimulatorState {
  const expires = Date.now() + 2 * 60 * 1000;
  
  // Update waiting list or nowServing if user is present
  const updatedWaiting = state.waitingList.map((v) =>
    v.isUser ? { ...v, status: "grace" as const, graceExpiresAt: expires } : v
  );

  const updatedNowServing =
    state.nowServing && state.nowServing.isUser
      ? { ...state.nowServing, status: "grace" as const, graceExpiresAt: expires }
      : state.nowServing;

  return {
    ...state,
    waitingList: updatedWaiting,
    nowServing: updatedNowServing,
    userGraceExpiresAt: expires,
    recentActivity: [
      {
        id: `act-${Date.now()}`,
        text: `⏳ Arrival grace requested by ${state.userToken} (2 min hold)`,
        time: "Just now",
      },
      ...state.recentActivity.slice(0, 5),
    ],
  };
}

/**
 * Calculates user-specific queue metrics.
 */
export function deriveCustomerViewMetrics(state: PitchSimulatorState) {
  const userInWaitingIndex = state.waitingList.findIndex((v) => v.isUser);
  const isNowServing = state.nowServing?.isUser || false;

  if (isNowServing) {
    return {
      status: state.nowServing?.status === "grace" ? ("grace" as const) : ("called" as const),
      aheadCount: 0,
      estimatedWaitMinutes: 0,
      headline: "It's your turn!",
      subtext: `Please proceed to ${state.counterName}`,
      progressPercentage: 100,
    };
  }

  if (userInWaitingIndex === -1) {
    // Check if already served
    const isServed = state.servedList.some((v) => v.isUser);
    if (isServed) {
      return {
        status: "served" as const,
        aheadCount: 0,
        estimatedWaitMinutes: 0,
        headline: "Visit Complete",
        subtext: "Thank you for visiting. Your session is finished.",
        progressPercentage: 100,
      };
    }
    return {
      status: "not_in_queue" as const,
      aheadCount: 0,
      estimatedWaitMinutes: 0,
      headline: "Not in Queue",
      subtext: "Please join the queue to take a ticket.",
      progressPercentage: 0,
    };
  }

  const aheadCount = userInWaitingIndex;
  const estimatedWaitMinutes = (aheadCount + 1) * state.velocityMinutes;
  const isGrace = state.waitingList[userInWaitingIndex]?.status === "grace";

  let headline = `In Line • ${aheadCount} ahead`;
  let subtext = `Estimated wait: ~${estimatedWaitMinutes} minutes`;
  if (aheadCount === 0) {
    headline = "You're Next in Line";
    subtext = "Please get ready to approach the counter";
  }

  if (isGrace) {
    headline = "⏳ Arrival Grace Active";
    subtext = "Staff has been notified. 2-minute hold in progress.";
  }

  // Progress: 5 ahead = 20%, 0 ahead = 85%, called = 100%
  const totalInitial = 5;
  const progressPercentage = Math.min(90, Math.max(15, Math.round(((totalInitial - aheadCount) / totalInitial) * 85)));

  return {
    status: isGrace ? ("grace" as const) : aheadCount === 0 ? ("next" as const) : ("waiting" as const),
    aheadCount,
    estimatedWaitMinutes,
    headline,
    subtext,
    progressPercentage,
  };
}
