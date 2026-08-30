import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { LandingPage } from "../src/pages/landing/LandingPage";
import { AuthProvider } from "../src/context/AuthContext";
import * as authApi from "../src/api/auth";

vi.mock("../src/api/auth", () => ({
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
  getCurrentUser: vi.fn().mockResolvedValue(null),
}));

// Mock Lenis for tests
vi.mock("lenis", () => {
  return {
    default: class MockLenis {
      raf() {}
      scrollTo() {}
      destroy() {}
    },
  };
});

describe("LandingPage Public Experience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render HeroSection with AgniDrishti branding and CTAs", async () => {
    const onNavigate = vi.fn();
    render(
      <AuthProvider>
        <LandingPage onNavigate={onNavigate} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/AGNI/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/DRISHTI/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/AI-Powered Thermal Intelligence/i).length).toBeGreaterThan(0);
      expect(screen.getByRole("button", { name: /EXPLORE INTELLIGENCE/i })).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /ENTER COMMAND CENTER/i }).length).toBeGreaterThan(0);
    });
  });

  it("should navigate to /login when ENTER COMMAND CENTER is clicked by unauthenticated visitor", async () => {
    const onNavigate = vi.fn();
    render(
      <AuthProvider>
        <LandingPage onNavigate={onNavigate} />
      </AuthProvider>
    );

    const enterBtn = screen.getAllByRole("button", { name: /ENTER COMMAND CENTER/i })[0];
    fireEvent.click(enterBtn);

    expect(onNavigate).toHaveBeenCalledWith("/login");
  });

  it("should render all core narrative storytelling sections", async () => {
    const onNavigate = vi.fn();
    render(
      <AuthProvider>
        <LandingPage onNavigate={onNavigate} />
      </AuthProvider>
    );

    // Section 1: Signal
    expect(screen.getByText((content) => content.includes("THE AMBIGUITY PROBLEM"))).toBeInTheDocument();
    expect(screen.getByText(/NRT HOTSPOT DETECTION/i)).toBeInTheDocument();

    // Section 2: Context
    expect(screen.getByText((content) => content.includes("MULTI-MODAL DATA FUSION"))).toBeInTheDocument();

    // Section 3: Architecture & Pipeline
    expect(screen.getByText((content) => content.includes("ARCHITECTURE & PIPELINE"))).toBeInTheDocument();
    expect(screen.getAllByText(/1. NASA FIRMS Ingestion/i).length).toBeGreaterThan(0);

    // Section 4: Live Simulation Map
    expect(screen.getByText(/SIMULATION — LIVE PIPELINE PREVIEW/i)).toBeInTheDocument();

    // Section 5: Taxonomy
    expect(screen.getByText((content) => content.includes("OPERATIONAL TAXONOMY"))).toBeInTheDocument();

    // Section 6: AI Inference
    expect(screen.getByText((content) => content.includes("MACHINE LEARNING INFERENCE"))).toBeInTheDocument();

    // Section 7: GIS Layers
    expect(screen.getByText((content) => content.includes("MULTI-LAYER GIS INTELLIGENCE"))).toBeInTheDocument();

    // Final CTA
    expect(screen.getByText((content) => content.includes("OPERATIONAL READINESS"))).toBeInTheDocument();
  });

  it("should switch simulated events when hotspot beacon is clicked", async () => {
    const onNavigate = vi.fn();
    render(
      <AuthProvider>
        <LandingPage onNavigate={onNavigate} />
      </AuthProvider>
    );

    // Initial event is Jamnagar SIM-01
    expect(screen.getByText("Jamnagar Secondary Unit 4")).toBeInTheDocument();

    // Click SIM-02 (Bina Flare Stack Alpha)
    const binaBeacon = screen.getByText(/SIM-02/i);
    fireEvent.click(binaBeacon);

    await waitFor(() => {
      expect(screen.getByText("Bina Flare Stack Alpha")).toBeInTheDocument();
      expect(screen.getByText("Bharat Oman Refineries (BORL) (Madhya Pradesh)")).toBeInTheDocument();
    });
  });

  it("should toggle GIS layers and update active layers count", async () => {
    const onNavigate = vi.fn();
    render(
      <AuthProvider>
        <LandingPage onNavigate={onNavigate} />
      </AuthProvider>
    );

    expect(screen.getByText("4 / 4")).toBeInTheDocument();

    // Toggle off NASA FIRMS Hotspots layer
    const firmsLayer = screen.getByText("NASA FIRMS Hotspots");
    fireEvent.click(firmsLayer);

    await waitFor(() => {
      expect(screen.getByText("3 / 4")).toBeInTheDocument();
    });
  });
});
