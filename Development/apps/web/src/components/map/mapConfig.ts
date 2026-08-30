import { BaseMapMode, MapViewport } from "./types";

export interface TileLayerConfig {
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains: string | string[];
}

export const BASEMAP_CONFIGS: Record<BaseMapMode, TileLayerConfig> = {
  // 1. Sleek Tactical Dark Canvas (ESRI World Dark Gray Base - Genuine Keyless Public GIS)
  dark: {
    name: "Dark Canvas",
    url:
      import.meta.env?.VITE_MAP_DARK_TILE_URL ||
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, METI, NRCAN",
    maxZoom: 16,
    subdomains: "abc",
  },

  // 2. High-Resolution Satellite Imagery (ESRI World Imagery - Genuine Keyless Public GIS)
  satellite: {
    name: "Satellite Imagery",
    url:
      import.meta.env?.VITE_MAP_SATELLITE_TILE_URL ||
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS User Community",
    maxZoom: 18,
    subdomains: "abc",
  },

  // 3. OpenStreetMap Standard Tactical Vector/Raster Layer (Official OSM - Keyless)
  osm_tactical: {
    name: "OpenStreetMap",
    url:
      import.meta.env?.VITE_MAP_OSM_TILE_URL ||
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: "abc",
  },
};

export const DEFAULT_INDIA_VIEWPORT: MapViewport = {
  center: [22.3511, 78.6677],
  zoom: 5,
};

