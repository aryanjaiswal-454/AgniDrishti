import { apiClient } from "./client";
import { ApiResponse } from "./types";

export type BaseMapLayer = "dark" | "satellite" | "osm_tactical";

export interface SystemSettings {
  critical_frp_threshold: number;
  anomaly_z_score_threshold: number;
  default_map_baselayer: BaseMapLayer;
  updated_at: string;
  updated_by: string | null;
}

export interface SettingsRecalculationResult {
  events_reclassified: number;
  alerts_created: number;
  alerts_severity_updated: number;
}

export interface SystemSettingsUpdateResult {
  settings: SystemSettings;
  recalculation: SettingsRecalculationResult;
}

export function getSystemSettings(signal?: AbortSignal): Promise<ApiResponse<SystemSettings>> {
  return apiClient<ApiResponse<SystemSettings>>("/settings", { method: "GET", signal });
}

export function updateSystemSettings(
  settings: Pick<SystemSettings, "critical_frp_threshold" | "anomaly_z_score_threshold" | "default_map_baselayer">
): Promise<ApiResponse<SystemSettingsUpdateResult>> {
  return apiClient<ApiResponse<SystemSettingsUpdateResult>>("/settings", {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
}
