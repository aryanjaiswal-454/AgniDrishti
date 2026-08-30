import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThermalEventsPage, ThermalEventDetailPage } from "../src/pages/events";
import * as eventsApi from "../src/api/events";
import * as authContext from "../src/hooks/useCurrentUser";
import { EventDetail } from "../src/api/events";

vi.mock("../src/api/events", () => ({
  getEvents: vi.fn(),
  getEventById: vi.fn(),
  submitEventFeedback: vi.fn(),
}));

vi.mock("../src/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { Wrapper, queryClient };
}

const mockEventsList: EventDetail[] = [
  {
    id: "e0000000-0000-0000-0000-000000000001",
    hotspot_id: "h0000000-0000-0000-0000-000000000001",
    facility_id: "f0000000-0000-0000-0000-000000000001",
    primary_class: "industrial",
    sub_class: "gas_flare",
    land_cover_type: "built_up",
    distance_to_facility_m: 85,
    recurrence_count_90d: 48,
    z_score_frp: 0.19,
    confidence_score: 0.94,
    model_version: "v1.0.0-rules-ml-hybrid",
    is_anomalous: false,
    created_at: "2026-08-28T18:30:00Z",
    hotspot: {
      id: "h0000000-0000-0000-0000-000000000001",
      latitude: 22.3562,
      longitude: 69.8525,
      acq_date: "2026-08-28",
      acq_time: "1830",
      satellite: "N",
      instrument: "VIIRS",
      confidence: "nominal",
      frp: 88.2,
      bright_ti4: 338.5,
      daynight: "N",
      ingested_at: "2026-08-28T18:30:00Z",
    },
    facility: {
      id: "f0000000-0000-0000-0000-000000000001",
      osm_id: "101",
      name: "Jamnagar Refinery Complex",
      facility_type: "refinery",
      geometry: { type: "Point", coordinates: [69.8519, 22.3556] },
      state: "Gujarat",
      district: "Jamnagar",
      source: "osm",
      last_synced_at: null,
    },
    feedback_history: [],
  },
  {
    id: "e0000000-0000-0000-0000-000000000002",
    hotspot_id: "h0000000-0000-0000-0000-000000000002",
    facility_id: "f0000000-0000-0000-0000-000000000002",
    primary_class: "industrial",
    sub_class: "industrial_fire",
    land_cover_type: "built_up",
    distance_to_facility_m: 140,
    recurrence_count_90d: 2,
    z_score_frp: 3.82,
    confidence_score: 0.96,
    model_version: "v1.0.0-rules-ml-hybrid",
    is_anomalous: true,
    created_at: "2026-08-28T19:45:00Z",
    hotspot: {
      id: "h0000000-0000-0000-0000-000000000002",
      latitude: 23.6712,
      longitude: 86.1534,
      acq_date: "2026-08-28",
      acq_time: "1945",
      satellite: "N",
      instrument: "VIIRS",
      confidence: "high",
      frp: 185.0,
      bright_ti4: 367.2,
      daynight: "N",
      ingested_at: "2026-08-28T19:45:00Z",
    },
    facility: {
      id: "f0000000-0000-0000-0000-000000000002",
      osm_id: "102",
      name: "Bokaro Steel Plant",
      facility_type: "steel",
      geometry: { type: "Point", coordinates: [86.1511, 23.6693] },
      state: "Jharkhand",
      district: "Bokaro",
      source: "osm",
      last_synced_at: null,
    },
    feedback_history: [
      {
        id: "fb1",
        classified_event_id: "e0000000-0000-0000-0000-000000000002",
        user_id: "u1",
        corrected_label: "industrial_fire",
        notes: "Confirmed thermal spike.",
        created_at: "2026-08-28T20:00:00Z",
      },
    ],
  },
];

