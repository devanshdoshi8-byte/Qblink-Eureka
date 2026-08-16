import { describe, it, expect } from "vitest";
import { MORPH_INDUSTRIES } from "../features/industryMorphing/data/industryMorphData";
import { MorphIndustryKey } from "../features/industryMorphing/types";

describe("Industry Morphing Feature (Feature 3)", () => {
  it("provides all 4 core industry configurations", () => {
    const keys = Object.keys(MORPH_INDUSTRIES) as MorphIndustryKey[];
    expect(keys).toEqual(["clinic", "dining", "salon", "government"]);
  });

  it("contains specific operational terminology for Clinics & Diagnostics", () => {
    const clinic = MORPH_INDUSTRIES.clinic;
    expect(clinic.customer.roleTitle).toBe("Patient");
    expect(clinic.customer.tokenNumber).toBe("P-104");
    expect(clinic.customer.destinationText).toContain("Consultation Room 3");
    expect(clinic.business.operatorRole).toBe("Front Desk Receptionist");
    expect(clinic.business.counterName).toBe("Triage & Check-in Desk");
  });

  it("contains specific operational terminology for Cafes & Dining", () => {
    const dining = MORPH_INDUSTRIES.dining;
    expect(dining.customer.roleTitle).toBe("Dining Guest");
    expect(dining.customer.tokenNumber).toBe("T-012");
    expect(dining.customer.destinationText).toContain("Table 14");
    expect(dining.business.operatorRole).toBe("Host & Floor Captain");
    expect(dining.business.nowServingToken).toBe("T-010");
  });

  it("contains specific operational terminology for Salons & Spas", () => {
    const salon = MORPH_INDUSTRIES.salon;
    expect(salon.customer.roleTitle).toBe("Salon Client");
    expect(salon.customer.tokenNumber).toBe("S-042");
    expect(salon.customer.queueLabel).toContain("Stylist Meera");
    expect(salon.business.operatorRole).toBe("Salon Floor Manager");
  });

  it("contains specific operational terminology for Government & Banking", () => {
    const gov = MORPH_INDUSTRIES.government;
    expect(gov.customer.roleTitle).toBe("Citizen Applicant");
    expect(gov.customer.tokenNumber).toBe("G-082");
    expect(gov.customer.destinationText).toContain("Permit Counter #4");
    expect(gov.business.operatorRole).toBe("Municipal Officer");
  });

  it("includes responsive hero images for all presets", () => {
    Object.values(MORPH_INDUSTRIES).forEach((industry) => {
      expect(industry.heroImage.webp480).toBeTruthy();
      expect(industry.heroImage.webp800).toBeTruthy();
      expect(industry.heroImage.webp1200).toBeTruthy();
      expect(industry.heroImage.jpg).toBeTruthy();
      expect(industry.frictionProblem).toBeTruthy();
      expect(industry.qblinkFix).toBeTruthy();
    });
  });
});
