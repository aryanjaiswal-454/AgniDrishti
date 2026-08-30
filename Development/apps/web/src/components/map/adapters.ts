import { EventDetail } from "../../api/events";
import { Facility } from "../../api/facilities";
import { ThermalMarkerData, FacilityMarkerData } from "./types";

/**
 * Adapter: Convert raw EventDetail DTO into normalized map marker data.
 */
export function adaptThermalEventToMarker(
  event: EventDetail
): ThermalMarkerData | null {
  const lat = event.hotspot?.latitude;
  const lon = event.hotspot?.longitude;

  if (typeof lat !== "number" || typeof lon !== "number" || isNaN(lat) || isNaN(lon)) {
    return null;
  }

  return {
    id: event.id,
    lat,
    lon,
    frp: event.hotspot?.frp ?? null,
    brightness: event.hotspot?.bright_ti4 ?? null,
    primary_class: event.primary_class,
    sub_class: event.sub_class,
    confidence_score: event.confidence_score,
    is_anomalous: Boolean(event.is_anomalous),
    acquisition_date: event.hotspot?.acq_date || new Date(event.created_at).toLocaleDateString(),
    facility_name: event.facility?.name ?? null,
    facility_id: event.facility_id ?? null,
    distance_to_facility_m: event.distance_to_facility_m ?? null,
  };
}

/**
 * Adapter: Convert raw Facility DTO into normalized map marker data.
 */
export function adaptFacilityToMarker(
  facility: Facility
): FacilityMarkerData | null {
  if (!facility.geometry || !facility.geometry.coordinates) {
    return null;
  }

  let lon: number | undefined;
  let lat: number | undefined;

  if (facility.geometry.type === "Point") {
    [lon, lat] = facility.geometry.coordinates;
  } else if (
    facility.geometry.type === "Polygon" &&
    Array.isArray(facility.geometry.coordinates[0]) &&
    facility.geometry.coordinates[0].length > 0
  ) {
    // Center centroid approximation from first ring
    const ring = facility.geometry.coordinates[0];
    let sumLon = 0;
    let sumLat = 0;
    ring.forEach(([cLon, cLat]) => {
      sumLon += cLon;
      sumLat += cLat;
    });
    lon = sumLon / ring.length;
    lat = sumLat / ring.length;
  }

  if (typeof lat !== "number" || typeof lon !== "number" || isNaN(lat) || isNaN(lon)) {
    return null;
  }

  return {
    id: facility.id,
    name: facility.name || "Industrial Facility",
    facility_type: facility.facility_type,
    lat,
    lon,
    state: facility.state,
    district: facility.district,
    source: facility.source || "osm",
  };
}

