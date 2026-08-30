import React from "react";
import { CircleMarker, Tooltip } from "react-leaflet";
import { ClusterData } from "../types";

export interface ClusterLayerProps {
  clusters: ClusterData[];
  onSelectCluster: (cluster: ClusterData) => void;
  selectedClusterId?: string | null;
}

export const ClusterLayer: React.FC<ClusterLayerProps> = ({
  clusters,
  onSelectCluster,
  selectedClusterId,
}) => {
  return (
    <>
      {clusters.map((cluster) => {
        const isSelected = selectedClusterId === cluster.id;
        const hasAnomalies = cluster.anomalousCount > 0;
        // Radius scale based on event count (16px to 26px)
        const radius = Math.min(26, Math.max(16, Math.round(Math.log2(cluster.eventCount) * 4) + 12));

        return (
          <CircleMarker
            key={`cluster-${cluster.id}`}
            center={[cluster.lat, cluster.lon]}
            radius={radius}
            eventHandlers={{
              click: () => onSelectCluster(cluster),
            }}
            pathOptions={{
              color: isSelected ? "#FFFFFF" : hasAnomalies ? "#FF4D5A" : "#FF7A18",
              fillColor: hasAnomalies ? "#FF4D5A" : "#FF7A18",
              fillOpacity: isSelected ? 0.95 : 0.85,
              weight: isSelected ? 3 : hasAnomalies ? 2.5 : 1.5,
            }}
          >
            <Tooltip direction="top" offset={[0, -radius]} opacity={0.95} permanent={false}>
              <div className="font-mono text-xs text-center font-bold">
                <div>{cluster.eventCount} Thermal Events</div>
                {hasAnomalies && (
                  <div className="text-[#FF4D5A] font-normal text-[10px]">
                    ▲ {cluster.anomalousCount} Anomalous
                  </div>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
};