describe("ThermalEventsPage & ThermalEventDetailPage (D4.5B)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authContext.useCurrentUser).mockReturnValue({
      user: {
        id: "u1",
        email: "analyst@aagnazar.in",
        name: "Duty Analyst",
        role: "analyst",
        created_at: "2026-08-28T00:00:00Z",
      },
      isAuthenticated: true,
      role: "analyst",
    });
  });

  it("should render thermal events list with classification badges and metrics", async () => {
    vi.mocked(eventsApi.getEvents).mockResolvedValue({
      success: true,
      data: mockEventsList,
      pagination: { total: 2, limit: 20, offset: 0, hasMore: false },
    } as any);

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <ThermalEventsPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("THERMAL EVENT INTELLIGENCE")).toBeInTheDocument();
      expect(screen.getAllByText(/EVT-E0000000/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText("Gas Flare Stack").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Industrial Fire").length).toBeGreaterThan(0);
      expect(screen.getAllByText("ANOMALOUS SIGNAL").length).toBeGreaterThan(0);
      expect(screen.getAllByText("NOMINAL / NON-ANOMALOUS").length).toBeGreaterThan(0);
    });
  });

  it("should navigate to /events/:id when an event row is clicked", async () => {
    vi.mocked(eventsApi.getEvents).mockResolvedValue({
      success: true,
      data: mockEventsList,
      pagination: { total: 2, limit: 20, offset: 0, hasMore: false },
    } as any);

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <ThermalEventsPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/EVT-E0000000/i).length).toBeGreaterThan(0);
    });

    const eventRow = screen.getAllByText(/EVT-E0000000/i)[0];
    fireEvent.click(eventRow);

    expect(onNavigate).toHaveBeenCalledWith("/events/e0000000-0000-0000-0000-000000000001");
  });

  it("should render empty state when no events match filters", async () => {
    vi.mocked(eventsApi.getEvents).mockResolvedValue({
      success: true,
      data: [],
      pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
    } as any);

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <ThermalEventsPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("NO THERMAL EVENTS MATCH THE CURRENT FILTERS")).toBeInTheDocument();
    });
  });

  it("ThermalEventDetailPage should render full investigation view with linked facility", async () => {
    vi.mocked(eventsApi.getEventById).mockResolvedValue({
      success: true,
      data: mockEventsList[1],
    });

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <ThermalEventDetailPage eventId={mockEventsList[1].id} onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/EVT-E0000000/i).length).toBeGreaterThan(0);
      expect(screen.getByText("185 MW")).toBeInTheDocument();
      expect(screen.getAllByText(/96%/i).length).toBeGreaterThan(0);
      expect(screen.getByText("+3.82σ")).toBeInTheDocument();
      expect(screen.getByText("Bokaro Steel Plant")).toBeInTheDocument();
      expect(screen.getByText("View Facility Intelligence")).toBeInTheDocument();
    });

    // Test facility link navigation
    const facilityBtn = screen.getByText("View Facility Intelligence");
    fireEvent.click(facilityBtn);

    expect(onNavigate).toHaveBeenCalledWith("/facilities/f0000000-0000-0000-0000-000000000002");
  });

  it("ThermalEventDetailPage should allow Analyst to submit ground-truth feedback", async () => {
    vi.mocked(eventsApi.getEventById).mockResolvedValue({
      success: true,
      data: mockEventsList[0],
    });
    vi.mocked(eventsApi.submitEventFeedback).mockResolvedValue({
      success: true,
      data: {
        id: "fb-new",
        classified_event_id: mockEventsList[0].id,
        user_id: "u1",
        corrected_label: "gas_flare",
        notes: "Routine flare verify",
        created_at: new Date().toISOString(),
      },
    });

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <ThermalEventDetailPage eventId={mockEventsList[0].id} onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Submit Verification & Retrain")).toBeInTheDocument();
    });

    const submitBtn = screen.getByText("Submit Verification & Retrain");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(eventsApi.submitEventFeedback).toHaveBeenCalledWith(
        mockEventsList[0].id,
        expect.objectContaining({
          corrected_label: "gas_flare",
        })
      );
      expect(screen.getByText(/Ground-truth correction recorded successfully/i)).toBeInTheDocument();
    });
  });

  it("ThermalEventDetailPage should show read-only banner to Viewer role", async () => {
    vi.mocked(authContext.useCurrentUser).mockReturnValue({
      user: {
        id: "u3",
        email: "viewer@aagnazar.in",
        name: "Observer",
        role: "viewer",
        created_at: "2026-08-28T00:00:00Z",
      },
      isAuthenticated: true,
      role: "viewer",
    });

    vi.mocked(eventsApi.getEventById).mockResolvedValue({
      success: true,
      data: mockEventsList[0],
    });

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <ThermalEventDetailPage eventId={mockEventsList[0].id} onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Analyst feedback and model ground-truth corrections are restricted to Analyst and Admin roles/i)
      ).toBeInTheDocument();
      expect(screen.queryByText("Submit Verification & Retrain")).not.toBeInTheDocument();
    });
  });
});
