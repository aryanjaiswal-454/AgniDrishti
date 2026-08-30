import React from "react";
import { CircleMarker, Tooltip, Popup } from "react-leaflet";
import { ThermalMarkerData } from "../types";
import { ThermalEventPopup } from "../popups/ThermalEventPopup";

export interface ThermalEventLayerProps {
  markers: ThermalMarkerData[];
  onNavigate: (route: string) => void;
  onSelectEvent?: (marker: ThermalMarkerData) => void;
  selectedEventId?: string | null;
  usePopups?: boolean;
}

export const ThermalEventLayer: React.FC<ThermalEventLayerProps> = ({
  markers,
  onNavigate,
  onSelectEvent,
  selectedEventId,
  usePopups = true,
}) => {
  const hasActiveSelection = Boolean(selectedEventId);

  return (
    <>
      {markers.map((marker) => {
        const isAnomalous = marker.is_anomalous;
        const isSelected = selectedEventId === marker.id;
        const frp = marker.frp || 20;
        // Scale marker radius modestly based on Fire Radiative Power (6 to 14px)
        const baseRadius = Math.min(14, Math.max(6, Math.round(frp / 25) + 6));
        const radius = isSelected ? baseRadius + 3 : baseRadius;

        // Visual emphasis / dimming pathOptions
        let strokeColor: string;
        let fillColor: string;
        let fillOpacity: number;
        let weight: number;

        if (isSelected) {
          strokeColor = "#FFFFFF";
          fillColor = isAnomalous ? "#FF4D5A" : "#FFB547";
          fillOpacity = 1;
          weight = 3;
        } else if (hasActiveSelection) {
          strokeColor = isAnomalous ? "rgba(255, 77, 90, 0.45)" : "rgba(255, 122, 24, 0.4)";
          fillColor = isAnomalous ? "rgba(255, 77, 90, 0.45)" : "rgba(255, 181, 71, 0.4)";
          fillOpacity = 0.4;
          weight = 1;
        } else {
          strokeColor = isAnomalous ? "#FF4D5A" : "#FF7A18";
          fillColor = isAnomalous ? "#FF4D5A" : "#FFB547";
          fillOpacity = isAnomalous ? 0.95 : 0.8;
          weight = isAnomalous ? 2.5 : 1.5;
        }

        return (
          <CircleMarker
            key={`thermal-marker-${marker.id}`}
            center={[marker.lat, marker.lon]}
            radius={radius}
            eventHandlers={{
              click: () => {
                if (onSelectEvent) {
                  onSelectEvent(marker);
                }
              },
            }}
            pathOptions={{
              color: strokeColor,
              fillColor: fillColor,
              fillOpacity: fillOpacity,
              weight: weight,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={0.9}>
              <span className="font-mono text-xs">
                {isAnomalous ? "▲ ANOMALY: " : ""}
                {marker.sub_class ? marker.sub_class.replace("_", " ").toUpperCase() : "THERMAL HOTSPOT"}
                {marker.frp ? ` • ${marker.frp} MW` : ""}
              </span>
            </Tooltip>

            {usePopups && (
              <Popup>
                <ThermalEventPopup marker={marker} onNavigate={onNavigate} />
              </Popup>
            )}
          </CircleMarker>
        );
      })}
    </>
  );
};

