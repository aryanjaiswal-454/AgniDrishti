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
        "User-Agent": "AgniDrishti-SIH26162-FacilitySync/1.0",
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

    try {
      const response = await this.client.post<OverpassResponse>(
        config.osm.overpassUrl,
        `data=${encodeURIComponent(query)}`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const elements = response.data.elements || [];
      logger.info(`Fetched ${elements.length} raw element(s) from OpenStreetMap.`);
      return elements;
    } catch (error: any) {
      logger.error(`Overpass API Error: ${error.message}`);
      throw error;
    }
  }
}

export const osmOverpassClient = new OsmOverpassClient();
export default osmOverpassClient;

