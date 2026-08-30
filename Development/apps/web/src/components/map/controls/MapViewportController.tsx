import React, { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { DEFAULT_INDIA_VIEWPORT } from "../mapConfig";
import { RotateCcw } from "lucide-react";

export interface MapViewportControllerProps {
  onZoomChange?: (zoom: number) => void;
  clusterFitBounds?: [[number, number], [number, number]] | null;
  onClusterFitComplete?: () => void;
}

export const MapViewportController: React.FC<MapViewportControllerProps> = ({
  onZoomChange,
  clusterFitBounds,
  onClusterFitComplete,
}) => {
  const map = useMap();

  useMapEvents({
    zoomend: () => {
      if (onZoomChange) {
        onZoomChange(map.getZoom());
      }
    },
  });

  useEffect(() => {
    if (clusterFitBounds) {
      map.fitBounds(clusterFitBounds, { padding: [40, 40], maxZoom: 13 });
      if (onClusterFitComplete) {
        onClusterFitComplete();
      }
    }
  }, [clusterFitBounds, map, onClusterFitComplete]);

  const handleResetView = () => {
    map.setView(DEFAULT_INDIA_VIEWPORT.center, DEFAULT_INDIA_VIEWPORT.zoom, {
      animate: true,
    });
  };

  return (
    <div className="absolute top-16 right-3 z-[1000]">
      <button
        type="button"
        title="Reset Map to National View"
        onClick={handleResetView}
        className="p-2 rounded-lg bg-surface/90 backdrop-blur-md border border-border-normal text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all shadow-md"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
};

