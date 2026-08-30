import { apiClient } from "./client";
import { IngestionTelemetryResponse, ApiResponse } from "./types";

/**
 * Fetch health and telemetry status of NASA FIRMS and OpenStreetMap ingestion queues.
 */
export async function getIngestionStatus(
  signal?: AbortSignal
): Promise<ApiResponse<IngestionTelemetryResponse>> {
  return apiClient<ApiResponse<IngestionTelemetryResponse>>("/ingestion/status", {
    method: "GET",
    signal,
  });
}

/**
 * Trigger manual or ad-hoc NASA FIRMS polling job (requires admin role).
 */
export async function triggerFirmsIngestion(
  asyncMode = true
): Promise<ApiResponse<{ message: string; jobId?: string }>> {
  return apiClient<ApiResponse<{ message: string; jobId?: string }>>(
    `/ingestion/firms/trigger?async=${asyncMode}`,
    {
      method: "POST",
    }
  );
}

/**
 * Trigger manual or ad-hoc OpenStreetMap Overpass sync job (requires admin role).
 */
export async function triggerOsmSync(
  asyncMode = true
): Promise<ApiResponse<{ message: string; jobId?: string }>> {
  return apiClient<ApiResponse<{ message: string; jobId?: string }>>(
    `/ingestion/osm/trigger?async=${asyncMode}`,
    {
      method: "POST",
    }
  );
}

