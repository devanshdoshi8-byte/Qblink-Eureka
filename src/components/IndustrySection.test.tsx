import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IndustrySection from "./IndustrySection";

// framer-motion's AnimatePresence works fine in jsdom; no mock required.

const getTabs = () => screen.getAllByRole("tab");

describe("IndustrySection tab strip accessibility", () => {
  beforeEach(() => {
    render(<IndustrySection />);
  });

  it("exposes a labelled tablist with all tabs", () => {
    const tablist = screen.getByRole("tablist", { name: /industries/i });
    expect(tablist).toBeInTheDocument();
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs.length).toBeGreaterThan(1);
  });

  it("marks exactly one tab as selected and only that tab is tab-focusable", () => {
    const tabs = getTabs();
    const selected = tabs.filter((t) => t.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveAttribute("tabindex", "0");
    tabs.filter((t) => t !== selected[0]).forEach((t) => {
      expect(t).toHaveAttribute("tabindex", "-1");
    });
  });

  it("links each tab to a tabpanel via aria-controls / aria-labelledby", () => {
    const tabs = getTabs();
    const selected = tabs.find((t) => t.getAttribute("aria-selected") === "true")!;
    const panelId = selected.getAttribute("aria-controls")!;
    const panel = document.getElementById(panelId)!;
    expect(panel).toHaveAttribute("role", "tabpanel");
    expect(panel).toHaveAttribute("aria-labelledby", selected.id);
  });

  it("activates a tab on click and updates the visible panel", async () => {
    const user = userEvent.setup();
    const tabs = getTabs();
    await user.click(tabs[2]);
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
    await waitFor(() => {
      const panel = document.getElementById(tabs[2].getAttribute("aria-controls")!);
      expect(panel).not.toBeNull();
      expect(panel).toHaveAttribute("aria-labelledby", tabs[2].id);
    });
  });

  it("supports ArrowRight / ArrowLeft keyboard navigation with wrap", async () => {
    const user = userEvent.setup();
    const tabs = getTabs();
    tabs[0].focus();
    expect(tabs[0]).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(getTabs()[1]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowLeft}");
    expect(getTabs()[0]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowLeft}");
    expect(getTabs()[tabs.length - 1]).toHaveAttribute("aria-selected", "true");
  });

  it("supports ArrowUp / ArrowDown navigation", async () => {
    const user = userEvent.setup();
    const tabs = getTabs();
    tabs[0].focus();
    await user.keyboard("{ArrowDown}");
    expect(getTabs()[1]).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowUp}");
    expect(getTabs()[0]).toHaveAttribute("aria-selected", "true");
  });

  it("Home jumps to the first tab and End jumps to the last", async () => {
    const user = userEvent.setup();
    const tabs = getTabs();
    tabs[0].focus();
    await user.keyboard("{End}");
    expect(getTabs()[tabs.length - 1]).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Home}");
    expect(getTabs()[0]).toHaveAttribute("aria-selected", "true");
  });

  it("hides decorative icons from assistive tech", () => {
    const tabs = getTabs();
    tabs.forEach((tab) => {
      const icon = tab.querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });
});