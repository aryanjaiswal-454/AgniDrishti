/**
 * @agnidrishti/shared-types
 *
 * Shared TypeScript type definitions for the AgniDrishti platform.
 * Provides the single source of truth for data models, API contracts,
 * and AI/ML inference outputs across the monorepo.
 */

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

export interface HealthCheckResponse {
  status: "ok" | "error";
  service: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Enumerations & Domain Types
// ---------------------------------------------------------------------------

/**
 * User roles for Role-Based Access Control (RBAC).
 */
export type UserRole = "admin" | "analyst" | "viewer";

/**
 * Industrial facility categories mapped from OpenStreetMap and industrial registries.
 * Aligned with platform problem statement requirements.
 */
export type FacilityType =
  | "refinery"
  | "petrochemical"
  | "power_plant"
  | "steel"
  | "mining"
  | "lng_terminal"
  | "other_industrial";

/**
 * Primary segregation classification (Official Deliverable #1).
 */
export type PrimaryClass = "industrial" | "natural";

/**
 * Granular sub-classifications for industrial and natural thermal sources.
 */
export type SubClass =
  | "industrial_fire"
  | "gas_flare"
  | "agricultural_burning"
  | "mining_activity"
  | "forest_fire"
  | "other_natural"
  | "unclassified";

/**
 * Land cover classes derived from satellite rasters (ESA WorldCover / Bhuvan LULC).
 */
export type LandCoverType =
  | "forest"
  | "cropland"
  | "built_up"
  | "bare"
  | "grassland";

/**
 * Satellite sensor instrument codes from NASA FIRMS.
 */
export type InstrumentType = "MODIS" | "VIIRS";

/**
 * Satellite detection day or night flag.
 */
export type DayNight = "D" | "N";

/**
 * Real-time alert severity levels.
 */
export type AlertSeverity = "high" | "medium" | "low";

/**
 * Lifecycle status of an alert.
 */
export type AlertStatus =
  | "new"
  | "acknowledged"
  | "resolved"
  | "false_positive";

// ---------------------------------------------------------------------------
// Database Entities (System of Record)
// ---------------------------------------------------------------------------

/**
 * Authenticated system user.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  created_at: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * GeoJSON Geometry representation for spatial columns.
 */
export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: [number, number][][];
}

export type GeoJSONGeometry = GeoJSONPoint | GeoJSONPolygon;

/**
 * Known industrial facility ingested from OSM / industrial registry.
 */
export interface Facility {
  id: string;
  osm_id: string;
  name: string | null;
  facility_type: FacilityType;
  geometry: GeoJSONGeometry;
  state: string | null;
  district: string | null;
  source: string;
  last_synced_at: string | null;
}

/**
 * Raw NASA FIRMS thermal anomaly / active fire detection record.
 */
export interface Hotspot {
  id: string;
  latitude: number;
  longitude: number;
  geometry?: GeoJSONPoint;
  acq_date: string; // YYYY-MM-DD
  acq_time: string; // HHMM UTC
  satellite: string;
  instrument: InstrumentType;
  confidence: string;
  frp: number | null; // Fire Radiative Power (MW)
  bright_ti4: number | null; // Brightness temperature Kelvin
  daynight: DayNight;
  raw_payload?: Record<string, unknown>;
  ingested_at: string;
}

/**
 * Classified thermal event output linking raw hotspot to AI/ML inference.
 */
export interface ClassifiedEvent {
  id: string;
  hotspot_id: string;
  facility_id: string | null;
  primary_class: PrimaryClass;
  sub_class: SubClass;
  land_cover_type: LandCoverType | null;
  distance_to_facility_m: number | null;
  recurrence_count_90d: number | null;
  z_score_frp: number | null;
  confidence_score: number; // 0.0 to 1.0
  model_version: string;
  is_anomalous: boolean;
  created_at: string;
}

/**
 * Rolling historical baseline stats computed per facility.
 */
export interface FacilityBaseline {
  id: string;
  facility_id: string;
  avg_daily_detections: number;
  avg_frp: number;
  std_dev_frp: number;
  window_start: string; // YYYY-MM-DD
  window_end: string; // YYYY-MM-DD
  updated_at: string;
}

/**
 * High-priority notification alert for anomalous/high-severity fire events.
 */
export interface Alert {
  id: string;
  classified_event_id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  sent_at: string;
  acknowledged_by: string | null;
}

/**
 * Human-in-the-loop analyst feedback on model classifications for retraining.
 */
export interface Feedback {
  id: string;
  classified_event_id: string;
  user_id: string;
  corrected_label: string;
  notes: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Shared AI/ML Output Contract
// ---------------------------------------------------------------------------

/**
 * Shared output JSON format emitted by Track A and Track B Python modules.
 * Merged and consumed in Phase D7.
 */
/**
 * Standard pagination metadata envelope.
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * High-level aggregated command center telemetry summary.
 */
export interface DashboardSummary {
  total_hotspots_24h: number;
  total_classified_events: number;
  active_alerts: number;
  total_facilities: number;
  industrial_events_24h?: number;
  natural_events_24h?: number;
}

export interface AIModelOutputRecord {
  hotspot_id: string;
  latitude: number;
  longitude: number;
  primary_class: PrimaryClass | null;
  sub_class: SubClass | null;
  land_cover_type: LandCoverType | null;
  facility_id: string | null;
  distance_to_facility_m: number | null;
  recurrence_count_90d: number | null;
  z_score_frp: number | null;
  is_anomalous: boolean;
  confidence_score: number;
  model_version: string;
}

