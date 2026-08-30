import React from "react";
import { ThermalMarkerData } from "../types";
import { Button, ConfidenceIndicator } from "../../ui";
import { EventClassBadge, AnomalyBadge } from "../../../pages/events/EventClassBadge";
import { ExternalLink, Flame, MapPin, Building2 } from "lucide-react";

export interface ThermalEventPopupProps {
  marker: ThermalMarkerData;
  onNavigate: (route: string) => void;
}

export const ThermalEventPopup: React.FC<ThermalEventPopupProps> = ({
  marker,
  onNavigate,
}) => {
  return (
    <div className="p-3.5 space-y-3 font-mono text-xs max-w-xs text-text-primary">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
        <span className="font-bold text-text-primary">
          EVT-{marker.id.substring(0, 8).toUpperCase()}
        </span>
        <AnomalyBadge isAnomalous={marker.is_anomalous} size="sm" />
      </div>

      {/* Metrics & Context */}
      <div className="space-y-1.5 text-[11px] text-text-secondary">
        <div className="flex items-center justify-between">
          <span>Classification:</span>
          <EventClassBadge primaryClass={marker.primary_class} subClass={marker.sub_class} size="sm" />
        </div>

        <div className="flex items-center justify-between">
          <span>AI Confidence:</span>
          <ConfidenceIndicator score={marker.confidence_score} size="sm" />
        </div>

        <div className="flex items-center justify-between">
          <span>Thermal Power (FRP):</span>
          <span className="text-brand-orange font-bold">
            {marker.frp !== null ? `${marker.frp} MW` : "N/A"}
          </span>
        </div>

        {marker.facility_name && (
          <div className="flex items-center justify-between">
            <span>Nearby Asset:</span>
            <span className="text-text-primary font-semibold truncate max-w-[140px]">
              {marker.facility_name}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span>Coordinates:</span>
          <span className="text-text-muted">
            {marker.lat.toFixed(4)}°, {marker.lon.toFixed(4)}°
          </span>
        </div>
      </div>

      {/* Deep Link Action */}
      <div className="pt-2 border-t border-border-subtle flex flex-col gap-1.5">
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          rightIcon={<ExternalLink className="w-3 h-3" />}
          onClick={() => onNavigate(`/events/${marker.id}`)}
        >
          Investigate Event
        </Button>

        {marker.facility_id && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            rightIcon={<ExternalLink className="w-3 h-3" />}
            onClick={() => onNavigate(`/facilities/${marker.facility_id}`)}
          >
            View Facility
          </Button>
        )}
      </div>
    </div>
  );
};

