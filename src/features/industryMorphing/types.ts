/**
 * Type definitions for the 4-Industry Spatial Morphing Preset Selector.
 * 
 * 100% isolated from production backend models.
 */

export type MorphIndustryKey = "clinic" | "dining" | "salon" | "government";

export interface MorphCustomerPerspective {
  roleTitle: string;
  name: string;
  tokenNumber: string;
  queueLabel: string;
  peopleAheadText: string;
  estimatedWaitText: string;
  destinationText: string;
  statusBadge: string;
  actionNote: string;
}

export interface MorphBusinessPerspective {
  operatorRole: string;
  counterName: string;
  nowServingToken: string;
  waitingCountText: string;
  velocityMetric: string;
  manifestSample: Array<{ token: string; name: string; detail: string }>;
  operationalImpactNote: string;
}

export interface IndustryMorphConfig {
  id: MorphIndustryKey;
  label: string;
  icon: string;
  locationName: string;
  tagline: string;
  description: string;
  themeColor: string; // Tailwind color token
  customer: MorphCustomerPerspective;
  business: MorphBusinessPerspective;
  frictionProblem: string;
  qblinkFix: string;
  heroImage: {
    webp480: string;
    webp800: string;
    webp1200: string;
    jpg: string;
  };
}
