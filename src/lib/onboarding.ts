import { supabase } from "@/integrations/supabase/client";

// Total planned steps in the full onboarding journey
export const TOTAL_STEPS = 6;

export type OnboardingRole = "business_owner" | "customer";

export interface OnboardingData {
  fullName: string;
  phone: string;
  socialProfile: string;
  role: OnboardingRole | null;
  tags: string[];
  /** Flexible bucket for answers from future story screens */
  responses: Record<string, unknown>;
}

export const defaultOnboardingData: OnboardingData = {
  fullName: "",
  phone: "",
  socialProfile: "",
  role: null,
  tags: [],
  responses: {},
};

const STORAGE_KEY = "qblink_onboarding_v1";
const LEAD_ID_KEY = "qblink_onboarding_lead_id";

export function loadOnboarding(): OnboardingData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultOnboardingData, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...defaultOnboardingData };
}

export function saveOnboarding(data: OnboardingData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

export const ROLE_OPTIONS: { value: OnboardingRole; label: string; description: string }[] = [
  {
    value: "business_owner",
    label: "Business Owner",
    description: "I run a business with walk-in customers",
  },
  {
    value: "customer",
    label: "Customer",
    description: "I'm tired of waiting in lines",
  },
];

export const TAG_OPTIONS: string[] = [
  "Clinic",
  "Restaurant",
  "Salon",
  "Diagnostic Center",
  "Retail Store",
  "Other Business",
  "Met the Founder",
  "Came Across the MVP",
  "Tired of Waiting in Queues",
  "Exploring New Ideas",
];

/** Frustration keys recognized by Stage 3 storytelling. */
export type FrustrationKey =
  | "not_knowing"
  | "leaving_early"
  | "constant_updates"
  | "complaints";

/**
 * Resolve which frustration to dramatize in Stage 3. Reads from
 * `responses.frustration` when set by a prior stage, otherwise falls
 * back to a sensible default for the user's role.
 */
export function resolveFrustration(data: OnboardingData): FrustrationKey {
  const fromResponse = (data.responses?.frustration as FrustrationKey | undefined) ?? null;
  if (fromResponse) return fromResponse;
  return data.role === "business_owner" ? "constant_updates" : "not_knowing";
}

/**
 * Persists the lead in the backend. Creates a row the first time and keeps
 * the id around so future screens can enrich the same lead.
 */
export async function persistLead(data: OnboardingData): Promise<void> {
  const leadId = crypto.randomUUID();
  const payload = {
    id: leadId,
    full_name: data.fullName.trim().slice(0, 100),
    phone: data.phone.trim().slice(0, 30),
    social_profile: data.socialProfile.trim().slice(0, 255) || null,
    role: data.role,
    tags: data.tags,
    responses: data.responses,
    status: "in_progress",
  };
  // Table is brand new; generated types may lag behind, hence the cast.
  const { error } = await (supabase as any).from("onboarding_leads").insert(payload);
  if (error) throw error;
  try {
    localStorage.setItem(LEAD_ID_KEY, leadId);
  } catch {
    /* ignore */
  }
}