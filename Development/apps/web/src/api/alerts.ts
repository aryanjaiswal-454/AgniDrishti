import { apiClient } from "./client";
import { Alert, AlertFilterParams, AlertStatus, ClassifiedEvent, PaginatedResponse, ApiResponse } from "./types";

export interface AlertWithDetails extends Alert {
  event?: Partial<ClassifiedEvent> & {
    facility_name?: string;
    latitude?: number;
    longitude?: number;
    frp?: number;
  };
  acknowledged_by_name?: string;
}

/**
 * Query real-time threat alerts by severity or lifecycle status.
 */
export async function getAlerts(
  params?: AlertFilterParams,
  signal?: AbortSignal
): Promise<PaginatedResponse<AlertWithDetails>> {
  return apiClient<PaginatedResponse<AlertWithDetails>>("/alerts", {
    method: "GET",
    params,
    signal,
  });
}

/**
 * Fetch a specific threat alert by UUID.
 */
export async function getAlertById(
  id: string,
  signal?: AbortSignal
): Promise<ApiResponse<AlertWithDetails>> {
  return apiClient<ApiResponse<AlertWithDetails>>(`/alerts/${id}`, {
    method: "GET",
    signal,
  });
}

/**
 * Update the lifecycle status of an alert (acknowledge, resolve, or mark false positive).
 */
export async function updateAlertStatus(
  id: string,
  status: AlertStatus
): Promise<ApiResponse<Alert>> {
  return apiClient<ApiResponse<Alert>>(`/alerts/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

