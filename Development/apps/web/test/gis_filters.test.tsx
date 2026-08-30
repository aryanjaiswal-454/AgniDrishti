import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  DEFAULT_GIS_FILTERS,
  computeDateRange,
  filtersToEventParams,
  filtersToFacilityParams,
  countActiveFilters,
  isFilterActive,
  getActiveFilterDescriptors,
  getConstrainedSubClasses,
  serializeToUrlParams,
  parseFromUrlParams,
  GisFilterState,
} from "../src/components/map/filters/gisFilterState";
import { GisFilterBar } from "../src/components/map/filters/GisFilterBar";
import { ActiveFilterChips } from "../src/components/map/filters/ActiveFilterChips";
import { FilteredSummaryStrip } from "../src/components/map/filters/FilteredSummaryStrip";

// ─── Mock Leaflet (required for map component imports) ──────────────────────
vi.mock("leaflet", () => ({
  Icon: { Default: { mergeOptions: vi.fn() } },
  icon: vi.fn(() => ({})),
  divIcon: vi.fn(() => ({})),
  latLngBounds: vi.fn(() => ({ isValid: () => true })),
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  CircleMarker: ({ children }: any) => <div>{children}</div>,
  Popup: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  useMap: () => ({
    getZoom: () => 5,
    fitBounds: vi.fn(),
    setView: vi.fn(),
  }),
  useMapEvents: vi.fn(() => ({
    getZoom: () => 5,
  })),
}));

