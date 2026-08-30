import React from "react";
import { MapLayerVisibility } from "../types";

export interface MapLegendProps {
  layerVisibility?: MapLayerVisibility;
  hasSelection?: boolean;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  layerVisibility,
  hasSelection = false,
}) => {
  const showThermal = !layerVisibility || layerVisibility.thermal_events;
  const showFacilities = !layerVisibility || layerVisibility.facilities;

  return (
    <div
      aria-label="Tactical Map Legend"
      className="absolute bottom-3 left-3 z-[1000] p-2.5 rounded-lg bg-surface/90 backdrop-blur-md border border-border-normal shadow-lg text-[11px] font-mono text-text-muted space-y-1 hidden sm:block select-none"
    >
      <div className="text-[10px] uppercase font-bold text-text-secondary">Tactical Legend</div>

      {showThermal && (
        <>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-status-critical border border-white" />
            <span>Anomalous Emission (+3σ)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-orange" />
            <span>Nominal Thermal Hotspot</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-orange border border-white/60 flex items-center justify-center text-[8px] font-bold text-white">
              +
            </span>
            <span>Spatial Event Cluster</span>
          </div>
        </>
      )}

      {showFacilities && (
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rotate-45 bg-intelligence-cyan" />
          <span>Registered Infrastructure</span>
        </div>
      )}

      {hasSelection && (
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-white bg-transparent" />
          <span>Selected Entity (Active)</span>
        </div>
      )}
    </div>
  );
};

