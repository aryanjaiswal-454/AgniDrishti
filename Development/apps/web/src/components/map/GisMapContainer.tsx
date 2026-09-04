import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { EventDetail } from "../../api/events";
import { Facility } from "../../api/facilities";
import { BaseMapMode, MapLayerVisibility, MapSelection, ThermalMarkerData, FacilityMarkerData, ClusterData } from "./types";
import { BASEMAP_CONFIGS, DEFAULT_INDIA_VIEWPORT } from "./mapConfig";
import { adaptThermalEventToMarker, adaptFacilityToMarker } from "./adapters";
import { clusterThermalEvents } from "./clustering";
import { ThermalEventLayer } from "./layers/ThermalEventLayer";
import { FacilityLayer } from "./layers/FacilityLayer";
import { ClusterLayer } from "./layers/ClusterLayer";
import { EventSpatialRelationLine } from "./layers/EventSpatialRelationLine";
import { MapLayerControls } from "./controls/MapLayerControls";
import { MapLegend } from "./controls/MapLegend";
import { MapViewportController } from "./controls/MapViewportController";
import { MapInvestigationDrawer } from "./panels/MapInvestigationDrawer";
import { Skeleton } from "../ui";
import { Maximize2, Minimize2 } from "lucide-react";
import { useSystemSettings } from "../../hooks/useSettings";

export interface GisMapContainerProps {
  events: EventDetail[];
  facilities: Facility[];
  isLoading?: boolean;
  onNavigate: (route: string) => void;
  anomaliesOnlyFilter?: boolean;
  className?: string;
  minHeight?: string;
  enableInvestigationPanel?: boolean;
}

