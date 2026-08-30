import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IntelligencePipelineTrace } from "../src/components/map/panels/IntelligencePipelineTrace";
import { EventSpatialRelationLine } from "../src/components/map/layers/EventSpatialRelationLine";
import { MapInvestigationDrawer } from "../src/components/map/panels/MapInvestigationDrawer";
import { MapLegend } from "../src/components/map/controls/MapLegend";
import { MapLayerControls } from "../src/components/map/controls/MapLayerControls";
import { ThermalEventLayer } from "../src/components/map/layers/ThermalEventLayer";
import { ThermalMarkerData, FacilityMarkerData } from "../src/components/map/types";
import * as alertsApi from "../src/api/alerts";

// Mock Leaflet
vi.mock("leaflet", () => ({
  default: {
    divIcon: vi.fn().mockReturnValue({}),
  },
  divIcon: vi.fn().mockReturnValue({}),
}));

// Mock react-leaflet
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: any) => <div data-testid="gis-map-container">{children}</div>,
  CircleMarker: ({ children, center, radius, pathOptions, eventHandlers }: any) => (
    <button
      type="button"
      data-testid="gis-circle-marker"
      data-center={JSON.stringify(center)}
      data-radius={radius}
      data-options={JSON.stringify(pathOptions)}
      onClick={eventHandlers?.click}
    >
      {children}
    </button>
  ),
  Polyline: ({ positions, pathOptions }: any) => (
    <div
      data-testid="gis-polyline"
      data-positions={JSON.stringify(positions)}
      data-options={JSON.stringify(pathOptions)}
    />
  ),
  Marker: ({ position }: any) => (
    <div data-testid="gis-marker" data-position={JSON.stringify(position)} />
  ),
  Popup: ({ children }: any) => <div data-testid="gis-popup">{children}</div>,
  Tooltip: ({ children }: any) => <div data-testid="gis-tooltip">{children}</div>,
}));

vi.mock("../src/api/alerts", () => ({
  getAlerts: vi.fn().mockResolvedValue({
    success: true,
    data: [],
    pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
  }),
}));

vi.mock("../src/api/facilities", () => ({
  getFacilityById: vi.fn().mockResolvedValue({
    success: true,
    data: { id: "f1", name: "Bokaro Steel", facility_type: "steel" },
  }),
  getFacilityTimeseries: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
}));

const mockThermalMarker: ThermalMarkerData = {
  id: "e0000000-0000-0000-0000-000000000001",
  lat: 23.6712,
  lon: 86.1534,
  frp: 185.0,
  brightness: 367.2,
  primary_class: "industrial",
  sub_class: "industrial_fire",
  confidence_score: 0.96,
  is_anomalous: true,
  acquisition_date: "2026-08-28",
  facility_name: "Bokaro Steel Plant",
  facility_id: "f0000000-0000-0000-0000-000000000001",
  distance_to_facility_m: 140,
};

