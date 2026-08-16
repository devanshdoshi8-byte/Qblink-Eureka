/**
 * Types and definitions for the ChaosToClarityExperience feature module.
 * 
 * Entirely isolated from production database and queue models.
 */

export type SimulationMode = "guided" | "explore" | "judge";
export type TransformationPhase = "before" | "transitioning" | "after";

export type StoryStepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface StoryStep {
  number: StoryStepNumber;
  id: string;
  tagline: string;
  title: string;
  beforeDescription: string;
  afterDescription: string;
  humanContext: string;
  hotspotTarget?: HotspotId;
  presenterCue: string;
}

export type IndustryKey = "clinic" | "restaurant" | "salon" | "government" | "diagnostic";

export interface IndustryConfig {
  id: IndustryKey;
  label: string;
  icon: string;
  locationName: string;
  customerTitle: string;
  staffTitle: string;
  counterTitle: string;
  serviceAction: string;
  beforeChaosDescription: string;
  afterClarityDescription: string;
  defaultWaitEstimate: string;
  protagonistName: string;
  protagonistRole: string;
  opportunityCostNote: string;
}

export type HotspotId =
  | "reception"
  | "waiting_lounge"
  | "qr_standee"
  | "protagonist"
  | "queue_display"
  | "staff_terminal"
  | "wall_clock"
  | "remote_cafe";

export interface HotspotInfo {
  id: HotspotId;
  label: string;
  category: "problem" | "solution" | "device";
  beforeNote: string;
  afterNote: string;
  x: number; // percentage in scene (0-100)
  y: number; // percentage in scene (0-100)
}

export type PerspectiveView = "scene" | "customer_phone" | "staff_terminal";

export interface ChaosToClarityState {
  industry: IndustryKey;
  phase: TransformationPhase;
  storyStep: StoryStepNumber;
  mode: SimulationMode;
  activeHotspot: HotspotId | null;
  perspective: PerspectiveView;
  fastForwardMinutes: 0 | 5 | 10 | 20;
  isMuted: boolean;
  isPlayingTour: boolean;
  cameraAngle: number; // -180 to 180 degrees
}
