import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import BusinessHighlightsCard from "@/components/queue/BusinessHighlightsCard";
import LiveActivityFeed from "@/components/queue/LiveActivityFeed";
import QueueTimeline from "@/components/queue/QueueTimeline";
import ContextualTips from "@/components/queue/ContextualTips";
import EmptyState from "@/components/EmptyState";
import { Inbox } from "lucide-react";

/** CLS proxy for jsdom: the outer shell classes must not change between states. */
const shell = (container: HTMLElement) => container.firstElementChild?.className ?? "";
const skeletons = (container: HTMLElement) =>
  container.querySelectorAll<HTMLElement>('[class*="animate-pulse"]').length;

describe("skeleton loading states (slow network)", () => {
  it("QueueTimeline shows skeletons while loading and never flashes zeros", () => {
    const { container } = render(<QueueTimeline tokens={[]} loading />);
    expect(skeletons(container)).toBeGreaterThan(0);
    expect(screen.getByLabelText("Queue timeline")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/No queue activity yet/);
    expect(container.textContent).not.toMatch(/#\d/);
  });

  it("LiveActivityFeed shows skeletons while loading, not the empty message", () => {
    const { container } = render(<LiveActivityFeed events={[]} loading />);
    expect(skeletons(container)).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(/No recent activity/);
  });

  it("BusinessHighlightsCard shows skeletons while loading, not zeroed metrics", () => {
    const { container } = render(<BusinessHighlightsCard loading />);
    expect(skeletons(container)).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(/\b0\b/);
  });
});

describe("empty states after backend confirms no data", () => {
  it("QueueTimeline explains the empty queue once loaded", () => {
    render(<QueueTimeline tokens={[]} loading={false} />);
    expect(screen.getByText(/No queue activity yet/i)).toBeInTheDocument();
  });

  it("LiveActivityFeed explains the empty feed once loaded", () => {
    render(<LiveActivityFeed events={[]} loading={false} />);
    expect(screen.getByText(/No recent activity/i)).toBeInTheDocument();
  });

  it("BusinessHighlightsCard explains missing insights instead of showing zeros", () => {
    const { container } = render(
      <BusinessHighlightsCard rating={0} totalReviews={0} pulse={null} loading={false} />,
    );
    expect(screen.getByText(/Insights will become available/i)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/0\.0/);
  });

  it("ContextualTips renders nothing rather than inventing a tip", () => {
    const { container } = render(<ContextualTips pulse={null} ahead={null} waitMinutes={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("EmptyState renders title, description, tip and CTA", () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No customers yet"
        description="Your first customer will unlock live insights."
        tip="Share your queue link to get started."
        cta={{ label: "Share link", onClick: () => {} }}
      />,
    );
    expect(screen.getByText("No customers yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share link" })).toBeInTheDocument();
    expect(screen.getByText(/Share your queue link/i)).toBeInTheDocument();
  });
});

describe("layout stability (CLS) across loading -> empty -> data", () => {
  it("QueueTimeline keeps an identical shell in all three states", () => {
    const loading = render(<QueueTimeline tokens={[]} loading />);
    const loadingShell = shell(loading.container);
    loading.unmount();

    const empty = render(<QueueTimeline tokens={[]} loading={false} />);
    const emptyShell = shell(empty.container);
    empty.unmount();

    const data = render(
      <QueueTimeline
        loading={false}
        tokens={[
          { token: 1, status: "served" },
          { token: 2, status: "called" },
          { token: 3, status: "waiting" },
        ]}
        myToken={3}
        nowServing={2}
      />,
    );
    expect(loadingShell).toBe(emptyShell);
    expect(emptyShell).toBe(shell(data.container));
  });

  it("LiveActivityFeed keeps an identical shell in all three states", () => {
    const loading = render(<LiveActivityFeed events={[]} loading />);
    const loadingShell = shell(loading.container);
    loading.unmount();

    const empty = render(<LiveActivityFeed events={[]} loading={false} />);
    const emptyShell = shell(empty.container);
    empty.unmount();

    const data = render(
      <LiveActivityFeed
        loading={false}
        events={[
          { id: "a", action: "called", token_number: 4, actor: null, created_at: new Date().toISOString() },
        ]}
      />,
    );
    expect(loadingShell).toBe(emptyShell);
    expect(emptyShell).toBe(shell(data.container));
  });

  it("BusinessHighlightsCard keeps the same card footprint in all three states", () => {
    const base = "rounded-2xl border border-border bg-card p-3";
    const loading = render(<BusinessHighlightsCard loading />);
    expect(shell(loading.container)).toContain(base);
    loading.unmount();

    const empty = render(<BusinessHighlightsCard loading={false} />);
    expect(shell(empty.container)).toContain(base);
    empty.unmount();

    const data = render(
      <BusinessHighlightsCard
        loading={false}
        rating={4.6}
        totalReviews={128}
        pulse={{
          waiting: 3,
          joined_today: 20,
          served_today: 17,
          avg_wait_minutes: 8,
          avg_service_minutes: 4,
          reliability_pct: 96,
        }}
      />,
    );
    expect(shell(data.container)).toContain(base);
    expect(screen.getByText("4.6")).toBeInTheDocument();
  });
});
