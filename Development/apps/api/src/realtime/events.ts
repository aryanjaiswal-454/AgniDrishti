import { AlertSeverity, AlertStatus, PrimaryClass, SubClass } from "@agnidrishti/shared-types";

/**
 * Canonical Socket.io event channels for AgniDrishti real-time telemetry.
 */
export const REALTIME_EVENTS = {
  ALERT_CREATED: "agni:alert:created",
} as const;

export type RealtimeEventName = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

/**
 * Payload contract for high-severity alert emissions.
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

