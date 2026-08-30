import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GisMapContainer } from "../src/components/map/GisMapContainer";
import { adaptThermalEventToMarker, adaptFacilityToMarker } from "../src/components/map/adapters";
import { clusterThermalEvents } from "../src/components/map/clustering";
import { BASEMAP_CONFIGS, DEFAULT_INDIA_VIEWPORT } from "../src/components/map/mapConfig";
import { ThermalEventPopup } from "../src/components/map/popups/ThermalEventPopup";
import { FacilityPopup } from "../src/components/map/popups/FacilityPopup";
import { MapInvestigationDrawer } from "../src/components/map/panels/MapInvestigationDrawer";
import { LiveMapPage } from "../src/pages/live-map/LiveMapPage";
import { EventDetail } from "../src/api/events";
import { Facility } from "../src/api/facilities";
import * as facilitiesApi from "../src/api/facilities";

// Mock API endpoints for LiveMapPage
vi.mock("../src/api/events", () => ({
  getEvents: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: "e0000000-0000-0000-0000-000000000001",
        hotspot_id: "h0000000-0000-0000-0000-000000000001",
        facility_id: "f0000000-0000-0000-0000-000000000001",
        primary_class: "industrial",
        sub_class: "industrial_fire",
        confidence_score: 0.96,
        is_anomalous: true,
        created_at: "2026-08-28T19:45:00Z",
        hotspot: {
          latitude: 23.6712,
          longitude: 86.1534,
          acq_date: "2026-08-28",
          frp: 185.0,
        },
      },
    ],
    pagination: { total: 1, limit: 100, offset: 0, hasMore: false },
  }),
  getEventById: vi.fn(),
  submitEventFeedback: vi.fn(),
}));

vi.mock("../src/api/facilities", () => ({
  getFacilities: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: "f0000000-0000-0000-0000-000000000001",
        osm_id: "101",
        name: "Bokaro Steel Plant",
        facility_type: "steel",
        geometry: { type: "Point", coordinates: [86.1511, 23.6693] },
        state: "Jharkhand",
        district: "Bokaro",
        source: "osm",
        last_synced_at: null,
      },
    ],
    pagination: { total: 1, limit: 100, offset: 0, hasMore: false },
  }),
  getFacilityById: vi.fn(),
  getFacilityTimeseries: vi.fn(),
}));

// Mock react-leaflet components for JSDOM
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: any) => <div data-testid="gis-map-container">{children}</div>,
  TileLayer: ({ url, attribution, subdomains }: any) => (
    <div
      data-testid="gis-tile-layer"
      data-url={url}
      data-attribution={attribution}
      data-subdomains={JSON.stringify(subdomains)}
    />
  ),
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
  useMap: () => ({
    setView: vi.fn(),
    fitBounds: vi.fn(),
    getZoom: () => 5,
  }),
  useMapEvents: (handlers: any) => {
    return handlers;
  },
}));

vi.mock("../src/api/alerts", () => ({
  getAlerts: vi.fn().mockResolvedValue({
    success: true,
    data: [],
    pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
  }),
}));

const mockEvent: EventDetail = {
  id: "e0000000-0000-0000-0000-000000000001",
  hotspot_id: "h0000000-0000-0000-0000-000000000001",
  facility_id: "f0000000-0000-0000-0000-000000000001",
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
    id: "h0000000-0000-0000-0000-000000000001",
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
    id: "f0000000-0000-0000-0000-000000000001",
    osm_id: "101",
    name: "Bokaro Steel Plant",
    facility_type: "steel",
    geometry: { type: "Point", coordinates: [86.1511, 23.6693] },
    state: "Jharkhand",
    district: "Bokaro",
    source: "osm",
    last_synced_at: null,
  },
};

