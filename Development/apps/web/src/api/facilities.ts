import { apiClient } from "./client";
import {
  Facility,
  FacilityDetail,
  FacilityFilterParams,
  FacilityTimeseriesPoint,
  PaginatedResponse,
  ApiResponse,
} from "./types";

export type { Facility, FacilityDetail, FacilityFilterParams, FacilityTimeseriesPoint };

/**
 * List industrial facilities with spatial bbox and attribute filtering.
 */
export async function getFacilities(
  params?: FacilityFilterParams,
  signal?: AbortSignal
): Promise<PaginatedResponse<Facility>> {
  return apiClient<PaginatedResponse<Facility>>("/facilities", {
    method: "GET",
    params,
    signal,
  });
}

/**
 * Get single facility with its historical baseline profile.
 */
export async function getFacilityById(
  id: string,
  signal?: AbortSignal
): Promise<ApiResponse<FacilityDetail>> {
  return apiClient<ApiResponse<FacilityDetail>>(`/facilities/${id}`, {
    method: "GET",
    signal,
  });
}

/**
 * Fetch rolling time-series FRP points for charting and anomaly visualization.
 */
export async function getFacilityTimeseries(
  id: string,
  params?: { limit?: number },
  signal?: AbortSignal
): Promise<ApiResponse<FacilityTimeseriesPoint[]>> {
  return apiClient<ApiResponse<FacilityTimeseriesPoint[]>>(
    `/facilities/${id}/timeseries`,
    {
      method: "GET",
      params,
      signal,
    }
  );
}

