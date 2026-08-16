/**
 * Multi-Service Counter Tagging & Definition Module
 *
 * Allows businesses (clinics, salons, diagnostic centers, retail counters)
 * to configure multi-service flows with distinct durations and routing tags.
 *
 * Seamlessly falls back to standard single-queue mode if no services configured.
 */

export interface ServiceDefinition {
  id: string;
  name: string;
  description?: string;
  estimatedDurationMinutes: number;
  eligibleCounters?: string[];
  priority: "standard" | "urgent" | "express";
  isActive: boolean;
}

export const DEFAULT_SERVICE_PRESETS: Record<string, ServiceDefinition[]> = {
  clinic: [
    { id: "srv-quick-consult", name: "Quick Inquiry / Follow-up", description: "Prescription refill, vitals check", estimatedDurationMinutes: 5, priority: "express", isActive: true },
    { id: "srv-full-consult", name: "Full Doctor Consultation", description: "Comprehensive diagnosis & examination", estimatedDurationMinutes: 15, priority: "standard", isActive: true },
    { id: "srv-diagnostic", name: "Lab & Diagnostics", description: "Blood collection, ECG, X-Ray", estimatedDurationMinutes: 10, priority: "standard", isActive: true },
  ],
  salon: [
    { id: "srv-haircut", name: "Standard Haircut & Style", description: "Wash, cut & blow-dry", estimatedDurationMinutes: 20, priority: "standard", isActive: true },
    { id: "srv-express-trim", name: "Quick Beard / Fringe Trim", description: "Fast touch-up", estimatedDurationMinutes: 10, priority: "express", isActive: true },
    { id: "srv-treatment", name: "Color & Spa Treatment", description: "Deep conditioning or hair coloring", estimatedDurationMinutes: 45, priority: "standard", isActive: true },
  ],
  retail: [
    { id: "srv-inquiry", name: "Customer Returns / Quick Inquiry", description: "Exchange or support question", estimatedDurationMinutes: 4, priority: "express", isActive: true },
    { id: "srv-purchase", name: "Checkout & Purchase", description: "Basket checkout", estimatedDurationMinutes: 6, priority: "standard", isActive: true },
  ],
};

export function getServicesForQueue(settings?: any): ServiceDefinition[] {
  if (settings && Array.isArray(settings.services) && settings.services.length > 0) {
    return settings.services.filter((s: any) => s.isActive !== false);
  }
  return [];
}
