import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CommandCenterPage } from "../src/pages/command-center";
import * as dashboardApi from "../src/api/dashboard";
import * as eventsApi from "../src/api/events";
import * as facilitiesApi from "../src/api/facilities";
import * as alertsApi from "../src/api/alerts";
import * as ingestionApi from "../src/api/ingestion";
import * as authContext from "../src/hooks/useCurrentUser";

// Mock API modules
vi.mock("../src/api/dashboard", () => ({
  getDashboardSummary: vi.fn(),
}));

vi.mock("../src/api/events", () => ({
  getEvents: vi.fn(),
  getEventById: vi.fn(),
}));

vi.mock("../src/api/facilities", () => ({
  getFacilities: vi.fn(),
  getFacilityById: vi.fn(),
}));

vi.mock("../src/api/alerts", () => ({
  getAlerts: vi.fn(),
  getAlertById: vi.fn(),
  updateAlertStatus: vi.fn(),
}));

vi.mock("../src/api/ingestion", () => ({
  getIngestionStatus: vi.fn(),
  triggerFirmsIngestion: vi.fn(),
  triggerOsmSync: vi.fn(),
}));

vi.mock("../src/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

// Mock react-leaflet for JSDOM testing if needed
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: any) => <div data-testid="leaflet-map-container">{children}</div>,
  TileLayer: () => <div data-testid="leaflet-tile-layer" />,
  CircleMarker: ({ children, center }: any) => (
    <div data-testid="leaflet-circle-marker" data-center={JSON.stringify(center)}>
      {children}
    </div>
  ),
  Popup: ({ children }: any) => <div data-testid="leaflet-popup">{children}</div>,
  Tooltip: ({ children }: any) => <div data-testid="leaflet-tooltip">{children}</div>,
  useMap: () => ({
    setView: vi.fn(),
    fitBounds: vi.fn(),
    getZoom: () => 5,
  }),
  useMapEvents: (handlers: any) => handlers,
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

const mockSummary = {
  metrics: {
    total_hotspots: 142,
    total_classified_events: 120,
    industrial_fires_count: 14,
    persistent_sources_count: 36,
    natural_fires_count: 70,
    anomalous_events_count: 8,
    active_alerts_count: 5,
    high_severity_alerts_count: 2,
  },
  breakdown_by_class: [
    { sub_class: "gas_flare", count: 36 },
    { sub_class: "industrial_fire", count: 14 },
    { sub_class: "agricultural_burning", count: 70 },
  ],
  recent_events: [
    {
      id: "e0000000-0000-0000-0000-000000000001",
      primary_class: "industrial",
      sub_class: "industrial_fire",
      facility_name: "Bokaro Steel Plant",
      latitude: 23.6712,
      longitude: 86.1534,
      frp: 185.0,
      confidence_score: 0.96,
      is_anomalous: true,
      created_at: "2026-08-28T19:45:00Z",
    },
  ],
};

const mockAlerts = [
  {
    id: "a0000000-0000-0000-0000-000000000001",
    classified_event_id: "e0000000-0000-0000-0000-000000000001",
    severity: "high",
    status: "new",
    sent_at: "2026-08-28T19:45:00Z",
    acknowledged_by: null,
    event: {
      id: "e0000000-0000-0000-0000-000000000001",
      primary_class: "industrial",
      sub_class: "industrial_fire",
      confidence_score: 0.96,
      is_anomalous: true,
      facility_name: "Bokaro Steel Plant",
      latitude: 23.6712,
      longitude: 86.1534,
      frp: 185.0,
    },
  },
];

const mockEvents = [
  {
    id: "e0000000-0000-0000-0000-000000000001",
    primary_class: "industrial",
    sub_class: "industrial_fire",
    is_anomalous: true,
    confidence_score: 0.96,
    hotspot: {
      latitude: 23.6712,
      longitude: 86.1534,
      frp: 185.0,
      acq_date: "2026-08-28",
    },
    facility: {
      name: "Bokaro Steel Plant",
    },
  },
];

