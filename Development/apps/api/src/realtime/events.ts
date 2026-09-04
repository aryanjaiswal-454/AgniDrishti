import { AlertSeverity, AlertStatus, PrimaryClass, SubClass } from "@agnidrishti/shared-types";

export const REALTIME_EVENTS = {
  ALERT_CREATED: "agni:alert:created",
  CLASSIFIED_EVENT_CREATED: "agni:classified-event:created",
  FACILITIES_SYNCED: "agni:facilities:synced",
  SYSTEM_SETTINGS_UPDATED: "agni:system-settings:updated",
} as const;

export type RealtimeEventName = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

export interface AlertCreatedPayload {
  id: string;
  classified_event_id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  sent_at: string;
  acknowledged_by?: string | null;
  event?: {
    id?: string;
    primary_class?: PrimaryClass | string;
    sub_class?: SubClass | string;
    confidence_score?: number;
    is_anomalous?: boolean;
    facility_name?: string | null;
    latitude?: number;
    longitude?: number;
    frp?: number;
  };
}

export interface ClassifiedEventCreatedPayload {
  classified_event_id: string;
  hotspot_id: string;
  primary_class: PrimaryClass | string;
  sub_class: SubClass | string;
  is_anomalous: boolean;
  created_at: string;
}

export interface FacilitiesSyncedPayload {
  features_fetched: number;
  facilities_upserted: number;
  invalid_features: number;
  duration_ms: number;
  synced_at: string;
}

export interface SystemSettingsUpdatedPayload {
  critical_frp_threshold: number;
  anomaly_z_score_threshold: number;
  default_map_baselayer: "dark" | "satellite" | "osm_tactical";
  updated_at: string;
}
