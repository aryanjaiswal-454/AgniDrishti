import React, { useMemo } from "react";
import { Polyline, Marker } from "react-leaflet";
import L from "leaflet";
import { ThermalMarkerData, FacilityMarkerData } from "../types";

export interface EventSpatialRelationLineProps {
  eventMarker: ThermalMarkerData;
  facilityMarkers: FacilityMarkerData[];
}

/**
 * Renders a dashed connection line between a selected thermal event
 * and its linked facility on the map.
 *
 * Shows only when both event and facility positions are valid.
 * Includes a midpoint distance label.
 */
export const EventSpatialRelationLine: React.FC<EventSpatialRelationLineProps> = ({
  eventMarker,
  facilityMarkers,
}) => {
  // Find the linked facility marker
  const linkedFacility = useMemo(() => {
    if (!eventMarker.facility_id) return null;
    return facilityMarkers.find((f) => f.id === eventMarker.facility_id) || null;
  }, [eventMarker.facility_id, facilityMarkers]);

  if (!linkedFacility) return null;

  const eventPos: [number, number] = [eventMarker.lat, eventMarker.lon];
  const facilityPos: [number, number] = [linkedFacility.lat, linkedFacility.lon];

  // Midpoint for distance label
  const midLat = (eventMarker.lat + linkedFacility.lat) / 2;
  const midLon = (eventMarker.lon + linkedFacility.lon) / 2;

  // Distance text
  const distanceText =
    eventMarker.distance_to_facility_m !== null
      ? `~${Math.round(eventMarker.distance_to_facility_m)} m`
      : "";

  // DivIcon for midpoint distance label
  const distanceIcon = useMemo(() => {
    if (!distanceText) return null;
    return L.divIcon({
      className: "",
      html: `<div style="
        background: rgba(16, 21, 28, 0.9);
        border: 1px solid rgba(49, 199, 212, 0.4);
        border-radius: 4px;
        padding: 2px 6px;
        font-family: 'JetBrains Mono', 'SF Mono', monospace;
        font-size: 10px;
        color: #31C7D4;
        white-space: nowrap;
        pointer-events: none;
        font-weight: 600;
      ">${distanceText}</div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  }, [distanceText]);

  return (
    <>
      {/* Dashed connection line */}
      <Polyline
        positions={[eventPos, facilityPos]}
        pathOptions={{
          color: "#31C7D4",
          weight: 1.5,
          opacity: 0.55,
          dashArray: "6 4",
        }}
      />

      {/* Midpoint distance label */}
      {distanceIcon && (
        <Marker
          position={[midLat, midLon]}
          icon={distanceIcon}
          interactive={false}
        />
      )}
    </>
  );
};

