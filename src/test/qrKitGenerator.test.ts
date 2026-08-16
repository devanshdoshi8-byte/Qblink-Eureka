import { describe, it, expect } from "vitest";
import { getPublicQueueUrl, getTemplateCopy } from "@/lib/qrKitGenerator";

describe("One-Click Print-Ready QR Kit", () => {
  it("generates correct public queue URL for real queue IDs", () => {
    const url = getPublicQueueUrl("q-12345");
    expect(url).toContain("/join/q-12345");
  });

  it("provides tailored typography and copy for each template layout", () => {
    const poster = getTemplateCopy("a4_poster", "City Medical Center", "Doctor Queue");
    expect(poster.headline).toBe("Skip the Physical Line");
    expect(poster.badge).toBe("DIGITAL QUEUE ACCESS");

    const standee = getTemplateCopy("a5_standee", "City Medical Center", "Doctor Queue");
    expect(standee.headline).toBe("Take Your Digital Ticket");
    expect(standee.badge).toBe("OFFICIAL QUEUE ENTRY");

    const sticker = getTemplateCopy("square_sticker", "City Medical Center", "Doctor Queue");
    expect(sticker.headline).toBe("Live Queue");
  });
});