// ─── Test Helpers ────────────────────────────────────────────────────────────
function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = createTestQueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIT TESTS: gisFilterState
// ═══════════════════════════════════════════════════════════════════════════
describe("GIS Filter State Model", () => {
  describe("DEFAULT_GIS_FILTERS", () => {
    it("should have all filters in their default (unset) state", () => {
      expect(DEFAULT_GIS_FILTERS.dateRange).toBe("all");
      expect(DEFAULT_GIS_FILTERS.dateFrom).toBeNull();
      expect(DEFAULT_GIS_FILTERS.dateTo).toBeNull();
      expect(DEFAULT_GIS_FILTERS.primaryClass).toBe("");
      expect(DEFAULT_GIS_FILTERS.subClass).toBe("");
      expect(DEFAULT_GIS_FILTERS.minConfidence).toBeNull();
      expect(DEFAULT_GIS_FILTERS.anomalyMode).toBe("all");
      expect(DEFAULT_GIS_FILTERS.state).toBe("");
      expect(DEFAULT_GIS_FILTERS.district).toBe("");
    });
  });

  describe("computeDateRange", () => {
    it("should return empty object for 'all' preset", () => {
      const result = computeDateRange("all", null, null);
      expect(result).toEqual({});
    });

    it("should compute correct date range for '24h' preset", () => {
      const result = computeDateRange("24h", null, null);
      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();
      // Start should be 1 day before end
      const start = new Date(result.startDate!);
      const end = new Date(result.endDate!);
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeCloseTo(1, 0);
    });

    it("should compute correct date range for '7d' preset", () => {
      const result = computeDateRange("7d", null, null);
      const start = new Date(result.startDate!);
      const end = new Date(result.endDate!);
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeCloseTo(7, 0);
    });

    it("should compute correct date range for '30d' preset", () => {
      const result = computeDateRange("30d", null, null);
      const start = new Date(result.startDate!);
      const end = new Date(result.endDate!);
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeCloseTo(30, 0);
    });

    it("should compute correct date range for '90d' preset", () => {
      const result = computeDateRange("90d", null, null);
      const start = new Date(result.startDate!);
      const end = new Date(result.endDate!);
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeCloseTo(90, 0);
    });

    it("should return custom dates for 'custom' preset", () => {
      const result = computeDateRange("custom", "2026-01-01", "2026-06-30");
      expect(result.startDate).toBe("2026-01-01");
      expect(result.endDate).toBe("2026-06-30");
    });

    it("should handle partial custom range (only start)", () => {
      const result = computeDateRange("custom", "2026-01-01", null);
      expect(result.startDate).toBe("2026-01-01");
      expect(result.endDate).toBeUndefined();
    });
  });

  describe("filtersToEventParams", () => {
    it("should return minimal params for default filters", () => {
      const result = filtersToEventParams(DEFAULT_GIS_FILTERS);
      // Default = 'all' time, no class, no confidence, no anomaly, no state
      expect(result.startDate).toBeUndefined();
      expect(result.primary_class).toBeUndefined();
      expect(result.min_confidence).toBeUndefined();
      expect(result.is_anomalous).toBeUndefined();
      expect(result.state).toBeUndefined();
    });

    it("should include primary_class when set", () => {
      const state: GisFilterState = { ...DEFAULT_GIS_FILTERS, primaryClass: "industrial" };
      const result = filtersToEventParams(state);
      expect(result.primary_class).toBe("industrial");
    });

    it("should include sub_class when set", () => {
      const state: GisFilterState = { ...DEFAULT_GIS_FILTERS, subClass: "gas_flare" };
      const result = filtersToEventParams(state);
      expect(result.sub_class).toBe("gas_flare");
    });

    it("should include min_confidence when set", () => {
      const state: GisFilterState = { ...DEFAULT_GIS_FILTERS, minConfidence: 0.8 };
      const result = filtersToEventParams(state);
      expect(result.min_confidence).toBe(0.8);
    });

    it("should set is_anomalous=true for anomalous mode", () => {
      const state: GisFilterState = { ...DEFAULT_GIS_FILTERS, anomalyMode: "anomalous" };
      const result = filtersToEventParams(state);
      expect(result.is_anomalous).toBe(true);
    });

    it("should set is_anomalous=false for nominal mode", () => {
      const state: GisFilterState = { ...DEFAULT_GIS_FILTERS, anomalyMode: "nominal" };
      const result = filtersToEventParams(state);
      expect(result.is_anomalous).toBe(false);
    });

    it("should include state and district when set", () => {
      const state: GisFilterState = { ...DEFAULT_GIS_FILTERS, state: "Gujarat", district: "Ahmedabad" };
      const result = filtersToEventParams(state);
      expect(result.state).toBe("Gujarat");
      expect(result.district).toBe("Ahmedabad");
    });

    it("should merge extraParams", () => {
      const result = filtersToEventParams(DEFAULT_GIS_FILTERS, { limit: 50, offset: 10 });
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(10);
    });

    it("should combine temporal + classification + confidence + anomaly + geography", () => {
      const state: GisFilterState = {
        dateRange: "7d",
        dateFrom: null,
        dateTo: null,
        primaryClass: "industrial",
        subClass: "gas_flare",
        minConfidence: 0.9,
        anomalyMode: "anomalous",
        state: "Rajasthan",
        district: "Jaisalmer",
      };
      const result = filtersToEventParams(state);
      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();
      expect(result.primary_class).toBe("industrial");
      expect(result.sub_class).toBe("gas_flare");
      expect(result.min_confidence).toBe(0.9);
      expect(result.is_anomalous).toBe(true);
      expect(result.state).toBe("Rajasthan");
      expect(result.district).toBe("Jaisalmer");
    });
  });

  describe("filtersToFacilityParams", () => {
    it("should return empty params for default filters", () => {
      const result = filtersToFacilityParams(DEFAULT_GIS_FILTERS);
      expect(result.state).toBeUndefined();
      expect(result.district).toBeUndefined();
    });

    it("should include state and district when set", () => {
      const state: GisFilterState = { ...DEFAULT_GIS_FILTERS, state: "Maharashtra", district: "Pune" };
      const result = filtersToFacilityParams(state);
      expect(result.state).toBe("Maharashtra");
      expect(result.district).toBe("Pune");
    });
  });

  describe("countActiveFilters / isFilterActive", () => {
    it("should return 0 for default filters", () => {
      expect(countActiveFilters(DEFAULT_GIS_FILTERS)).toBe(0);
      expect(isFilterActive(DEFAULT_GIS_FILTERS)).toBe(false);
    });

    it("should count each active filter dimension", () => {
      const state: GisFilterState = {
        ...DEFAULT_GIS_FILTERS,
        dateRange: "7d",
        primaryClass: "industrial",
        minConfidence: 0.8,
      };
      expect(countActiveFilters(state)).toBe(3);
      expect(isFilterActive(state)).toBe(true);
    });

    it("should count all 7 filters when all are set", () => {
      const state: GisFilterState = {
        dateRange: "30d",
        dateFrom: null,
        dateTo: null,
        primaryClass: "natural",
        subClass: "forest_fire",
        minConfidence: 0.7,
        anomalyMode: "anomalous",
        state: "Kerala",
        district: "Kottayam",
      };
      expect(countActiveFilters(state)).toBe(7);
    });
  });

  describe("getActiveFilterDescriptors", () => {
    it("should return empty array for default filters", () => {
      expect(getActiveFilterDescriptors(DEFAULT_GIS_FILTERS)).toEqual([]);
    });

    it("should describe temporal preset", () => {
      const state: GisFilterState = { ...DEFAULT_GIS_FILTERS, dateRange: "7d" };
      const result = getActiveFilterDescriptors(state);
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe("dateRange");
      expect(result[0].label).toContain("7 Days");
    });

    it("should describe custom date range", () => {
      const state: GisFilterState = {
        ...DEFAULT_GIS_FILTERS,
        dateRange: "custom",
        dateFrom: "2026-01-01",
        dateTo: "2026-06-30",
      };
      const result = getActiveFilterDescriptors(state);
      expect(result[0].label).toContain("2026-01-01");
      expect(result[0].label).toContain("2026-06-30");
    });

    it("should describe primary class", () => {
      const state: GisFilterState = { ...DEFAULT_GIS_FILTERS, primaryClass: "industrial" };
      const result = getActiveFilterDescriptors(state);
      expect(result.find((d) => d.key === "primaryClass")?.label).toBe("Industrial");
    });

    it("should describe confidence threshold", () => {
      const state: GisFilterState = { ...DEFAULT_GIS_FILTERS, minConfidence: 0.8 };
      const result = getActiveFilterDescriptors(state);
      expect(result.find((d) => d.key === "minConfidence")?.label).toBe("≥80%");
    });

    it("should describe anomaly mode", () => {
      const state: GisFilterState = { ...DEFAULT_GIS_FILTERS, anomalyMode: "anomalous" };
      const result = getActiveFilterDescriptors(state);
      expect(result.find((d) => d.key === "anomalyMode")?.label).toBe("Anomalous Only");
    });
  });

  describe("getConstrainedSubClasses", () => {
    it("should return all sub-classes plus 'All' for empty primary class", () => {
      const result = getConstrainedSubClasses("");
      expect(result.length).toBe(8); // All + 7 sub-classes
      expect(result[0].value).toBe("");
      expect(result[0].label).toBe("All Sub-Classes");
    });

    it("should return only industrial sub-classes for 'industrial' primary", () => {
      const result = getConstrainedSubClasses("industrial");
      expect(result.length).toBe(4); // All + 3 industrial
      expect(result.map((r) => r.value)).toContain("industrial_fire");
      expect(result.map((r) => r.value)).toContain("gas_flare");
      expect(result.map((r) => r.value)).toContain("mining_activity");
      expect(result.map((r) => r.value)).not.toContain("forest_fire");
    });

    it("should return only natural sub-classes for 'natural' primary", () => {
      const result = getConstrainedSubClasses("natural");
      expect(result.length).toBe(4); // All + 3 natural
      expect(result.map((r) => r.value)).toContain("forest_fire");
      expect(result.map((r) => r.value)).toContain("agricultural_burning");
      expect(result.map((r) => r.value)).not.toContain("industrial_fire");
    });
  });

  describe("URL Serialization", () => {
    it("should serialize default filters to empty string", () => {
      expect(serializeToUrlParams(DEFAULT_GIS_FILTERS)).toBe("");
    });

    it("should serialize temporal preset", () => {
      const state: GisFilterState = { ...DEFAULT_GIS_FILTERS, dateRange: "7d" };
      const result = serializeToUrlParams(state);
      expect(result).toContain("range=7d");
    });

    it("should serialize custom date range with from/to", () => {
      const state: GisFilterState = {
        ...DEFAULT_GIS_FILTERS,
        dateRange: "custom",
        dateFrom: "2026-01-01",
        dateTo: "2026-06-30",
      };
      const result = serializeToUrlParams(state);
      expect(result).toContain("range=custom");
      expect(result).toContain("from=2026-01-01");
      expect(result).toContain("to=2026-06-30");
    });

    it("should serialize classification", () => {
      const state: GisFilterState = {
        ...DEFAULT_GIS_FILTERS,
        primaryClass: "industrial",
        subClass: "gas_flare",
      };
      const result = serializeToUrlParams(state);
      expect(result).toContain("primary=industrial");
      expect(result).toContain("sub=gas_flare");
    });

    it("should serialize confidence", () => {
      const state: GisFilterState = { ...DEFAULT_GIS_FILTERS, minConfidence: 0.9 };
      const result = serializeToUrlParams(state);
      expect(result).toContain("confidence=0.9");
    });

    it("should serialize anomaly mode", () => {
      const state: GisFilterState = { ...DEFAULT_GIS_FILTERS, anomalyMode: "anomalous" };
      const result = serializeToUrlParams(state);
      expect(result).toContain("anomaly=anomalous");
    });

    it("should serialize geographic filters", () => {
      const state: GisFilterState = {
        ...DEFAULT_GIS_FILTERS,
        state: "Gujarat",
        district: "Kutch",
      };
      const result = serializeToUrlParams(state);
      expect(result).toContain("state=Gujarat");
      expect(result).toContain("district=Kutch");
    });

    it("should round-trip serialize/deserialize correctly", () => {
      const state: GisFilterState = {
        dateRange: "30d",
        dateFrom: null,
        dateTo: null,
        primaryClass: "industrial",
        subClass: "gas_flare",
        minConfidence: 0.8,
        anomalyMode: "anomalous",
        state: "Tamil Nadu",
        district: "Chennai",
      };
      const serialized = serializeToUrlParams(state);
      const parsed = parseFromUrlParams(serialized);

      expect(parsed.dateRange).toBe("30d");
      expect(parsed.primaryClass).toBe("industrial");
      expect(parsed.subClass).toBe("gas_flare");
      expect(parsed.minConfidence).toBe(0.8);
      expect(parsed.anomalyMode).toBe("anomalous");
      expect(parsed.state).toBe("Tamil Nadu");
      expect(parsed.district).toBe("Chennai");
    });
  });

  describe("parseFromUrlParams", () => {
    it("should return empty partial for empty search string", () => {
      const result = parseFromUrlParams("");
      expect(Object.keys(result)).toHaveLength(0);
    });

    it("should reject invalid date range values", () => {
      const result = parseFromUrlParams("range=invalid");
      expect(result.dateRange).toBeUndefined();
    });

    it("should reject invalid confidence values", () => {
      const result = parseFromUrlParams("confidence=abc");
      expect(result.minConfidence).toBeUndefined();
    });

    it("should reject out-of-range confidence values", () => {
      const result = parseFromUrlParams("confidence=1.5");
      expect(result.minConfidence).toBeUndefined();
    });

    it("should reject invalid primary class values", () => {
      const result = parseFromUrlParams("primary=unknown");
      expect(result.primaryClass).toBeUndefined();
    });

    it("should reject invalid anomaly mode values", () => {
      const result = parseFromUrlParams("anomaly=maybe");
      expect(result.anomalyMode).toBeUndefined();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT TESTS: Filter UI Components
// ═══════════════════════════════════════════════════════════════════════════
describe("GIS Filter UI Components", () => {
  describe("GisFilterBar", () => {
    const defaultProps = {
      filters: DEFAULT_GIS_FILTERS,
      onSetDateRange: vi.fn(),
      onSetDateFrom: vi.fn(),
      onSetDateTo: vi.fn(),
      onSetPrimaryClass: vi.fn(),
      onSetSubClass: vi.fn(),
      onSetMinConfidence: vi.fn(),
      onSetAnomalyMode: vi.fn(),
      onSetState: vi.fn(),
      onSetDistrict: vi.fn(),
      onReset: vi.fn(),
      activeFilterCount: 0,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should render the filter toolbar with all sections", () => {
      render(<GisFilterBar {...defaultProps} />);
      expect(screen.getByRole("toolbar", { name: /GIS Intelligence Filters/i })).toBeDefined();
    });

    it("should render temporal preset buttons", () => {
      render(<GisFilterBar {...defaultProps} />);
      expect(screen.getByText("All Time")).toBeDefined();
      expect(screen.getByText("24 Hours")).toBeDefined();
      expect(screen.getByText("7 Days")).toBeDefined();
      expect(screen.getByText("30 Days")).toBeDefined();
      expect(screen.getByText("90 Days")).toBeDefined();
      expect(screen.getByText("Custom")).toBeDefined();
    });

    it("should render classification segmented controls", () => {
      render(<GisFilterBar {...defaultProps} />);
      const classButtons = screen.getAllByRole("button");
      // Should have All, Industrial, Natural class buttons
      expect(classButtons.some((b) => b.textContent === "Industrial")).toBe(true);
      expect(classButtons.some((b) => b.textContent === "Natural")).toBe(true);
    });

    it("should render confidence preset buttons", () => {
      render(<GisFilterBar {...defaultProps} />);
      expect(screen.getByText("≥70%")).toBeDefined();
      expect(screen.getByText("≥80%")).toBeDefined();
      expect(screen.getByText("≥90%")).toBeDefined();
    });

    it("should render anomaly mode buttons", () => {
      render(<GisFilterBar {...defaultProps} />);
      expect(screen.getByText("Anomalous")).toBeDefined();
      expect(screen.getByText("Nominal")).toBeDefined();
    });

    it("should render state and district inputs", () => {
      render(<GisFilterBar {...defaultProps} />);
      expect(screen.getByLabelText("State filter")).toBeDefined();
      expect(screen.getByLabelText("District filter")).toBeDefined();
    });

    it("should call onSetDateRange when a temporal button is clicked", () => {
      render(<GisFilterBar {...defaultProps} />);
      fireEvent.click(screen.getByText("7 Days"));
      expect(defaultProps.onSetDateRange).toHaveBeenCalledWith("7d");
    });

    it("should call onSetPrimaryClass when classification button is clicked", () => {
      render(<GisFilterBar {...defaultProps} />);
      fireEvent.click(screen.getByText("Industrial"));
      expect(defaultProps.onSetPrimaryClass).toHaveBeenCalledWith("industrial");
    });

    it("should call onSetMinConfidence when confidence button is clicked", () => {
      render(<GisFilterBar {...defaultProps} />);
      fireEvent.click(screen.getByText("≥80%"));
      expect(defaultProps.onSetMinConfidence).toHaveBeenCalledWith(0.8);
    });

    it("should call onSetAnomalyMode when anomaly button is clicked", () => {
      render(<GisFilterBar {...defaultProps} />);
      fireEvent.click(screen.getByText("Anomalous"));
      expect(defaultProps.onSetAnomalyMode).toHaveBeenCalledWith("anomalous");
    });

    it("should show Clear All button when activeFilterCount > 0", () => {
      render(<GisFilterBar {...defaultProps} activeFilterCount={3} />);
      expect(screen.getByText("Clear All")).toBeDefined();
    });

    it("should not show Clear All button when activeFilterCount is 0", () => {
      render(<GisFilterBar {...defaultProps} activeFilterCount={0} />);
      expect(screen.queryByText("Clear All")).toBeNull();
    });

    it("should call onReset when Clear All is clicked", () => {
      render(<GisFilterBar {...defaultProps} activeFilterCount={2} />);
      fireEvent.click(screen.getByText("Clear All"));
      expect(defaultProps.onReset).toHaveBeenCalled();
    });

    it("should show active filter count badge", () => {
      render(<GisFilterBar {...defaultProps} activeFilterCount={5} />);
      expect(screen.getByText("5")).toBeDefined();
    });

    it("should show date inputs when Custom is selected", () => {
      const customFilters = { ...DEFAULT_GIS_FILTERS, dateRange: "custom" as const };
      render(<GisFilterBar {...defaultProps} filters={customFilters} />);
      expect(screen.getByLabelText("Start date")).toBeDefined();
      expect(screen.getByLabelText("End date")).toBeDefined();
    });

    it("should have proper aria-pressed states for active temporal preset", () => {
      const activeFilters = { ...DEFAULT_GIS_FILTERS, dateRange: "7d" as const };
      render(<GisFilterBar {...defaultProps} filters={activeFilters} />);
      expect(screen.getByText("7 Days").getAttribute("aria-pressed")).toBe("true");
      expect(screen.getByText("30 Days").getAttribute("aria-pressed")).toBe("false");
    });
  });

  describe("ActiveFilterChips", () => {
    it("should render nothing when no active descriptors", () => {
      const { container } = render(
        <ActiveFilterChips descriptors={[]} onClearFilter={vi.fn()} onClearAll={vi.fn()} />
      );
      expect(container.innerHTML).toBe("");
    });

    it("should render chips for each active filter", () => {
      const descriptors = [
        { key: "dateRange" as const, label: "Last 7 Days" },
        { key: "primaryClass" as const, label: "Industrial" },
        { key: "minConfidence" as const, label: "≥80%" },
      ];
      render(
        <ActiveFilterChips descriptors={descriptors} onClearFilter={vi.fn()} onClearAll={vi.fn()} />
      );
      expect(screen.getByText("Last 7 Days")).toBeDefined();
      expect(screen.getByText("Industrial")).toBeDefined();
      expect(screen.getByText("≥80%")).toBeDefined();
    });

    it("should call onClearFilter when a chip dismiss button is clicked", () => {
      const onClearFilter = vi.fn();
      const descriptors = [{ key: "primaryClass" as const, label: "Industrial" }];
      render(
        <ActiveFilterChips descriptors={descriptors} onClearFilter={onClearFilter} onClearAll={vi.fn()} />
      );
      fireEvent.click(screen.getByLabelText("Remove Industrial filter"));
      expect(onClearFilter).toHaveBeenCalledWith("primaryClass");
    });

    it("should show Clear All button and call onClearAll when clicked", () => {
      const onClearAll = vi.fn();
      const descriptors = [{ key: "dateRange" as const, label: "Last 7 Days" }];
      render(
        <ActiveFilterChips descriptors={descriptors} onClearFilter={vi.fn()} onClearAll={onClearAll} />
      );
      fireEvent.click(screen.getByText("Clear All"));
      expect(onClearAll).toHaveBeenCalled();
    });
  });

  describe("FilteredSummaryStrip", () => {
    it("should render event, anomalous, industrial, and facility counts", () => {
      render(
        <FilteredSummaryStrip
          totalEvents={42}
          anomalousCount={5}
          industrialCount={18}
          facilityCount={12}
          isFiltered={false}
        />
      );
      expect(screen.getByText("42")).toBeDefined();
      expect(screen.getByText("5")).toBeDefined();
      expect(screen.getByText("18")).toBeDefined();
      expect(screen.getByText("12")).toBeDefined();
    });

    it("should show FILTERED VIEW badge when isFiltered is true", () => {
      render(
        <FilteredSummaryStrip
          totalEvents={10}
          anomalousCount={2}
          industrialCount={6}
          facilityCount={3}
          isFiltered={true}
        />
      );
      expect(screen.getByText("Filtered View")).toBeDefined();
    });

    it("should not show FILTERED VIEW badge when isFiltered is false", () => {
      render(
        <FilteredSummaryStrip
          totalEvents={10}
          anomalousCount={2}
          industrialCount={6}
          facilityCount={3}
          isFiltered={false}
        />
      );
      expect(screen.queryByText("Filtered View")).toBeNull();
    });

    it("should have proper aria status role", () => {
      render(
        <FilteredSummaryStrip
          totalEvents={10}
          anomalousCount={0}
          industrialCount={5}
          facilityCount={3}
          isFiltered={false}
        />
      );
      expect(screen.getByRole("status")).toBeDefined();
    });
  });
});
