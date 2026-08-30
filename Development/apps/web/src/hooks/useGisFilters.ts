import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  GisFilterState,
  DEFAULT_GIS_FILTERS,
  TimePreset,
  AnomalyMode,
  filtersToEventParams,
  filtersToFacilityParams,
  serializeToUrlParams,
  parseFromUrlParams,
  countActiveFilters,
  isFilterActive,
  getActiveFilterDescriptors,
  getConstrainedSubClasses,
} from "../components/map/filters/gisFilterState";
import { EventFilterParams, FacilityFilterParams, PrimaryClass, SubClass } from "../api/types";

/**
 * React hook for GIS multi-criteria filter state with URL synchronization.
 * Debounces free-text fields (state, district) at 300ms.
 * Syncs filter state to URL hash query params for shareable investigation URLs.
 */
export function useGisFilters(basePath: string = "/live-map") {
  // Initialize from URL if present
  const getInitialState = (): GisFilterState => {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf("?");
    if (queryIndex >= 0) {
      const search = hash.slice(queryIndex + 1);
      const parsed = parseFromUrlParams(search);
      return { ...DEFAULT_GIS_FILTERS, ...parsed };
    }
    return { ...DEFAULT_GIS_FILTERS };
  };

  const [filters, setFilters] = useState<GisFilterState>(getInitialState);

  // Debounced state/district
  const [debouncedState, setDebouncedState] = useState(filters.state);
  const [debouncedDistrict, setDebouncedDistrict] = useState(filters.district);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimerRef2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce state filter
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedState(filters.state);
    }, 300);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [filters.state]);

  // Debounce district filter
  useEffect(() => {
    if (debounceTimerRef2.current) clearTimeout(debounceTimerRef2.current);
    debounceTimerRef2.current = setTimeout(() => {
      setDebouncedDistrict(filters.district);
    }, 300);
    return () => {
      if (debounceTimerRef2.current) clearTimeout(debounceTimerRef2.current);
    };
  }, [filters.district]);

  // URL sync — write filter state to URL when filters change
  const isInternalNavRef = useRef(false);
  useEffect(() => {
    const debouncedFilters: GisFilterState = {
      ...filters,
      state: debouncedState,
      district: debouncedDistrict,
    };
    const urlParams = serializeToUrlParams(debouncedFilters);
    const newHash = urlParams ? `#${basePath}?${urlParams}` : `#${basePath}`;
    if (window.location.hash !== newHash) {
      isInternalNavRef.current = true;
      window.history.replaceState({}, "", newHash);
    }
  }, [filters.dateRange, filters.dateFrom, filters.dateTo, filters.primaryClass,
      filters.subClass, filters.minConfidence, filters.anomalyMode,
      debouncedState, debouncedDistrict, basePath]);

  // Listen for popstate (browser back/forward) and sync from URL
  useEffect(() => {
    const handlePopState = () => {
      if (isInternalNavRef.current) {
        isInternalNavRef.current = false;
        return;
      }
      const hash = window.location.hash;
      const queryIndex = hash.indexOf("?");
      if (queryIndex >= 0) {
        const search = hash.slice(queryIndex + 1);
        const parsed = parseFromUrlParams(search);
        setFilters({ ...DEFAULT_GIS_FILTERS, ...parsed });
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // ─── Setter Functions ───────────────────────────────────────────────
  const setDateRange = useCallback((preset: TimePreset) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: preset,
      // Clear custom dates when switching away from custom
      dateFrom: preset === "custom" ? prev.dateFrom : null,
      dateTo: preset === "custom" ? prev.dateTo : null,
    }));
  }, []);

  const setDateFrom = useCallback((date: string | null) => {
    setFilters((prev) => ({ ...prev, dateFrom: date, dateRange: "custom" }));
  }, []);

  const setDateTo = useCallback((date: string | null) => {
    setFilters((prev) => ({ ...prev, dateTo: date, dateRange: "custom" }));
  }, []);

  const setPrimaryClass = useCallback((value: "" | PrimaryClass) => {
    setFilters((prev) => {
      // If changing primary class, clear sub-class if it's no longer valid
      const validSubClasses = getConstrainedSubClasses(value).map((o) => o.value);
      const newSubClass = validSubClasses.includes(prev.subClass) ? prev.subClass : "";
      return { ...prev, primaryClass: value, subClass: newSubClass };
    });
  }, []);

  const setSubClass = useCallback((value: "" | SubClass) => {
    setFilters((prev) => ({ ...prev, subClass: value }));
  }, []);

  const setMinConfidence = useCallback((value: number | null) => {
    setFilters((prev) => ({ ...prev, minConfidence: value }));
  }, []);

  const setAnomalyMode = useCallback((mode: AnomalyMode) => {
    setFilters((prev) => ({ ...prev, anomalyMode: mode }));
  }, []);

  const setStateFilter = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, state: value }));
  }, []);

  const setDistrictFilter = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, district: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_GIS_FILTERS });
    setDebouncedState("");
    setDebouncedDistrict("");
  }, []);

  const clearFilter = useCallback((key: keyof GisFilterState) => {
    setFilters((prev) => {
      const updates: Partial<GisFilterState> = {};
      switch (key) {
        case "dateRange":
          updates.dateRange = "all";
          updates.dateFrom = null;
          updates.dateTo = null;
          break;
        case "primaryClass":
          updates.primaryClass = "";
          // Also clear sub-class when clearing primary
          updates.subClass = "";
          break;
        case "subClass":
          updates.subClass = "";
          break;
        case "minConfidence":
          updates.minConfidence = null;
          break;
        case "anomalyMode":
          updates.anomalyMode = "all";
          break;
        case "state":
          updates.state = "";
          break;
        case "district":
          updates.district = "";
          break;
      }
      return { ...prev, ...updates };
    });
  }, []);

  // ─── Computed API Params (use debounced text) ───────────────────────
  const effectiveFilters: GisFilterState = useMemo(() => ({
    ...filters,
    state: debouncedState,
    district: debouncedDistrict,
  }), [filters, debouncedState, debouncedDistrict]);

  const eventParams = useMemo(
    () => filtersToEventParams(effectiveFilters, { limit: 200 }),
    [effectiveFilters]
  );

  const facilityParams = useMemo(
    () => filtersToFacilityParams(effectiveFilters, { limit: 200 }),
    [effectiveFilters]
  );

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);
  const hasActiveFilters = useMemo(() => isFilterActive(filters), [filters]);
  const activeFilterDescriptors = useMemo(() => getActiveFilterDescriptors(filters), [filters]);

  return {
    filters,
    effectiveFilters,
    eventParams,
    facilityParams,
    activeFilterCount,
    hasActiveFilters,
    activeFilterDescriptors,
    setDateRange,
    setDateFrom,
    setDateTo,
    setPrimaryClass,
    setSubClass,
    setMinConfidence,
    setAnomalyMode,
    setStateFilter,
    setDistrictFilter,
    resetFilters,
    clearFilter,
  };
}

