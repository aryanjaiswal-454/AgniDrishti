import {
  User,
  UserRole,
  Facility,
  FacilityType,
  FacilityBaseline,
  Hotspot,
  InstrumentType,
  DayNight,
  ClassifiedEvent,
  PrimaryClass,
  SubClass,
  Alert,
  AlertSeverity,
  AlertStatus,
  Feedback,
  PaginationMeta,
} from "@agnidrishti/shared-types";

// Re-export domain models from @agnidrishti/shared-types
export type {
  User,
  UserRole,
  Facility,
  FacilityType,
  FacilityBaseline,
  Hotspot,
  InstrumentType,
  DayNight,
  ClassifiedEvent,
  PrimaryClass,
  SubClass,
  Alert,
  AlertSeverity,
  AlertStatus,
  Feedback,
  PaginationMeta,
};

export interface DashboardSummary {
  metrics: {
    total_hotspots: number;
    total_classified_events: number;
    industrial_fires_count: number;
    persistent_sources_count: number;
    natural_fires_count: number;
    anomalous_events_count: number;
    active_alerts_count: number;
    high_severity_alerts_count: number;
  };
  breakdown_by_class: Array<{
    sub_class: string;
    count: number;
  }>;
  recent_events: Array<{
    id: string;
    primary_class: PrimaryClass;
    sub_class: SubClass;
    facility_name: string | null;
    latitude: number;
    longitude: number;
    frp: number | null;
    confidence_score: number;
    is_anomalous: boolean;
    created_at: string;
  }>;
  pipeline_metadata?: { version: string; strategy: string; anomaly_threshold: string; };
}

/**
 * Standard AgniDrishti API Envelopes
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Filter and pagination query parameters
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface FacilityFilterParams extends PaginationParams {
  facility_type?: FacilityType;
  state?: string;
  district?: string;
  search?: string;
  bbox?: string; // minLon,minLat,maxLon,maxLat
}

export interface HotspotFilterParams extends PaginationParams {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  instrument?: InstrumentType;
  satellite?: string;
  daynight?: DayNight;
  bbox?: string;
}

export interface EventFilterParams extends PaginationParams {
  primary_class?: PrimaryClass;
  sub_class?: SubClass;
  facility_id?: string;
  state?: string;
  district?: string;
  is_anomalous?: boolean;
  min_confidence?: number;
  startDate?: string;
  endDate?: string;
  bbox?: string;
}

export interface AlertFilterParams extends PaginationParams {
  severity?: AlertSeverity;
  status?: AlertStatus;
}

export interface ExportFilterParams {
  format?: "json" | "csv";
  primary_class?: PrimaryClass;
  sub_class?: SubClass;
  state?: string;
  district?: string;
  startDate?: string;
  endDate?: string;
}

export interface FacilityTimeseriesPoint {
  date: string;
  avg_frp: number;
  max_frp: number;
  detections_count: number;
  anomalous_count: number;
}

export interface FacilityDetail extends Facility {
  baseline?: FacilityBaseline | null;
  total_events?: number;
  anomalous_events_count?: number;
}

export interface IngestionTelemetryResponse {
  firms: {
    last_ingestion: string | null;
    total_ingested_24h: number;
    status: "active" | "idle" | "error";
  };
  osm: {
    last_sync: string | null;
    total_facilities_indexed: number;
    status: "active" | "idle" | "error";
  };
  queues: {
    firms: { waiting: number; active: number; failed: number };
    osm: { waiting: number; active: number; failed: number };
    classification: { waiting: number; active: number; failed: number };
  };
}