export const GisMapContainer: React.FC<GisMapContainerProps> = ({
  events,
  facilities,
  isLoading = false,
  onNavigate,
  anomaliesOnlyFilter = false,
  className = "",
  minHeight = "min-h-[480px] lg:min-h-[580px]",
  enableInvestigationPanel = true,
}) => {
  const [baseMapMode, setBaseMapMode] = useState<BaseMapMode>("satellite");
  const { data: settingsRes } = useSystemSettings();
  const configuredBaseMap = settingsRes?.data.default_map_baselayer;
  const [clusteringEnabled, setClusteringEnabled] = useState<boolean>(false);
  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_INDIA_VIEWPORT.zoom);
  const [selection, setSelection] = useState<MapSelection>(null);
  const [clusterFitBounds, setClusterFitBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapShellRef = useRef<HTMLDivElement>(null);

  const [layerVisibility, setLayerVisibility] = useState<MapLayerVisibility>({
    thermal_events: true,
    facilities: true,
    anomalies: anomaliesOnlyFilter,
  });

  // The global admin preference applies immediately to every mounted map.
  useEffect(() => {
    if (configuredBaseMap) setBaseMapMode(configuredBaseMap);
  }, [configuredBaseMap]);

  // 1. Transform raw DTOs into normalized map markers
  const thermalMarkers = useMemo(() => {
    return events
      .map(adaptThermalEventToMarker)
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [events]);

  const facilityMarkers = useMemo(() => {
    return facilities
      .map(adaptFacilityToMarker)
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [facilities]);

  // 2. Filter thermal markers based on layer settings
  const filteredThermalMarkers = useMemo(() => {
    if (!layerVisibility.thermal_events) return [];
    if (layerVisibility.anomalies || anomaliesOnlyFilter) {
      return thermalMarkers.filter((m) => m.is_anomalous);
    }
    return thermalMarkers;
  }, [thermalMarkers, layerVisibility.thermal_events, layerVisibility.anomalies, anomaliesOnlyFilter]);

  // 3. Perform spatial clustering on visible thermal events
  const { singleEvents, clusters } = useMemo(() => {
    return clusterThermalEvents(filteredThermalMarkers, currentZoom, clusteringEnabled);
  }, [filteredThermalMarkers, currentZoom, clusteringEnabled]);

  // Clear stale selection when underlying data changes (e.g. filter removed selected item)
  useEffect(() => {
    if (!selection) return;
    if (selection.type === "event") {
      const stillExists = filteredThermalMarkers.some((m) => m.id === selection.data.id);
      if (!stillExists) setSelection(null);
    } else if (selection.type === "facility") {
      const stillExists = facilityMarkers.some((m) => m.id === selection.data.id);
      if (!stillExists) setSelection(null);
    }
  }, [filteredThermalMarkers, facilityMarkers, selection]);

  const displayedFacilityMarkers = useMemo(() => {
    if (!layerVisibility.facilities) return [];
    return facilityMarkers;
  }, [facilityMarkers, layerVisibility.facilities]);

  const handleToggleLayer = (layerId: keyof MapLayerVisibility) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  const handleSelectEvent = useCallback((marker: ThermalMarkerData) => {
    if (enableInvestigationPanel) {
      setSelection({ type: "event", data: marker });
    }
  }, [enableInvestigationPanel]);

  const handleSelectFacility = useCallback((marker: FacilityMarkerData) => {
    if (enableInvestigationPanel) {
      setSelection({ type: "facility", data: marker });
    }
  }, [enableInvestigationPanel]);

  const handleSelectCluster = useCallback((cluster: ClusterData) => {
    if (enableInvestigationPanel) {
      setSelection({ type: "cluster", data: cluster });
    }
  }, [enableInvestigationPanel]);

  const handleZoomToCluster = useCallback((bounds: [[number, number], [number, number]]) => {
    setClusterFitBounds(bounds);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    const mapShell = mapShellRef.current;
    if (!mapShell) return;

    try {
      if (document.fullscreenElement === mapShell) {
        await document.exitFullscreen();
      } else {
        await mapShell.requestFullscreen();
      }
    } catch {
      // Fullscreen can be denied by browser permissions or embedded contexts.
      // The map remains usable in its normal layout when that happens.
    }
  }, []);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === mapShellRef.current);
      // Leaflet listens for resize; this ensures its canvas measures the new
      // fullscreen dimensions after the browser transition completes.
      window.setTimeout(() => window.dispatchEvent(new Event("resize")), 0);
    };

    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  const currentTileConfig = BASEMAP_CONFIGS[baseMapMode];
  const anomalousCount = thermalMarkers.filter((m) => m.is_anomalous).length;

  if (isLoading && thermalMarkers.length === 0 && facilityMarkers.length === 0) {
    return (
      <div className={`relative w-full z-10 ${minHeight} rounded-xl overflow-hidden border border-border-subtle bg-surface-1 ${className}`}>
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  return (
    <div
      ref={mapShellRef}
      className={`relative w-full z-10 overflow-hidden border border-border-subtle bg-surface-1 shadow-sm ${
        isFullscreen ? "h-screen max-h-none rounded-none" : `${minHeight} rounded-xl`
      } ${className}`}
    >
      {/* Tactical Map Layer Controls */}
      <MapLayerControls
        layerVisibility={layerVisibility}
        onToggleLayer={handleToggleLayer}
        baseMapMode={baseMapMode}
        onChangeBaseMapMode={setBaseMapMode}
        eventCount={filteredThermalMarkers.length}
        facilityCount={displayedFacilityMarkers.length}
        anomalousCount={anomalousCount}
        clusteringEnabled={clusteringEnabled}
        onToggleClustering={() => setClusteringEnabled((prev) => !prev)}
        hasSelection={Boolean(selection)}
        onClearSelection={handleClearSelection}
      />

      <button
        type="button"
        title={isFullscreen ? "Exit Fullscreen Map (Esc)" : "View Map Fullscreen"}
        aria-label={isFullscreen ? "Exit fullscreen map" : "View map fullscreen"}
        aria-pressed={isFullscreen}
        onClick={handleToggleFullscreen}
        className="absolute bottom-3 right-3 z-[1100] flex h-10 w-10 items-center justify-center rounded-lg border border-border-normal bg-surface/90 text-intelligence-cyan shadow-lg backdrop-blur-md transition-colors hover:bg-surface-3 hover:text-white focus:outline-none focus:ring-2 focus:ring-intelligence-cyan"
      >
        {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
      </button>

      {/* Map Legend */}
      <MapLegend
        layerVisibility={layerVisibility}
        hasSelection={Boolean(selection)}
      />

      {/* Slide-in Spatial Investigation Side Drawer */}
      {enableInvestigationPanel && (
        <MapInvestigationDrawer
          selection={selection}
          onClose={handleClearSelection}
          onNavigate={onNavigate}
          onZoomCluster={handleZoomToCluster}
        />
      )}

      {/* Map Viewport Container */}
      <MapContainer
        center={DEFAULT_INDIA_VIEWPORT.center}
        zoom={DEFAULT_INDIA_VIEWPORT.zoom}
        scrollWheelZoom={true}
        className={`w-full h-full ${minHeight}`}
        attributionControl={true}
      >
        {/* Basemap Tile Layer */}
        <TileLayer
          key={`tile-layer-${baseMapMode}`}
          url={currentTileConfig.url}
          attribution={currentTileConfig.attribution}
          maxZoom={currentTileConfig.maxZoom}
          subdomains={currentTileConfig.subdomains || "abc"}
        />

        {/* Viewport Recentering & Zoom Tracking Controller */}
        <MapViewportController
          onZoomChange={setCurrentZoom}
          clusterFitBounds={clusterFitBounds}
          onClusterFitComplete={() => setClusterFitBounds(null)}
        />

        {/* Spatial Relationship Vector (Selected Event -> Linked Facility) */}
        {selection?.type === "event" && selection.data.facility_id && layerVisibility.facilities && (
          <EventSpatialRelationLine
            eventMarker={selection.data}
            facilityMarkers={displayedFacilityMarkers}
          />
        )}

        {/* Facility Markers Layer */}
        <FacilityLayer
          markers={displayedFacilityMarkers}
          onNavigate={onNavigate}
          onSelectFacility={handleSelectFacility}
          selectedFacilityId={selection?.type === "facility" ? selection.data.id : null}
          usePopups={!enableInvestigationPanel}
        />

        {/* Spatial Cluster Markers Layer */}
        <ClusterLayer
          clusters={clusters}
          onSelectCluster={handleSelectCluster}
          selectedClusterId={selection?.type === "cluster" ? selection.data.id : null}
        />

        {/* Thermal Hotspots & Anomalies Layer */}
        <ThermalEventLayer
          markers={singleEvents}
          onNavigate={onNavigate}
          onSelectEvent={handleSelectEvent}
          selectedEventId={selection?.type === "event" ? selection.data.id : null}
          usePopups={!enableInvestigationPanel}
        />
      </MapContainer>
    </div>
  );
};

