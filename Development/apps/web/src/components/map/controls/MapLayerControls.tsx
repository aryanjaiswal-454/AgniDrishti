import React from "react";
import { BaseMapMode, MapLayerVisibility } from "../types";
import { Layers, Globe, Map as MapIcon, Moon, Grid, XCircle } from "lucide-react";

export interface MapLayerControlsProps {
  layerVisibility: MapLayerVisibility;
  onToggleLayer: (layerId: keyof MapLayerVisibility) => void;
  baseMapMode: BaseMapMode;
  onChangeBaseMapMode: (mode: BaseMapMode) => void;
  eventCount: number;
  facilityCount: number;
  anomalousCount: number;
  clusteringEnabled: boolean;
  onToggleClustering: () => void;
  hasSelection?: boolean;
  onClearSelection?: () => void;
}

export const MapLayerControls: React.FC<MapLayerControlsProps> = ({
  layerVisibility,
  onToggleLayer,
  baseMapMode,
  onChangeBaseMapMode,
  eventCount,
  facilityCount,
  anomalousCount,
  clusteringEnabled,
  onToggleClustering,
  hasSelection = false,
  onClearSelection,
}) => {
  return (
    <div
      role="toolbar"
      aria-label="Map Layer & View Controls"
      className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-1.5 p-1.5 rounded-lg bg-surface/90 backdrop-blur-md border border-border-normal shadow-lg text-xs font-mono max-w-[calc(100%-24px)]"
    >
      {/* ─── Group 1: Layers ─── */}
      <div className="flex items-center gap-1" role="group" aria-label="Layer Toggles">
        <div className="flex items-center gap-1 px-1.5 text-text-muted text-[11px] uppercase border-r border-border-subtle mr-0.5 select-none">
          <Layers className="w-3.5 h-3.5 text-brand-orange" />
          <span className="hidden sm:inline">Layers</span>
        </div>

        <button
          type="button"
          onClick={() => onToggleLayer("thermal_events")}
          aria-pressed={layerVisibility.thermal_events}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
            layerVisibility.thermal_events
              ? "bg-brand-orange/20 text-brand-orange border border-brand-orange/40 font-bold"
              : "bg-surface-2 text-text-muted border border-transparent hover:text-text-primary"
          }`}
        >
          ● Thermal ({eventCount})
        </button>

        <button
          type="button"
          onClick={() => onToggleLayer("facilities")}
          aria-pressed={layerVisibility.facilities}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
            layerVisibility.facilities
              ? "bg-intelligence-cyan/20 text-intelligence-cyan border border-intelligence-cyan/40 font-bold"
              : "bg-surface-2 text-text-muted border border-transparent hover:text-text-primary"
          }`}
        >
          ◆ Facilities ({facilityCount})
        </button>

        <button
          type="button"
          onClick={() => onToggleLayer("anomalies")}
          aria-pressed={layerVisibility.anomalies}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
            layerVisibility.anomalies
              ? "bg-status-critical/20 text-status-critical border border-status-critical/40 font-bold"
              : "bg-surface-2 text-text-muted border border-transparent hover:text-text-primary"
          }`}
        >
          ▲ Anomalies ({anomalousCount})
        </button>
      </div>

      {/* ─── Group 2: Analysis (Clustering) ─── */}
      <div className="flex items-center pl-1 border-l border-border-subtle ml-0.5">
        <button
          type="button"
          title="Toggle Spatial Event Clustering"
          onClick={onToggleClustering}
          aria-pressed={clusteringEnabled}
          className={`px-2 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
            clusteringEnabled
              ? "bg-brand-orange/20 text-brand-orange border border-brand-orange/40 font-bold"
              : "bg-surface-2 text-text-muted border border-transparent hover:text-text-primary"
          }`}
        >
          <Grid className="w-3 h-3" />
          <span className="hidden sm:inline">Clustering</span>
        </button>
      </div>

      {/* ─── Group 3: Basemap View ─── */}
      <div className="flex items-center gap-1 pl-1 border-l border-border-subtle ml-0.5">
        <button
          type="button"
          title="Dark Basemap"
          aria-label="Dark Basemap"
          onClick={() => onChangeBaseMapMode("dark")}
          className={`p-1.5 rounded transition-all ${
            baseMapMode === "dark"
              ? "bg-surface-3 text-brand-orange border border-border-normal"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          title="Satellite Imagery Basemap"
          aria-label="Satellite Imagery Basemap"
          onClick={() => onChangeBaseMapMode("satellite")}
          className={`p-1.5 rounded transition-all ${
            baseMapMode === "satellite"
              ? "bg-surface-3 text-intelligence-cyan border border-border-normal"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          title="OpenStreetMap Basemap"
          aria-label="OpenStreetMap Basemap"
          onClick={() => onChangeBaseMapMode("osm_tactical")}
          className={`p-1.5 rounded transition-all ${
            baseMapMode === "osm_tactical"
              ? "bg-surface-3 text-intelligence-cyan border border-border-normal"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ─── Group 4: Clear Selection ─── */}
      {hasSelection && onClearSelection && (
        <div className="flex items-center pl-1 border-l border-border-subtle ml-0.5">
          <button
            type="button"
            onClick={onClearSelection}
            className="px-2 py-1 rounded text-[11px] bg-surface-3 text-status-critical border border-status-critical/30 hover:bg-status-critical/10 flex items-center gap-1 transition-all"
          >
            <XCircle className="w-3 h-3" />
            <span>Clear Selection</span>
          </button>
        </div>
      )}
    </div>
  );
};
