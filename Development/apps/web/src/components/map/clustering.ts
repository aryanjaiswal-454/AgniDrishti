import { ThermalMarkerData, ClusterData } from "./types";

export interface ClusterResult {
  singleEvents: ThermalMarkerData[];
  clusters: ClusterData[];
}

/**
 * Lightweight, fast grid-based spatial clustering for thermal events.
 * No heavy external clustering dependencies required.
 */
export function clusterThermalEvents(
  markers: ThermalMarkerData[],
  zoom: number,
  enabled: boolean = true
): ClusterResult {
  if (!enabled || zoom >= 10 || markers.length <= 1) {
    return {
      singleEvents: markers,
      clusters: [],
    };
  }

  // Calculate dynamic grid size based on current zoom level
  const gridSize = 180 / Math.pow(2, zoom) * 0.45;
  const gridMap = new Map<string, ThermalMarkerData[]>();

  for (const marker of markers) {
    const gridX = Math.floor((marker.lon + 180) / gridSize);
    const gridY = Math.floor((marker.lat + 90) / gridSize);
    const key = `${gridX}:${gridY}`;

    const existing = gridMap.get(key);
    if (existing) {
      existing.push(marker);
    } else {
      gridMap.set(key, [marker]);
    }
  }

  const singleEvents: ThermalMarkerData[] = [];
  const clusters: ClusterData[] = [];

  gridMap.forEach((group, key) => {
    if (group.length === 1) {
      singleEvents.push(group[0]);
    } else {
      let sumLat = 0;
      let sumLon = 0;
      let minLat = 90;
      let maxLat = -90;
      let minLon = 180;
      let maxLon = -180;
      let anomalousCount = 0;

      for (const item of group) {
        sumLat += item.lat;
        sumLon += item.lon;
        if (item.lat < minLat) minLat = item.lat;
        if (item.lat > maxLat) maxLat = item.lat;
        if (item.lon < minLon) minLon = item.lon;
        if (item.lon > maxLon) maxLon = item.lon;
        if (item.is_anomalous) anomalousCount++;
      }

      const count = group.length;
      // Add slight padding to cluster bounding box
      const padding = 0.05;
      clusters.push({
        id: `cluster-${key}-${count}`,
        lat: sumLat / count,
        lon: sumLon / count,
        eventCount: count,
        anomalousCount,
        events: group,
        bounds: [
          [minLat - padding, minLon - padding],
          [maxLat + padding, maxLon + padding],
        ],
      });
    }
  });

  return { singleEvents, clusters };
}

