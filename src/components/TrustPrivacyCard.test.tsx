import { describe, it, expect, vi } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import TrustPrivacyCard from "./TrustPrivacyCard";

expect.extend(toHaveNoViolations);

// Analytics helper hits Supabase — stub it out.
vi.mock("@/lib/trustAnalytics", () => ({
  trackTrustModalOpen: vi.fn().mockResolvedValue(undefined),
  trackEarlyAccessSubmitted: vi.fn().mockResolvedValue(undefined),
}));

describe("TrustPrivacyCard accessibility", () => {
  afterEach(() => cleanup());

  it("card has no axe violations in closed state", async () => {
    const { container } = render(<TrustPrivacyCard />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("opens dialog with keyboard, traps focus, closes on Escape, and restores focus", async () => {
    const user = userEvent.setup();
    render(<TrustPrivacyCard />);

    const trigger = screen.getByRole("button", { name: /learn more/i });
    trigger.focus();
    expect(trigger).toHaveFocus();

    // Open via Enter (keyboard)
    await user.keyboard("{Enter}");

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    // Dialog must expose a name & description (aria-labelledby / aria-describedby)
    expect(dialog).toHaveAccessibleName(/how qblink protects you/i);
    expect(dialog).toHaveAccessibleDescription(/simple summary/i);

    // Focus must move inside the dialog (Radix focus trap)
    expect(dialog.contains(document.activeElement)).toBe(true);

    // Decorative icons inside the title must be hidden from screen readers
    const title = within(dialog).getByText(/how qblink protects you/i);
    const svgs = title.parentElement?.querySelectorAll("svg") ?? [];
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => {
      expect(svg.getAttribute("aria-hidden")).toBe("true");
    });

    // Every focus stop while tabbing stays inside the dialog
    for (let i = 0; i < 6; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }

    // Axe scan while open
    expect(await axe(document.body)).toHaveNoViolations();

    // Escape closes and returns focus to trigger
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("card region and trigger have accessible names", () => {
    render(<TrustPrivacyCard />);
    expect(
      screen.getByRole("region", { name: /trust and privacy/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /learn more/i })
    ).toBeInTheDocument();
  });

  it("modal copy and accessible name/description match snapshot", async () => {
    const user = userEvent.setup();
    render(<TrustPrivacyCard />);

    await user.click(screen.getByRole("button", { name: /learn more/i }));
    const dialog = await screen.findByRole("dialog");

    // Accessible name & description — these are what screen readers announce.
    const snapshot = {
      accessibleName: dialog.getAttribute("aria-labelledby")
        ? document.getElementById(dialog.getAttribute("aria-labelledby")!)
            ?.textContent?.trim()
        : null,
      accessibleDescription: dialog.getAttribute("aria-describedby")
        ? document.getElementById(dialog.getAttribute("aria-describedby")!)
            ?.textContent?.trim()
        : null,
      bullets: Array.from(dialog.querySelectorAll("li")).map((li) =>
        li.textContent?.replace(/\s+/g, " ").trim()
      ),
    };

    expect(snapshot).toMatchInlineSnapshot(`
      {
        "accessibleDescription": "A simple summary of how we handle your information while you use Qblink.",
        "accessibleName": "How Qblink Protects You",
        "bullets": [
          "• We only collect information required to provide queue services.",
          "• Businesses can only access queue information relevant to their own customers.",
          "• Your data is handled securely.",
          "• We do not sell your personal information.",
          "• Qblink is committed to protecting customer privacy.",
        ],
      }
    `);
  });
});