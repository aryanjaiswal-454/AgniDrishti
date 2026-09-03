import axios, { AxiosInstance } from "axios";
import config from "../../config";
import logger from "../../utils/logger";

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  bounds?: { minlat: number; minlon: number; maxlat: number; maxlon: number };
  tags?: Record<string, string>;
}

export interface OverpassResponse {
  version: number;
  generator: string;
  elements: OverpassElement[];
}

export interface OsmFetchResult {
  elements: OverpassElement[];
  successfulChunks: number;
  failedChunks: number;
  timedOut: boolean;
}

const MAX_SYNC_DURATION_MS = 90_000;
const MAX_ENDPOINT_REQUEST_MS = 15_000;

export function chunkBoundingBox(bbox: string, gridRows: number, gridCols: number): string[] {
  const coordinates = bbox.split(",").map((value) => Number(value.trim()));
  const [south, west, north, east] = coordinates;

  if (
    coordinates.length !== 4 ||
    coordinates.some((value) => !Number.isFinite(value)) ||
    south < -90 || north > 90 || west < -180 || east > 180 ||
    south >= north || west >= east ||
    !Number.isInteger(gridRows) || gridRows < 1 ||
    !Number.isInteger(gridCols) || gridCols < 1
  ) {
    throw new Error(`Invalid OSM bounding box or chunk grid: bbox="${bbox}", rows=${gridRows}, cols=${gridCols}`);
  }

  const chunks: string[] = [];
  const latStep = (north - south) / gridRows;
  const lonStep = (east - west) / gridCols;

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const chunkSouth = south + row * latStep;
      const chunkNorth = chunkSouth + latStep;
      const chunkWest = west + col * lonStep;
      const chunkEast = chunkWest + lonStep;
      chunks.push(
        `${chunkSouth.toFixed(4)},${chunkWest.toFixed(4)},${chunkNorth.toFixed(4)},${chunkEast.toFixed(4)}`
      );
    }
  }

  return chunks;
}

export class OsmOverpassClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: config.osm.requestTimeoutMs,
      headers: {
        "User-Agent": "AgniDrishti-FacilitySync/1.0",
        Accept: "application/json",
      },
    });
  }

  private buildQuery(bbox: string): string {
    return `
[out:json][timeout:${Math.ceil(config.osm.requestTimeoutMs / 1000)}];
(
  nwr["man_made"="works"]["industrial"="oil"](${bbox});
  nwr["industrial"="oil"](${bbox});
  nwr["industrial"="chemical"](${bbox});
  nwr["landuse"="industrial"]["name"~"Refinery|Petrochemical",i](${bbox});

  nwr["power"="plant"]["plant:source"~"coal|gas|oil|thermal",i](${bbox});
  nwr["power"="plant"]["name"~"Thermal|Super Thermal|NTPC|TPS|Power Station",i](${bbox});

  nwr["industrial"="iron_and_steel"](${bbox});
  nwr["industrial"="steel"](${bbox});
  nwr["landuse"="industrial"]["name"~"Steel|SAIL|Jindal|Tata Steel|JSW",i](${bbox});

  nwr["landuse"="quarry"](${bbox});
  nwr["man_made"="mineshaft"](${bbox});
  nwr["industrial"="mine"](${bbox});
  nwr["landuse"="industrial"]["name"~"Coal|Mines|Mining|BCCL|ECL|WCL|SECL|MCL|NCL",i](${bbox});

  nwr["man_made"="storage_tank"]["content"="lng"](${bbox});
  nwr["industrial"="gas"](${bbox});
  nwr["landuse"="industrial"]["name"~"LNG|Gas Terminal|Petronet|GAIL",i](${bbox});
);
out center tags;
    `.trim();
  }

  async fetchIndustrialFacilities(customBbox?: string): Promise<OsmFetchResult> {
    const bbox = customBbox || config.osm.areaBbox;
    let chunks: string[];

    try {
      chunks = chunkBoundingBox(bbox, config.osm.chunkRows, config.osm.chunkCols);
    } catch (error: any) {
      logger.error(`[OSM Pipeline] ${error.message}`);
      throw error;
    }

    logger.info(`Fetching OSM facilities in ${chunks.length} chunks for bbox [${bbox}]...`);

    const endpoints = Array.from(new Set([
      config.osm.overpassUrl,
      "https://overpass.private.coffee/api/interpreter",
      "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
      "https://z.overpass-api.de/api/interpreter",
    ]));
    const allElements = new Map<string, OverpassElement>();
    const deadline = Date.now() + MAX_SYNC_DURATION_MS;
    let successfulChunks = 0;
    let failedChunks = 0;
    let timedOut = false;

    for (const [index, chunkBbox] of chunks.entries()) {
      if (Date.now() >= deadline) {
        timedOut = true;
        logger.warn(`[OSM Pipeline] Reached ${MAX_SYNC_DURATION_MS / 1000}s sync deadline; preserving partial results.`);
        break;
      }

      const query = this.buildQuery(chunkBbox);
      let chunkSuccess = false;

      for (const url of endpoints) {
        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0) {
          timedOut = true;
          break;
        }

        try {
          logger.info(`[OSM Pipeline] Chunk ${index + 1}/${chunks.length}: querying ${url}`);
          const response = await this.client.post<OverpassResponse>(
            url,
            `data=${encodeURIComponent(query)}`,
            {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              timeout: Math.min(MAX_ENDPOINT_REQUEST_MS, remainingMs),
            }
          );

          const elements = response.data.elements || [];
          for (const element of elements) {
            allElements.set(`${element.type}:${element.id}`, element);
          }

          logger.info(`[OSM Pipeline] Chunk ${index + 1}/${chunks.length}: fetched ${elements.length} element(s).`);
          chunkSuccess = true;
          successfulChunks++;
          break;
        } catch (error: any) {
          logger.warn(`[OSM Pipeline] Chunk ${index + 1}/${chunks.length}: ${url} failed: ${error.message}`);
        }
      }

      if (!chunkSuccess) {
        failedChunks++;
        logger.warn(`[OSM Pipeline] Chunk ${index + 1}/${chunks.length}: all mirrors failed; continuing with partial results.`);
      }

      if (index < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, config.osm.chunkDelayMs));
      }
    }

    const elements = Array.from(allElements.values());
    logger.info(`[OSM Pipeline] Collected ${elements.length} unique OSM element(s) across ${successfulChunks} successful chunk(s).`);
    return { elements, successfulChunks, failedChunks, timedOut };
  }
}

export const osmOverpassClient = new OsmOverpassClient();
export default osmOverpassClient;
