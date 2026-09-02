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

export class OsmOverpassClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: config.osm.timeoutMs,
      headers: {
        "User-Agent": "AgniDrishti-FacilitySync/1.0",
        Accept: "application/json",
      },
    });
  }

  /**
   * Build Overpass QL query for industrial facilities within a bounding box.
   * Format of bbox: south,west,north,east
   */
  private buildQuery(bbox: string): string {
    return `
[out:json][timeout:60];
(
  // 1. Oil Refineries & Petrochemical Works
  nwr["man_made"="works"]["industrial"="oil"](${bbox});
  nwr["industrial"="oil"](${bbox});
  nwr["industrial"="chemical"](${bbox});
  nwr["landuse"="industrial"]["name"~"Refinery|Petrochemical",i](${bbox});

  // 2. Thermal Power Plants
  nwr["power"="plant"]["plant:source"~"coal|gas|oil|thermal",i](${bbox});
  nwr["power"="plant"]["name"~"Thermal|Super Thermal|NTPC|TPS|Power Station",i](${bbox});

  // 3. Steel & Metallurgy Industries
  nwr["industrial"="iron_and_steel"](${bbox});
  nwr["industrial"="steel"](${bbox});
  nwr["landuse"="industrial"]["name"~"Steel|SAIL|Jindal|Tata Steel|JSW",i](${bbox});

  // 4. Mining & Extraction Areas
  nwr["landuse"="quarry"](${bbox});
  nwr["man_made"="mineshaft"](${bbox});
  nwr["industrial"="mine"](${bbox});
  nwr["landuse"="industrial"]["name"~"Coal|Mines|Mining|BCCL|ECL|WCL|SECL|MCL|NCL",i](${bbox});

  // 5. LNG Terminals & Gas Storage
  nwr["man_made"="storage_tank"]["content"="lng"](${bbox});
  nwr["industrial"="gas"](${bbox});
  nwr["landuse"="industrial"]["name"~"LNG|Gas Terminal|Petronet|GAIL",i](${bbox});
);
out center tags;
    `.trim();
  }

  /**
   * Fetch industrial infrastructure elements from OpenStreetMap via Overpass API.
   */
  async fetchIndustrialFacilities(customBbox?: string): Promise<OverpassElement[]> {
    const bbox = customBbox || config.osm.areaBbox;
    const query = this.buildQuery(bbox);

    logger.info(`Fetching OSM industrial facilities for bounding box [${bbox}]...`);

    // Add fallback mirrors because OSM API is heavily rate-limited and often blocks cloud IPs
    const endpoints = [
      config.osm.overpassUrl,
      "https://overpass.kumi.systems/api/interpreter",
      "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
      "https://z.overpass-api.de/api/interpreter"
    ];

    let lastError: any = null;

    for (const url of endpoints) {
      try {
        logger.info(`Attempting Overpass query to: ${url}`);
        const response = await this.client.post<OverpassResponse>(
          url,
          `data=${encodeURIComponent(query)}`,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            timeout: Math.max(config.osm.timeoutMs || 60000, 30000) // Ensure at least 30s timeout
          }
        );

        const elements = response.data.elements || [];
        logger.info(`Fetched ${elements.length} raw element(s) from OpenStreetMap via ${url}.`);
        return elements;
      } catch (error: any) {
        logger.warn(`Failed to fetch from ${url}: ${error.message}`);
        lastError = error;
      }
    }

    logger.error(`All Overpass API endpoints failed. Last error: ${lastError?.message}`);
    logger.warn("Gracefully returning empty array to prevent worker starvation on Overpass timeouts");
    return [];
  }
}

export const osmOverpassClient = new OsmOverpassClient();
export default osmOverpassClient;

