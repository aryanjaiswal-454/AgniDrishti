import React from "react";
import { CircleMarker, Tooltip, Popup } from "react-leaflet";
import { FacilityMarkerData } from "../types";
import { FacilityPopup } from "../popups/FacilityPopup";

export interface FacilityLayerProps {
  markers: FacilityMarkerData[];
  onNavigate: (route: string) => void;
  onSelectFacility?: (marker: FacilityMarkerData) => void;
  selectedFacilityId?: string | null;
  usePopups?: boolean;
}

export const FacilityLayer: React.FC<FacilityLayerProps> = ({
  markers,
  onNavigate,
  onSelectFacility,
  selectedFacilityId,
  usePopups = true,
}) => {
  return (
    <>
      {markers.map((marker) => {
        const isSelected = selectedFacilityId === marker.id;
        const radius = isSelected ? 10 : 7;

        return (
          <CircleMarker
            key={`facility-marker-${marker.id}`}
            center={[marker.lat, marker.lon]}
            radius={radius}
            eventHandlers={{
              click: () => {
                if (onSelectFacility) {
                  onSelectFacility(marker);
                }
              },
            }}
            pathOptions={{
              color: isSelected ? "#FFFFFF" : "#31C7D4",
              fillColor: "#31C7D4",
              fillOpacity: isSelected ? 1 : 0.85,
              weight: isSelected ? 3 : 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={0.9}>
              <span className="font-mono text-xs">
                ◆ {marker.name} ({marker.facility_type.toUpperCase()})
              </span>
            </Tooltip>

            {usePopups && (
              <Popup>
                <FacilityPopup marker={marker} onNavigate={onNavigate} />
              </Popup>
            )}
          </CircleMarker>
        );
      })}
    </>
  );
};

