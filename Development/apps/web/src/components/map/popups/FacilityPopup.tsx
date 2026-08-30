import React from "react";
import { FacilityMarkerData } from "../types";
import { Button } from "../../ui";
import { FacilityTypeBadge } from "../../../pages/facilities/FacilityTypeBadge";
import { Building2, ExternalLink } from "lucide-react";

export interface FacilityPopupProps {
  marker: FacilityMarkerData;
  onNavigate: (route: string) => void;
}

export const FacilityPopup: React.FC<FacilityPopupProps> = ({
  marker,
  onNavigate,
}) => {
  return (
    <div className="p-3.5 space-y-3 font-mono text-xs max-w-xs text-text-primary">
      <div className="flex items-center gap-1.5 text-intelligence-cyan font-bold">
        <Building2 className="w-4 h-4 shrink-0" />
        <span className="truncate">{marker.name}</span>
      </div>

      <div className="space-y-1.5 text-[11px] text-text-secondary">
        <div className="flex items-center justify-between">
          <span>Asset Type:</span>
          <FacilityTypeBadge type={marker.facility_type} size="sm" />
        </div>

        <div className="flex items-center justify-between">
          <span>Administrative Location:</span>
          <span className="text-text-primary font-medium">
            {marker.state || "National"}{marker.district ? `, ${marker.district}` : ""}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Coordinates:</span>
          <span className="text-text-muted">
            {marker.lat.toFixed(4)}°, {marker.lon.toFixed(4)}°
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Data Provenance:</span>
          <span className="text-text-muted uppercase">{marker.source}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-border-subtle">
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          rightIcon={<ExternalLink className="w-3 h-3" />}
          onClick={() => onNavigate(`/facilities/${marker.id}`)}
        >
          Facility Intelligence
        </Button>
      </div>
    </div>
  );
};

