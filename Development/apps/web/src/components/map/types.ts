import { PrimaryClass, SubClass, FacilityType } from "../../api/types";

export type BaseMapMode = "dark" | "satellite" | "osm_tactical";

export interface MapViewport {
  center: [number, number]; // [lat, lon]
  zoom: number;
}

export type MapLayerId = "thermal_events" | "facilities" | "anomalies";

export interface MapLayerVisibility {
  thermal_events: boolean;
  facilities: boolean;
  anomalies: boolean;
}

export interface ThermalMarkerData {
  id: string;
  lat: number;
  lon: number;
  frp: number | null;
  brightness: number | null;
  primary_class: PrimaryClass;
  sub_class: SubClass;
  confidence_score: number;
  is_anomalous: boolean;
  acquisition_date: string;
  facility_name: string | null;
  facility_id: string | null;
  distance_to_facility_m: number | null;
}

export interface FacilityMarkerData {
  id: string;
  name: string;
  facility_type: FacilityType;
  lat: number;
  lon: number;
  state: string | null;
  district: string | null;
  source: string;
}

export interface ClusterData {
  id: string;
  lat: number;
  lon: number;
  eventCount: number;
  anomalousCount: number;
  events: ThermalMarkerData[];
  bounds: [[number, number], [number, number]]; // [[minLat, minLon], [maxLat, maxLon]]
}

export type MapSelection =
  | { type: "event"; data: ThermalMarkerData }
  | { type: "facility"; data: FacilityMarkerData }
  | { type: "cluster"; data: ClusterData }
  | null;


