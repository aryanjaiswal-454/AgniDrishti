import { AlertSeverity, AlertStatus, PrimaryClass, SubClass } from "@agnidrishti/shared-types";

/**
 * Real-time event constants matching AgniDrishti backend (D6.3).
 */
export const REALTIME_EVENTS = {
  ALERT_CREATED: "agni:alert:created",
} as const;

export type RealtimeEventName = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

/**
 * Payload contract for real-time high-severity alerts.
 */
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

export type ConnectionStatus = "connected" | "connecting" | "disconnected" | "degraded";