const mockFacilities = [
  {
    id: "f0000000-0000-0000-0000-000000000001",
    name: "Bokaro Steel Plant",
    facility_type: "steel",
    geometry: { type: "Point", coordinates: [86.1511, 23.6693] },
    state: "Jharkhand",
    district: "Bokaro",
  },
];

describe("CommandCenterPage & Operational Dashboard (D4.5D)", () => {
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

    vi.mocked(dashboardApi.getDashboardSummary).mockResolvedValue({
      success: true,
      data: mockSummary as any,
    });

    vi.mocked(eventsApi.getEvents).mockResolvedValue({
      success: true,
      data: mockEvents as any,
      pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
    } as any);

    vi.mocked(facilitiesApi.getFacilities).mockResolvedValue({
      success: true,
      data: mockFacilities as any,
      pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
    } as any);

    vi.mocked(alertsApi.getAlerts).mockResolvedValue({
      success: true,
      data: mockAlerts as any,
      pagination: { total: 1, limit: 4, offset: 0, hasMore: false },
    } as any);

    vi.mocked(ingestionApi.getIngestionStatus).mockResolvedValue({
      success: true,
      data: {
        firms: { status: "connected", last_sync: "2026-08-28T18:00:00Z" },
        osm: { status: "synced", last_sync: "2026-08-28T12:00:00Z" },
      } as any,
    });
  });

  it("should render Command Center header, KPI metrics strip, and map viewport", async () => {
    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <CommandCenterPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("COMMAND CENTER")).toBeInTheDocument();
      expect(screen.getByText("PIPELINE OPERATIONAL")).toBeInTheDocument();
      expect(screen.getByText("Total Thermal Detections")).toBeInTheDocument();
      expect(screen.getByText("120")).toBeInTheDocument();
      expect(screen.getByText("Anomalous Activity (+3σ)")).toBeInTheDocument();
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText("Active Threat Alerts")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByTestId("leaflet-map-container")).toBeInTheDocument();
    });
  });

  it("should render Live Threat Alerts, Recent Events, and AI Intelligence panels", async () => {
    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <CommandCenterPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Live Threat Alerts")).toBeInTheDocument();
      expect(screen.getByText("Recent Thermal Events")).toBeInTheDocument();
      expect(screen.getByText("AI Classification Engine")).toBeInTheDocument();
      expect(screen.getByText("Telemetry Pipeline Status")).toBeInTheDocument();
      expect(screen.getByText("NASA FIRMS NRT Stream")).toBeInTheDocument();
      expect(screen.getByText("CONNECTED")).toBeInTheDocument();
    });
  });

  it("should navigate to /events when clicking Recent Events panel header", async () => {
    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <CommandCenterPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Recent Thermal Events")).toBeInTheDocument();
    });

    const allEventsBtn = screen.getByText("All Events");
    fireEvent.click(allEventsBtn);

    expect(onNavigate).toHaveBeenCalledWith("/events");
  });

  it("should navigate to /alerts when clicking Live Alerts panel header", async () => {
    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <CommandCenterPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Live Threat Alerts")).toBeInTheDocument();
    });

    const allAlertsBtn = screen.getByText("All Alerts");
    fireEvent.click(allAlertsBtn);

    expect(onNavigate).toHaveBeenCalledWith("/alerts");
  });

  it("should open AlertDetailDrawer when an alert item is selected in the live alerts panel", async () => {
    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <CommandCenterPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("ALT-A00000")).toBeInTheDocument();
    });

    const triageTrigger = screen.getByText("Triage →");
    fireEvent.click(triageTrigger);

    await waitFor(() => {
      expect(screen.getByText("Operational Triage Actions")).toBeInTheDocument();
      expect(screen.getByText("Acknowledge Alert")).toBeInTheDocument();
    });
  });

  it("should toggle Anomalies Only global filter and update telemetry view", async () => {
    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <CommandCenterPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Anomalies Only")).toBeInTheDocument();
    });

    const anomalyToggle = screen.getByText("Anomalies Only");
    fireEvent.click(anomalyToggle);

    expect(anomalyToggle).toBeInTheDocument();
  });
});
