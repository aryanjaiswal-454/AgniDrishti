import { apiClient, buildQueryString } from "./client";
import { DashboardSummary, ExportFilterParams, ApiResponse } from "./types";

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL || "") + "/api/v1";

/**
 * Fetch aggregated Command Center dashboard telemetry and statistics.
 */
export async function getDashboardSummary(
  signal?: AbortSignal
): Promise<ApiResponse<DashboardSummary>> {
  return apiClient<ApiResponse<DashboardSummary>>("/dashboard/summary", {
    method: "GET",
    signal,
  });
}

/**
 * Build the full download URL for exporting classified events as CSV or JSON.
 */
export function getExportDownloadUrl(params?: ExportFilterParams): string {
  const query = buildQueryString(params);
  return `${API_BASE_URL}/export${query}`;
}

