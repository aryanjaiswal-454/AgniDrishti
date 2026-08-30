import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FacilitiesPage, FacilityDetailPage } from "../src/pages/facilities";
import * as facilitiesApi from "../src/api/facilities";
import { Facility } from "@agnidrishti/shared-types";

vi.mock("../src/api/facilities", () => ({
  getFacilities: vi.fn(),
  getFacilityById: vi.fn(),
  getFacilityTimeseries: vi.fn(),
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

const mockFacilitiesList: Facility[] = [
  {
    id: "f0000000-0000-0000-0000-000000000001",
    osm_id: "101",
    name: "Jamnagar Refinery Complex",
    facility_type: "refinery",
    geometry: { type: "Point", coordinates: [70.0577, 22.4707] },
    state: "Gujarat",
    district: "Jamnagar",
    source: "osm",
    last_synced_at: "2026-08-28T12:00:00Z",
  },
  {
    id: "f0000000-0000-0000-0000-000000000002",
    osm_id: "102",
    name: "Vindhyachal Super Thermal Power Station",
    facility_type: "power_plant",
    geometry: { type: "Point", coordinates: [82.6719, 24.0983] },
    state: "Madhya Pradesh",
    district: "Singrauli",
    source: "osm",
    last_synced_at: "2026-08-28T12:00:00Z",
  },
];

describe("FacilitiesPage & FacilityDetailPage (D4.5A)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render facilities list with search, filters, and items", async () => {
    vi.mocked(facilitiesApi.getFacilities).mockResolvedValueOnce({
      success: true,
      data: mockFacilitiesList,
      pagination: { total: 2, limit: 20, offset: 0, hasMore: false },
    } as any);

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <FacilitiesPage onNavigate={onNavigate} />
      </Wrapper>
    );

    // Initial loading or immediate render
    await waitFor(() => {
      expect(screen.getByText("FACILITY INTELLIGENCE")).toBeInTheDocument();
      expect(screen.getAllByText("Jamnagar Refinery Complex").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Vindhyachal Super Thermal Power Station").length).toBeGreaterThan(0);
    });

    expect(screen.getByPlaceholderText(/Search facility name.../i)).toBeInTheDocument();
  });

  it("should trigger navigation to facility detail when row is clicked", async () => {
    vi.mocked(facilitiesApi.getFacilities).mockResolvedValueOnce({
      success: true,
      data: mockFacilitiesList,
      pagination: { total: 2, limit: 20, offset: 0, hasMore: false },
    } as any);

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <FacilitiesPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText("Jamnagar Refinery Complex").length).toBeGreaterThan(0);
    });

    const facilityRow = screen.getAllByText("Jamnagar Refinery Complex")[0];
    fireEvent.click(facilityRow);

    expect(onNavigate).toHaveBeenCalledWith("/facilities/f0000000-0000-0000-0000-000000000001");
  });

  it("should render empty state when no facilities match filters", async () => {
    vi.mocked(facilitiesApi.getFacilities).mockResolvedValueOnce({
      success: true,
      data: [],
      pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
    } as any);

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <FacilitiesPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("NO FACILITIES MATCH THE CURRENT FILTERS")).toBeInTheDocument();
    });
  });

  it("should render error state and handle retry when API request fails", async () => {
    vi.mocked(facilitiesApi.getFacilities).mockRejectedValueOnce(new Error("Database connection failed"));

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <FacilitiesPage onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("FAILED TO RETRIEVE FACILITY REGISTRY")).toBeInTheDocument();
      expect(screen.getByText("Database connection failed")).toBeInTheDocument();
    });
  });

  it("FacilityDetailPage should render full facility specs, baseline, and timeseries", async () => {
    const mockDetail = {
      ...mockFacilitiesList[0],
      baseline: {
        id: "b1",
        facility_id: mockFacilitiesList[0].id,
        avg_daily_detections: 3.2,
        avg_frp: 45.2,
        std_dev_frp: 12.4,
        window_start: "2026-06-01T00:00:00Z",
        window_end: "2026-08-28T00:00:00Z",
        updated_at: "2026-08-28T00:00:00Z",
      },
      total_events: 12,
      anomalous_events_count: 2,
    };

    const mockTimeseries = [
      {
        date: "2026-08-28",
        avg_frp: 45.2,
        max_frp: 120.0,
        detections_count: 4,
        anomalous_count: 1,
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

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <FacilityDetailPage facilityId={mockFacilitiesList[0].id} onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText("Jamnagar Refinery Complex").length).toBeGreaterThan(0);
      expect(screen.getByText("45.2 MW")).toBeInTheDocument();
      expect(screen.getByText("3.2 / day")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("Refinery")).toBeInTheDocument();
    });
  });

  it("FacilityDetailPage should display empty timeseries message when no history exists", async () => {
    const mockDetail = {
      ...mockFacilitiesList[0],
      baseline: null,
      total_events: 0,
      anomalous_events_count: 0,
    };

    vi.mocked(facilitiesApi.getFacilityById).mockResolvedValueOnce({
      success: true,
      data: mockDetail as any,
    });
    vi.mocked(facilitiesApi.getFacilityTimeseries).mockResolvedValueOnce({
      success: true,
      data: [] as any,
    });

    const onNavigate = vi.fn();
    const { Wrapper } = createWrapper();

    render(
      <Wrapper>
        <FacilityDetailPage facilityId={mockFacilitiesList[0].id} onNavigate={onNavigate} />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("NO HISTORICAL THERMAL ACTIVITY AVAILABLE")).toBeInTheDocument();
    });
  });
});


