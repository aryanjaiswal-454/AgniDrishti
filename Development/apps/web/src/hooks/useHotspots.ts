import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getHotspots, getHotspotById } from "../api/hotspots";
import { Hotspot, HotspotFilterParams, PaginatedResponse, ApiResponse } from "../api/types";
import { queryKeys } from "../query/queryKeys";

/**
 * Hook to query raw NASA FIRMS hotspots with satellite sensor / daynight / date filters.
 */
export function useHotspots(
  params?: HotspotFilterParams,
  options?: Omit<UseQueryOptions<PaginatedResponse<Hotspot>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.hotspots.list(params),
    queryFn: ({ signal }) => getHotspots(params, signal),
    ...options,
  });
}

/**
 * Hook to query a single raw hotspot record by UUID.
 */
export function useHotspot(
  id?: string,
  options?: Omit<UseQueryOptions<ApiResponse<Hotspot>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.hotspots.detail(id || ""),
    queryFn: ({ signal }) => getHotspotById(id!, signal),
    enabled: Boolean(id),
    ...options,
  });
}

