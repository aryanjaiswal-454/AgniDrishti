import { apiClient } from "./client";
import { Hotspot, HotspotFilterParams, PaginatedResponse, ApiResponse } from "./types";

/**
 * List raw NASA FIRMS active fire and thermal anomaly detections.
 */
export async function getHotspots(
  params?: HotspotFilterParams,
  signal?: AbortSignal
): Promise<PaginatedResponse<Hotspot>> {
  return apiClient<PaginatedResponse<Hotspot>>("/hotspots", {
    method: "GET",
    params,
    signal,
  });
}

/**
 * Fetch a single raw NASA FIRMS hotspot record by UUID.
 */
export async function getHotspotById(
  id: string,
  signal?: AbortSignal
): Promise<ApiResponse<Hotspot>> {
  return apiClient<ApiResponse<Hotspot>>(`/hotspots/${id}`, {
    method: "GET",
    signal,
  });
}

