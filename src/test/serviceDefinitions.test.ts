import { describe, it, expect } from "vitest";
import {
  getServicesForQueue,
  DEFAULT_SERVICE_PRESETS,
  ServiceDefinition,
} from "@/lib/serviceDefinitions";

describe("Multi-Service Definitions Module", () => {
  it("extracts active configured services correctly", () => {
    const rawSettings = {
      services: [
        { id: "s-1", name: "Haircut", estimatedDurationMinutes: 20, isActive: true },
        { id: "s-2", name: "Massage", estimatedDurationMinutes: 40, isActive: false },
      ],
    };
    const services = getServicesForQueue(rawSettings);
    expect(services.length).toBe(1);
    expect(services[0].name).toBe("Haircut");
  });

  it("returns empty list if no services configured without breaking existing queues", () => {
    expect(getServicesForQueue(null)).toEqual([]);
    expect(getServicesForQueue({})).toEqual([]);
  });

  it("provides rich preset services for clinics, salons, and retail", () => {
    expect(DEFAULT_SERVICE_PRESETS.clinic.length).toBeGreaterThanOrEqual(3);
    expect(DEFAULT_SERVICE_PRESETS.salon.length).toBeGreaterThanOrEqual(3);
  });
});
