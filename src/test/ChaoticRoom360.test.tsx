import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { ChaoticRoom360 } from "@/components/qb/ChaoticRoom360";

// Mock @react-three/fiber Canvas to prevent WebGL context initialization in jsdom
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-r3f-canvas">{children}</div>
  ),
  useFrame: () => {},
  useThree: () => ({
    camera: { position: [0, 0, 0], lookAt: vi.fn() },
    viewport: { width: 1920, height: 1080 },
  }),
}));

vi.mock("@react-three/drei", () => ({
  Billboard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("ChaoticRoom360 component", () => {
  it("renders 360 spatial reality simulator with interactive controls", () => {
    render(<ChaoticRoom360 />);

    // Chapter heading & titles
    expect(screen.getByText(/360° Spatial Reality Simulator/i)).toBeInTheDocument();
    expect(screen.getByText(/Step inside the room/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag 360° — Feel the Metamorphosis/i)).toBeInTheDocument();

    // Hotspot buttons (appear in 3D scene & quick jump toolbar)
    expect(screen.getAllByText(/The Main Counter/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/The Front Entrance/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Customer Handset/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Waiting Lounge & Seating/i).length).toBeGreaterThanOrEqual(1);

    // Metamorphosis slider labels
    expect(screen.getByText(/Physical Chaos \(0%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Qblink Flow \(100%\)/i)).toBeInTheDocument();
  });
});
