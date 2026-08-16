import { UtensilsCrossed, Coffee, Stethoscope, Scissors, Landmark, Building2, LucideIcon } from "lucide-react";

export interface CategoryDef {
  key: string;
  label: string;
  // category strings stored on businesses that map into this group
  matches: string[];
  icon: LucideIcon;
  /** color tokens — solid background / icon color (Tailwind safe) */
  tint: string; // bg-* / text-*
  description: string;
  /** whether the pickup-order feature should be exposed for this category */
  supportsPickup: boolean;
}

export const CATEGORIES: CategoryDef[] = [
  {
    key: "restaurants",
    label: "Restaurants",
    matches: ["Restaurant", "Restaurants", "Food", "Dining"],
    icon: UtensilsCrossed,
    tint: "bg-warning-soft text-warning",
    description: "Order pickup, skip the wait",
    supportsPickup: true,
  },
  {
    key: "cafes",
    label: "Cafes",
    matches: ["Cafe", "Cafes", "Café", "Coffee", "Bakery"],
    icon: Coffee,
    tint: "bg-warning-soft text-warning",
    description: "Coffee, brunch & bakery pickup",
    supportsPickup: true,
  },
  {
    key: "healthcare",
    label: "Clinics & Healthcare",
    matches: ["Clinic", "Hospital", "Healthcare", "Dental", "Medical"],
    icon: Stethoscope,
    tint: "bg-danger-soft text-danger",
    description: "Doctors, dentists & diagnostics",
    supportsPickup: false,
  },
  {
    key: "salons",
    label: "Salons & Grooming",
    matches: ["Salon", "Barber", "Spa", "Grooming", "Beauty"],
    icon: Scissors,
    tint: "bg-danger-soft text-danger",
    description: "Haircuts, beauty & spa",
    supportsPickup: false,
  },
  {
    key: "government",
    label: "Government Services",
    matches: ["Government", "Public", "Passport", "Municipal", "Transport", "RTO", "Public Healthcare"],
    icon: Landmark,
    tint: "bg-info-soft text-info",
    description: "Passport, RTO, municipal desks",
    supportsPickup: false,
  },
  {
    key: "other",
    label: "Other Services",
    matches: [], // catch-all
    icon: Building2,
    tint: "bg-muted text-muted-foreground",
    description: "Hotels, banks & more",
    supportsPickup: false,
  },
];

export const getCategoryForBusiness = (cat: string | null | undefined): CategoryDef => {
  if (!cat) return CATEGORIES[CATEGORIES.length - 1];
  const lower = cat.toLowerCase();
  for (const c of CATEGORIES) {
    if (c.matches.some(m => lower.includes(m.toLowerCase()))) return c;
  }
  return CATEGORIES[CATEGORIES.length - 1];
};

export const getCategoryByKey = (key: string | undefined): CategoryDef | undefined =>
  CATEGORIES.find(c => c.key === key);

export const supportsPickup = (cat: string | null | undefined): boolean =>
  getCategoryForBusiness(cat).supportsPickup;