import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getFacilities, getFacilityById, getFacilityTimeseries } from "../api/facilities";
import {
  FacilityFilterParams,
  PaginatedResponse,
  Facility,
  FacilityDetail,
  ApiResponse,
  FacilityTimeseriesPoint,
} from "../api/types";
import { queryKeys } from "../query/queryKeys";

/**
 * Hook to query paginated industrial facilities with spatial/attribute filters.
 */
export function useFacilities(
  params?: FacilityFilterParams,
  options?: Omit<UseQueryOptions<PaginatedResponse<Facility>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.facilities.list(params),
    queryFn: ({ signal }) => getFacilities(params, signal),
    // Socket.io refreshes authenticated clients immediately; polling covers disconnected viewers.
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: true,
    ...options,
  });
}

/**
 * Hook to query a single facility by ID including its historical baseline and event summary.
 */
export function useFacility(
  id?: string,
  options?: Omit<UseQueryOptions<ApiResponse<FacilityDetail>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.facilities.detail(id || ""),
    queryFn: ({ signal }) => getFacilityById(id!, signal),
    enabled: Boolean(id),
    ...options,
  });
}

/**
 * Hook to query rolling time-series FRP points for a specific facility.
 */
export function useFacilityTimeseries(
  id?: string,
  params?: { limit?: number },
  options?: Omit<UseQueryOptions<ApiResponse<FacilityTimeseriesPoint[]>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.facilities.timeseries(id || "", params),
    queryFn: ({ signal }) => getFacilityTimeseries(id!, params, signal),
    enabled: Boolean(id),
    ...options,
  });
}

