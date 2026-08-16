// Smart defaults applied automatically when a business picks an industry.
// Users can still customize any of these later in the dashboard.

export type Industry =
  | "Clinic"
  | "Restaurant"
  | "Salon"
  | "Government Office"
  | "Pharmacy"
  | "Diagnostic Centre"
  | "Retail"
  | "Service Centre"
  | "Others";

export const INDUSTRIES: Industry[] = [
  "Clinic",
  "Restaurant",
  "Salon",
  "Government Office",
  "Pharmacy",
  "Diagnostic Centre",
  "Retail",
  "Service Centre",
  "Others",
];

export interface IndustryDefaults {
  queue_config: "single" | "counters" | "seating" | "appointment";
  queue_type: "standard" | "restaurant";
  arrival_window_minutes: number;
  auto_expire_minutes: number;
  join_cooldown_minutes: number;
  estimated_service_time: number; // minutes
  party_size_enabled: boolean;
  alerts: string[]; // labels of enabled alert toggles
  highlights: string[]; // short bullets shown to the user during signup
}

export const INDUSTRY_DEFAULTS: Record<Industry, IndustryDefaults> = {
  Clinic: {
    queue_config: "single",
    queue_type: "standard",
    arrival_window_minutes: 10,
    auto_expire_minutes: 30,
    join_cooldown_minutes: 15,
    estimated_service_time: 8,
    party_size_enabled: false,
    alerts: ["doctor_delay"],
    highlights: [
      "Single Queue",
      "Arrival Window: 10 min",
      "Doctor Delay Alerts ON",
    ],
  },
  Restaurant: {
    queue_config: "seating",
    queue_type: "restaurant",
    arrival_window_minutes: 10,
    auto_expire_minutes: 20,
    join_cooldown_minutes: 10,
    estimated_service_time: 25,
    party_size_enabled: true,
    alerts: ["table_ready"],
    highlights: [
      "Seating Based Queue",
      "Party Size ON",
      "Table Ready Alerts ON",
    ],
  },
  Salon: {
    queue_config: "appointment",
    queue_type: "standard",
    arrival_window_minutes: 15,
    auto_expire_minutes: 30,
    join_cooldown_minutes: 10,
    estimated_service_time: 30,
    party_size_enabled: false,
    alerts: ["service_time"],
    highlights: [
      "Appointment + Walk-in Queue",
      "Estimated Service Time ON",
      "Arrival Window: 15 min",
    ],
  },
  "Government Office": {
    queue_config: "counters",
    queue_type: "standard",
    arrival_window_minutes: 15,
    auto_expire_minutes: 45,
    join_cooldown_minutes: 30,
    estimated_service_time: 12,
    party_size_enabled: false,
    alerts: ["counter_ready"],
    highlights: [
      "Multiple Counters",
      "Arrival Window: 15 min",
      "Counter Ready Alerts ON",
    ],
  },
  Pharmacy: {
    queue_config: "single",
    queue_type: "standard",
    arrival_window_minutes: 5,
    auto_expire_minutes: 15,
    join_cooldown_minutes: 5,
    estimated_service_time: 4,
    party_size_enabled: false,
    alerts: ["prescription_ready"],
    highlights: [
      "Single Queue",
      "Arrival Window: 5 min",
      "Prescription Ready Alerts ON",
    ],
  },
  "Diagnostic Centre": {
    queue_config: "counters",
    queue_type: "standard",
    arrival_window_minutes: 10,
    auto_expire_minutes: 30,
    join_cooldown_minutes: 15,
    estimated_service_time: 15,
    party_size_enabled: false,
    alerts: ["test_ready", "fasting_reminder"],
    highlights: [
      "Multiple Test Counters",
      "Fasting Reminder ON",
      "Arrival Window: 10 min",
    ],
  },
  Retail: {
    queue_config: "counters",
    queue_type: "standard",
    arrival_window_minutes: 5,
    auto_expire_minutes: 15,
    join_cooldown_minutes: 5,
    estimated_service_time: 5,
    party_size_enabled: false,
    alerts: ["billing_ready"],
    highlights: [
      "Multiple Billing Counters",
      "Fast Arrival Window: 5 min",
      "Billing Ready Alerts ON",
    ],
  },
  "Service Centre": {
    queue_config: "counters",
    queue_type: "standard",
    arrival_window_minutes: 15,
    auto_expire_minutes: 45,
    join_cooldown_minutes: 30,
    estimated_service_time: 20,
    party_size_enabled: false,
    alerts: ["technician_ready", "job_status"],
    highlights: [
      "Multiple Service Bays",
      "Job Status Alerts ON",
      "Arrival Window: 15 min",
    ],
  },
  Others: {
    queue_config: "single",
    queue_type: "standard",
    arrival_window_minutes: 10,
    auto_expire_minutes: 30,
    join_cooldown_minutes: 10,
    estimated_service_time: 10,
    party_size_enabled: false,
    alerts: [],
    highlights: [
      "Single Queue",
      "Balanced defaults",
      "Fully customizable later",
    ],
  },
};

export const getIndustryDefaults = (industry: string): IndustryDefaults =>
  INDUSTRY_DEFAULTS[(industry as Industry)] ?? INDUSTRY_DEFAULTS.Others;