const mockFacility: Facility = {
  id: "f0000000-0000-0000-0000-000000000001",
  osm_id: "101",
  name: "Bokaro Steel Plant",
  facility_type: "steel",
  geometry: { type: "Point", coordinates: [86.1511, 23.6693] },
  state: "Jharkhand",
  district: "Bokaro",
  source: "osm",
  last_synced_at: null,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("GIS Map Intelligence & Spatial Investigation (D5.2)", () => {
  it("should have reliable basemap tile configs without requiring private API keys and NOT use unauthenticated CARTO", () => {
    // Must NOT use unauthenticated CartoDB URLs that produce 'API KEY REQUIRED' watermarks
    expect(BASEMAP_CONFIGS.dark.url).not.toContain("cartocdn.com");
    expect(BASEMAP_CONFIGS.satellite.url).not.toContain("cartocdn.com");

    // Must use verified keyless public GIS endpoints
    expect(BASEMAP_CONFIGS.dark.url).toContain("arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base");
    expect(BASEMAP_CONFIGS.satellite.url).toContain("arcgisonline.com/ArcGIS/rest/services/World_Imagery");
    expect(BASEMAP_CONFIGS.osm_tactical.url).toContain("tile.openstreetmap.org");

    expect(DEFAULT_INDIA_VIEWPORT.center).toEqual([22.3511, 78.6677]);
    expect(DEFAULT_INDIA_VIEWPORT.zoom).toBe(5);
  });

  it("should adapt EventDetail DTO into normalized ThermalMarkerData", () => {
    const marker = adaptThermalEventToMarker(mockEvent);
    expect(marker).not.toBeNull();
    expect(marker?.id).toBe("e0000000-0000-0000-0000-000000000001");
    expect(marker?.lat).toBe(23.6712);
    expect(marker?.lon).toBe(86.1534);
    expect(marker?.frp).toBe(185.0);
    expect(marker?.is_anomalous).toBe(true);
  });

  it("should adapt Facility DTO into normalized FacilityMarkerData", () => {
    const marker = adaptFacilityToMarker(mockFacility);
    expect(marker).not.toBeNull();
    expect(marker?.id).toBe("f0000000-0000-0000-0000-000000000001");
    expect(marker?.lat).toBe(23.6693);
    expect(marker?.lon).toBe(86.1511);
    expect(marker?.facility_type).toBe("steel");
  });

  it("should cluster thermal events at low zoom levels and split when zoomed in", () => {
    const markers = [
      adaptThermalEventToMarker(mockEvent)!,
      {
        ...adaptThermalEventToMarker(mockEvent)!,
        id: "e0000000-0000-0000-0000-000000000002",
        lat: 23.675,
        lon: 86.158,
      },
    ];

    // Low zoom (e.g. 5) -> clusters aggregated
    const lowZoomResult = clusterThermalEvents(markers, 5, true);
    expect(lowZoomResult.clusters.length).toBe(1);
    expect(lowZoomResult.clusters[0].eventCount).toBe(2);

    // High zoom (e.g. 11) -> clusters split into individual events
    const highZoomResult = clusterThermalEvents(markers, 11, true);
    expect(highZoomResult.clusters.length).toBe(0);
    expect(highZoomResult.singleEvents.length).toBe(2);
  });

  it("should render GisMapContainer with tactical layer controls, clustering and legend", () => {
    const onNavigate = vi.fn();

    render(
      <GisMapContainer
        events={[mockEvent]}
        facilities={[mockFacility]}
        onNavigate={onNavigate}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId("gis-map-container")).toBeInTheDocument();
    expect(screen.getByText("Layers")).toBeInTheDocument();
    expect(screen.getByText("Tactical Legend")).toBeInTheDocument();
    expect(screen.getByText(/● Thermal/i)).toBeInTheDocument();
    expect(screen.getByText(/◆ Facilities/i)).toBeInTheDocument();
    expect(screen.getByText(/▲ Anomalies/i)).toBeInTheDocument();
    expect(screen.getByText(/Clustering/i)).toBeInTheDocument();
  });

  it("MapInvestigationDrawer should render thermal event details and trigger navigation", () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    const marker = adaptThermalEventToMarker(mockEvent)!;

    render(
      <MapInvestigationDrawer
        selection={{ type: "event", data: marker }}
        onClose={onClose}
        onNavigate={onNavigate}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("EVT-E0000000")).toBeInTheDocument();
    expect(screen.getByText("185 MW")).toBeInTheDocument();
    expect(screen.getByText("Bokaro Steel Plant")).toBeInTheDocument();

    const investigateBtn = screen.getByText("View Event Investigation");
    fireEvent.click(investigateBtn);

    expect(onNavigate).toHaveBeenCalledWith("/events/e0000000-0000-0000-0000-000000000001");
  });

  it("MapInvestigationDrawer should render facility intelligence, baseline profile and timeseries (D5.4)", async () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    const marker = adaptFacilityToMarker(mockFacility)!;

    const mockDetail = {
      ...mockFacility,
      baseline: {
        id: "b1",
        facility_id: mockFacility.id,
        avg_daily_detections: 4.5,
        avg_frp: 52.3,
        std_dev_frp: 15.1,
        window_start: "2026-06-01T00:00:00Z",
        window_end: "2026-08-28T00:00:00Z",
        updated_at: "2026-08-28T00:00:00Z",
      },
      total_events: 16,
      anomalous_events_count: 3,
    };

    const mockTimeseries = [
      {
        date: "2026-08-27",
        avg_frp: 48.0,
        max_frp: 110.0,
        detections_count: 3,
        anomalous_count: 0,
      },
      {
        date: "2026-08-28",
        avg_frp: 56.6,
        max_frp: 185.0,
        detections_count: 5,
        anomalous_count: 2,
      },
    ];

    vi.mocked(facilitiesApi.getFacilityById).mockResolvedValueOnce({
      success: true,
      data: mockDetail as any,
    });
    vi.mocked(facilitiesApi.getFacilityTimeseries).mockResolvedValueOnce({
      success: true,
      data: mockTimeseries as any,
    });

    render(
      <MapInvestigationDrawer
        selection={{ type: "facility", data: marker }}
        onClose={onClose}
        onNavigate={onNavigate}
      />,
      { wrapper: createWrapper() }
    );

    // Facility identity
    expect(screen.getByText("Bokaro Steel Plant")).toBeInTheDocument();
    expect(screen.getByText("Jharkhand • Bokaro")).toBeInTheDocument();
    expect(screen.getByText("1,000m R-Tree")).toBeInTheDocument();

    // Baseline statistics
    await waitFor(() => {
      expect(screen.getByText("90-Day Baseline Profile")).toBeInTheDocument();
      expect(screen.getByText("52.3 MW")).toBeInTheDocument();
      expect(screen.getByText("4.5 / day")).toBeInTheDocument();
      expect(screen.getByText("16")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    // Timeseries section
    expect(screen.getByText("FRP Radiometric History")).toBeInTheDocument();

    // Navigation trigger
    const facilityBtn = screen.getByText("View Facility Intelligence");
    fireEvent.click(facilityBtn);

    expect(onNavigate).toHaveBeenCalledWith("/facilities/f0000000-0000-0000-0000-000000000001");
  });

  it("MapInvestigationDrawer should show empty state when facility has no historical thermal activity (D5.4)", async () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    const marker = adaptFacilityToMarker(mockFacility)!;

    vi.mocked(facilitiesApi.getFacilityById).mockResolvedValueOnce({
      success: true,
      data: { ...mockFacility, baseline: null, total_events: 0, anomalous_events_count: 0 } as any,
    });
    vi.mocked(facilitiesApi.getFacilityTimeseries).mockResolvedValueOnce({
      success: true,
      data: [] as any,
    });

    render(
      <MapInvestigationDrawer
        selection={{ type: "facility", data: marker }}
        onClose={onClose}
        onNavigate={onNavigate}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText("NO HISTORICAL THERMAL ACTIVITY AVAILABLE")).toBeInTheDocument();
    });
  });

  it("MapInvestigationDrawer should display error state with retry when timeseries query fails (D5.4)", async () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    const marker = adaptFacilityToMarker(mockFacility)!;

    vi.mocked(facilitiesApi.getFacilityById).mockResolvedValueOnce({
      success: true,
      data: mockFacility as any,
    });
    vi.mocked(facilitiesApi.getFacilityTimeseries).mockRejectedValueOnce(
      new Error("Timeseries telemetry service timed out")
    );

    render(
      <MapInvestigationDrawer
        selection={{ type: "facility", data: marker }}
        onClose={onClose}
        onNavigate={onNavigate}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText("THERMAL HISTORY UNAVAILABLE")).toBeInTheDocument();
      expect(screen.getByText(/Timeseries telemetry service timed out/i)).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  it("MapInvestigationDrawer should render cluster intelligence and allow zooming", () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    const onZoomCluster = vi.fn();

    const clusterData = {
      id: "cluster-1",
      lat: 23.67,
      lon: 86.15,
      eventCount: 8,
      anomalousCount: 2,
      events: [],
      bounds: [[23.5, 86.0], [23.8, 86.3]] as [[number, number], [number, number]],
    };

    render(
      <MapInvestigationDrawer
        selection={{ type: "cluster", data: clusterData }}
        onClose={onClose}
        onNavigate={onNavigate}
        onZoomCluster={onZoomCluster}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Thermal Cluster (8 Hotspots)")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    const zoomBtn = screen.getByText("Zoom Into Cluster");
    fireEvent.click(zoomBtn);

    expect(onZoomCluster).toHaveBeenCalledWith(clusterData.bounds);
  });

  it("LiveMapPage should render operational full-screen GIS intelligence with live feeds", async () => {
    const onNavigate = vi.fn();

    render(<LiveMapPage onNavigate={onNavigate} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Live Geospatial Intelligence")).toBeInTheDocument();
      expect(screen.getByText("FULL SCREEN GIS")).toBeInTheDocument();
      expect(screen.getByTestId("gis-map-container")).toBeInTheDocument();
    });
  });
});
