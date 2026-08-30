import {
  FacilityFilterParams,
  HotspotFilterParams,
  EventFilterParams,
  AlertFilterParams,
} from "../api/types";

/**
 * Centralized TanStack Query Key Factory
 * Ensures consistent cache partitioning, query invalidation, and deduplication.
 */
export const queryKeys = {
  // Auth query keys
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },

  // Facility query keys
  facilities: {
    all: ["facilities"] as const,
    lists: () => [...queryKeys.facilities.all, "list"] as const,
    list: (filters?: FacilityFilterParams) =>
      [...queryKeys.facilities.lists(), filters || {}] as const,
    details: () => [...queryKeys.facilities.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.facilities.details(), id] as const,
    timeseries: (id: string, params?: { limit?: number }) =>
      [...queryKeys.facilities.detail(id), "timeseries", params || {}] as const,
  },

  // Hotspot query keys
  hotspots: {
    all: ["hotspots"] as const,
    lists: () => [...queryKeys.hotspots.all, "list"] as const,
    list: (filters?: HotspotFilterParams) =>
      [...queryKeys.hotspots.lists(), filters || {}] as const,
    details: () => [...queryKeys.hotspots.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.hotspots.details(), id] as const,
  },

  // Classified Event query keys
  events: {
    all: ["events"] as const,
    lists: () => [...queryKeys.events.all, "list"] as const,
    list: (filters?: EventFilterParams) =>
      [...queryKeys.events.lists(), filters || {}] as const,
    details: () => [...queryKeys.events.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.events.details(), id] as const,
  },

  // Alert query keys
  alerts: {
    all: ["alerts"] as const,
    lists: () => [...queryKeys.alerts.all, "list"] as const,
    list: (filters?: AlertFilterParams) =>
      [...queryKeys.alerts.lists(), filters || {}] as const,
    details: () => [...queryKeys.alerts.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.alerts.details(), id] as const,
  },

  // Dashboard Command Center query keys
  dashboard: {
    all: ["dashboard"] as const,
    summary: () => [...queryKeys.dashboard.all, "summary"] as const,
  },

  // Ingestion Telemetry query keys
  ingestion: {
    all: ["ingestion"] as const,
    status: () => [...queryKeys.ingestion.all, "status"] as const,
  },
};

