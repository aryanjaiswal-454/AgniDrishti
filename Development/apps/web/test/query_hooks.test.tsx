import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFacilities, useFacility, useFacilityTimeseries } from "../src/hooks/useFacilities";
import { useHotspots, useHotspot } from "../src/hooks/useHotspots";
import { useEvents, useEvent, useSubmitFeedback } from "../src/hooks/useEvents";
import { useAlerts, useAlert, useUpdateAlertStatus } from "../src/hooks/useAlerts";
import { useDashboardSummary } from "../src/hooks/useDashboard";
import { useIngestionStatus, useTriggerFirms, useTriggerOsm } from "../src/hooks/useIngestion";
import { queryKeys } from "../src/query/queryKeys";
import * as facilitiesApi from "../src/api/facilities";
import * as hotspotsApi from "../src/api/hotspots";
import * as eventsApi from "../src/api/events";
import * as alertsApi from "../src/api/alerts";
import * as dashboardApi from "../src/api/dashboard";
import * as ingestionApi from "../src/api/ingestion";

vi.mock("../src/api/facilities", () => ({
  getFacilities: vi.fn(),
  getFacilityById: vi.fn(),
  getFacilityTimeseries: vi.fn(),
}));

vi.mock("../src/api/hotspots", () => ({
  getHotspots: vi.fn(),
  getHotspotById: vi.fn(),
}));

vi.mock("../src/api/events", () => ({
  getEvents: vi.fn(),
  getEventById: vi.fn(),
  submitEventFeedback: vi.fn(),
}));

vi.mock("../src/api/alerts", () => ({
  getAlerts: vi.fn(),
  getAlertById: vi.fn(),
  updateAlertStatus: vi.fn(),
}));

vi.mock("../src/api/dashboard", () => ({
  getDashboardSummary: vi.fn(),
}));