const mockFacilityMarker: FacilityMarkerData = {
  id: "f0000000-0000-0000-0000-000000000001",
  name: "Bokaro Steel Plant",
  facility_type: "steel",
  lat: 23.6693,
  lon: 86.1511,
  state: "Jharkhand",
  district: "Bokaro",
  source: "osm",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("D6.2 Command Center + GIS Interaction Polish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("IntelligencePipelineTrace", () => {
    it("should render 5 pipeline steps with accurate status indicators", () => {
      render(
        <IntelligencePipelineTrace
          marker={mockThermalMarker}
          linkedAlert={null}
        />
      );

      expect(screen.getByText("Intelligence Trace")).toBeInTheDocument();
      expect(screen.getByText("DETECTED")).toBeInTheDocument();
      expect(screen.getByText("CONTEXTUALIZED")).toBeInTheDocument();
      expect(screen.getByText("ANALYZED")).toBeInTheDocument();
      expect(screen.getByText("CLASSIFIED")).toBeInTheDocument();
      expect(screen.getByText("PRIORITIZED")).toBeInTheDocument();
    });

    it("should toggle step details when clicked", () => {
      render(
        <IntelligencePipelineTrace
          marker={mockThermalMarker}
          linkedAlert={null}
        />
      );

      // Initially details are hidden
      expect(screen.queryByText("NASA FIRMS NRT")).not.toBeInTheDocument();

      // Click DETECTED step to expand
      const detectedBtn = screen.getByRole("button", { name: /DETECTED/i });
      fireEvent.click(detectedBtn);

      expect(screen.getByText("NASA FIRMS NRT")).toBeInTheDocument();
      expect(screen.getByText("185 MW")).toBeInTheDocument();

      // Click again to collapse
      fireEvent.click(detectedBtn);
      expect(screen.queryByText("NASA FIRMS NRT")).not.toBeInTheDocument();
    });

    it("should show linked facility details when CONTEXTUALIZED step is expanded", () => {
      render(
        <IntelligencePipelineTrace
          marker={mockThermalMarker}
          linkedAlert={null}
        />
      );

      const contextBtn = screen.getByRole("button", { name: /CONTEXTUALIZED/i });
      fireEvent.click(contextBtn);

      expect(screen.getByText("Nearest facility:")).toBeInTheDocument();
      expect(screen.getByText("~140 m")).toBeInTheDocument();
    });
  });

  describe("EventSpatialRelationLine", () => {
    it("should render Polyline connecting event and facility coordinates", () => {
      render(
        <EventSpatialRelationLine
          eventMarker={mockThermalMarker}
          facilityMarkers={[mockFacilityMarker]}
        />
      );

      const polyline = screen.getByTestId("gis-polyline");
      expect(polyline).toBeInTheDocument();

      const positions = JSON.parse(polyline.getAttribute("data-positions") || "[]");
      expect(positions).toEqual([
        [mockThermalMarker.lat, mockThermalMarker.lon],
        [mockFacilityMarker.lat, mockFacilityMarker.lon],
      ]);

      const options = JSON.parse(polyline.getAttribute("data-options") || "{}");
      expect(options.dashArray).toBe("6 4");
      expect(options.color).toBe("#31C7D4");
    });

    it("should not render when linked facility is not found", () => {
      const unlinkedMarker = { ...mockThermalMarker, facility_id: "f-nonexistent" };
      render(
        <EventSpatialRelationLine
          eventMarker={unlinkedMarker}
          facilityMarkers={[mockFacilityMarker]}
        />
      );

      expect(screen.queryByTestId("gis-polyline")).not.toBeInTheDocument();
    });
  });

  describe("Restructured MapInvestigationDrawer", () => {
    it("should render all structured sections in correct visual hierarchy", () => {
      const onNavigate = vi.fn();
      const onClose = vi.fn();

      render(
        <MapInvestigationDrawer
          selection={{ type: "event", data: mockThermalMarker }}
          onClose={onClose}
          onNavigate={onNavigate}
        />,
        { wrapper: createWrapper() }
      );

      // Section headers
      expect(screen.getByText("Thermal Signal")).toBeInTheDocument();
      expect(screen.getByText("Classification")).toBeInTheDocument();
      expect(screen.getByText("Nearest Facility")).toBeInTheDocument();
      expect(screen.getByText("Historical Context")).toBeInTheDocument();
      expect(screen.getByText("Intelligence Trace")).toBeInTheDocument();

      // Actions
      expect(screen.getByText("View Event Investigation")).toBeInTheDocument();
      expect(screen.getByText("View Nearest Facility")).toBeInTheDocument();
    });

    it("should render Alert Linked section when event has a matched alert", async () => {
      vi.mocked(alertsApi.getAlerts).mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: "alt-001",
            classified_event_id: mockThermalMarker.id,
            severity: "high",
            status: "new",
            sent_at: "2026-08-28T19:46:00Z",
          } as any,
        ],
        pagination: { total: 1, limit: 20, offset: 0, hasMore: false },
      });

      const onNavigate = vi.fn();
      const onClose = vi.fn();

      render(
        <MapInvestigationDrawer
          selection={{ type: "event", data: mockThermalMarker }}
          onClose={onClose}
          onNavigate={onNavigate}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText("Alert Linked")).toBeInTheDocument();
        expect(screen.getByText("ALT-ALT-00")).toBeInTheDocument();
        expect(screen.getByText("View Alert Triage")).toBeInTheDocument();
      });
    });
  });

  describe("Dynamic MapLegend", () => {
    it("should hide facility legend entry when facility layer is turned off", () => {
      render(
        <MapLegend
          layerVisibility={{ thermal_events: true, facilities: false, anomalies: false }}
          hasSelection={false}
        />
      );

      expect(screen.getByText("Nominal Thermal Hotspot")).toBeInTheDocument();
      expect(screen.queryByText("Registered Infrastructure")).not.toBeInTheDocument();
      expect(screen.queryByText("Selected Entity (Active)")).not.toBeInTheDocument();
    });

    it("should show Selected Entity entry only when hasSelection is true", () => {
      render(
        <MapLegend
          layerVisibility={{ thermal_events: true, facilities: true, anomalies: false }}
          hasSelection={true}
        />
      );

      expect(screen.getByText("Registered Infrastructure")).toBeInTheDocument();
      expect(screen.getByText("Selected Entity (Active)")).toBeInTheDocument();
    });
  });

  describe("ThermalEventLayer Marker Emphasis", () => {
    it("should emphasize selected event with white border and dim unselected markers", () => {
      const markers = [
        mockThermalMarker,
        { ...mockThermalMarker, id: "e0000000-0000-0000-0000-000000000002", lat: 24.0 },
      ];

      render(
        <ThermalEventLayer
          markers={markers}
          onNavigate={vi.fn()}
          selectedEventId={mockThermalMarker.id}
          usePopups={false}
        />
      );

      const circleMarkers = screen.getAllByTestId("gis-circle-marker");
      expect(circleMarkers).toHaveLength(2);

      // First marker is selected: white border, fillOpacity = 1
      const selectedOptions = JSON.parse(circleMarkers[0].getAttribute("data-options") || "{}");
      expect(selectedOptions.color).toBe("#FFFFFF");
      expect(selectedOptions.fillOpacity).toBe(1);
      expect(selectedOptions.weight).toBe(3);

      // Second marker is unselected while selection is active: dimmed fillOpacity = 0.4
      const dimmedOptions = JSON.parse(circleMarkers[1].getAttribute("data-options") || "{}");
      expect(dimmedOptions.fillOpacity).toBe(0.4);
      expect(dimmedOptions.weight).toBe(1);
    });
  });

  describe("MapLayerControls Grouping", () => {
    it("should render grouped toolbar with layer toggles, clustering, basemap mode and selection controls", () => {
      const onToggleLayer = vi.fn();
      const onChangeBaseMapMode = vi.fn();
      const onToggleClustering = vi.fn();
      const onClearSelection = vi.fn();

      render(
        <MapLayerControls
          layerVisibility={{ thermal_events: true, facilities: true, anomalies: false }}
          onToggleLayer={onToggleLayer}
          baseMapMode="dark"
          onChangeBaseMapMode={onChangeBaseMapMode}
          eventCount={12}
          facilityCount={5}
          anomalousCount={2}
          clusteringEnabled={true}
          onToggleClustering={onToggleClustering}
          hasSelection={true}
          onClearSelection={onClearSelection}
        />
      );

      expect(screen.getByRole("toolbar")).toBeInTheDocument();
      expect(screen.getByText("● Thermal (12)")).toBeInTheDocument();
      expect(screen.getByText("◆ Facilities (5)")).toBeInTheDocument();
      expect(screen.getByText("▲ Anomalies (2)")).toBeInTheDocument();
      expect(screen.getByText("Clear Selection")).toBeInTheDocument();
    });
  });
});