vi.mock("../src/api/ingestion", () => ({
  getIngestionStatus: vi.fn(),
  triggerFirmsIngestion: vi.fn(),
  triggerOsmSync: vi.fn(),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function createWrapper() {
  const testClient = createTestQueryClient();
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={testClient}>{children}</QueryClientProvider>
  );
  return { Wrapper, testClient };
}

describe("TanStack React Query Custom Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useFacilities should fetch and cache paginated facilities list", async () => {
    const mockFacilities = {
      success: true,
      data: [{ id: "f1", name: "Jamnagar Refinery", facility_type: "refinery" as const }],
      pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
    };
    vi.mocked(facilitiesApi.getFacilities).mockResolvedValueOnce(mockFacilities as any);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useFacilities({ facility_type: "refinery" }), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockFacilities);
    expect(facilitiesApi.getFacilities).toHaveBeenCalledWith(
      { facility_type: "refinery" },
      expect.anything()
    );
  });

  it("useFacility should query single facility baseline detail when ID is provided", async () => {
    const mockDetail = {
      success: true,
      data: { id: "f1", name: "Jamnagar Refinery", baseline: { avg_frp: 45.2 } },
    };
    vi.mocked(facilitiesApi.getFacilityById).mockResolvedValueOnce(mockDetail as any);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useFacility("f1"), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockDetail);
  });

  it("useFacilityTimeseries should query rolling FRP points", async () => {
    const mockTimeseries = {
      success: true,
      data: {
        facility_id: "f1",
        points: [{ date: "2026-08-28", frp: 34.2, brightness: 340.5, satellite: "VIIRS" }],
      },
    };
    vi.mocked(facilitiesApi.getFacilityTimeseries).mockResolvedValueOnce(mockTimeseries as any);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useFacilityTimeseries("f1", { limit: 30 }), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTimeseries);
  });

  it("useHotspots and useHotspot should query raw NASA FIRMS hotspots", async () => {
    const mockHotspots = {
      success: true,
      data: [{ id: "h1", latitude: 22.47, longitude: 70.05, frp: 120.5 }],
      pagination: { total: 1, limit: 100, offset: 0, hasMore: false },
    };
    vi.mocked(hotspotsApi.getHotspots).mockResolvedValueOnce(mockHotspots as any);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useHotspots({ daynight: "N" }), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockHotspots);
  });

  it("useEvents should query classified events with filters", async () => {
    const mockEvents = {
      success: true,
      data: [{ id: "e1", primary_class: "industrial" as const, sub_class: "gas_flare" as const }],
      pagination: { total: 1, limit: 100, offset: 0, hasMore: false },
    };
    vi.mocked(eventsApi.getEvents).mockResolvedValueOnce(mockEvents as any);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useEvents({ primary_class: "industrial" }), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockEvents);
  });

  it("useSubmitFeedback mutation should call API and invalidate event queries", async () => {
    const mockFeedback = {
      success: true,
      data: { id: "fb1", event_id: "e1", corrected_label: "gas_flare" },
    };
    vi.mocked(eventsApi.submitEventFeedback).mockResolvedValueOnce(mockFeedback as any);

    const { Wrapper, testClient } = createWrapper();
    const invalidateSpy = vi.spyOn(testClient, "invalidateQueries");

    const { result } = renderHook(() => useSubmitFeedback(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        eventId: "e1",
        data: { corrected_label: "gas_flare", notes: "Normal flare" },
      });
    });

    expect(eventsApi.submitEventFeedback).toHaveBeenCalledWith("e1", {
      corrected_label: "gas_flare",
      notes: "Normal flare",
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["events", "detail", "e1"] })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["events", "list"] })
    );
  });

  it("useUpdateAlertStatus mutation should call API and invalidate alert & dashboard caches", async () => {
    const mockAlert = {
      success: true,
      data: { id: "a1", status: "acknowledged" as const },
    };
    vi.mocked(alertsApi.updateAlertStatus).mockResolvedValueOnce(mockAlert as any);

    const { Wrapper, testClient } = createWrapper();
    const invalidateSpy = vi.spyOn(testClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateAlertStatus(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: "a1", status: "acknowledged" });
    });

    expect(alertsApi.updateAlertStatus).toHaveBeenCalledWith("a1", "acknowledged");
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["alerts", "detail", "a1"] })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["dashboard", "summary"] })
    );
  });

  it("useDashboardSummary should query aggregated telemetry", async () => {
    const mockSummary = {
      success: true,
      data: {
        total_hotspots_24h: 142,
        total_classified_events: 130,
        active_alerts: 3,
        total_facilities: 2481,
      },
    };
    vi.mocked(dashboardApi.getDashboardSummary).mockResolvedValueOnce(mockSummary as any);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useDashboardSummary(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockSummary);
  });

  it("useIngestionStatus and trigger mutations should query status and invalidate queues", async () => {
    const mockTelemetry = {
      success: true,
      data: {
        firms: { last_ingestion: "2026-08-29T10:00:00Z", total_ingested_24h: 240, status: "active" as const },
        osm: { last_sync: "2026-08-24T03:00:00Z", total_facilities_indexed: 2481, status: "idle" as const },
        queues: {
          firms: { waiting: 0, active: 0, failed: 0 },
          osm: { waiting: 0, active: 0, failed: 0 },
          classification: { waiting: 0, active: 0, failed: 0 },
        },
      },
    };
    vi.mocked(ingestionApi.getIngestionStatus).mockResolvedValueOnce(mockTelemetry as any);
    vi.mocked(ingestionApi.triggerFirmsIngestion).mockResolvedValueOnce({ success: true, message: "Job queued" } as any);

    const { Wrapper, testClient } = createWrapper();
    const invalidateSpy = vi.spyOn(testClient, "invalidateQueries");

    const { result: statusResult } = renderHook(() => useIngestionStatus(), { wrapper: Wrapper });
    await waitFor(() => expect(statusResult.current.isSuccess).toBe(true));
    expect(statusResult.current.data).toEqual(mockTelemetry);

    const { result: triggerResult } = renderHook(() => useTriggerFirms(), { wrapper: Wrapper });
    await act(async () => {
      await triggerResult.current.mutateAsync(true);
    });

    expect(ingestionApi.triggerFirmsIngestion).toHaveBeenCalledWith(true);
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.ingestion.status() })
    );
  });

  it("should maintain strict query key separation between resources and filters", () => {
    expect(queryKeys.facilities.list({ state: "Gujarat" })).not.toEqual(
      queryKeys.facilities.list({ state: "Maharashtra" })
    );
    expect(queryKeys.events.list({ is_anomalous: true })).not.toEqual(
      queryKeys.events.list({ is_anomalous: false })
    );
    expect(queryKeys.alerts.detail("a1")).not.toEqual(queryKeys.alerts.detail("a2"));
  });
});
