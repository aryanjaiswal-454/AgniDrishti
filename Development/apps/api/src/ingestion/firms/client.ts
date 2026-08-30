import axios, { AxiosInstance } from "axios";
import config from "../../config";
import logger from "../../utils/logger";

export interface FirmsFetchOptions {
  source?: string;
  areaCoordinates?: string;
  dayRange?: number;
  apiKey?: string;
}

export class FirmsClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: config.firms.timeoutMs,
      headers: {
        "User-Agent": "AgniDrishti-SIH26162-Ingestion/1.0",
        Accept: "text/csv,text/plain",
      },
    });
  }

  /**
   * Fetch active fire data (CSV) from NASA FIRMS Area API.
   * Endpoint format: https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{SOURCE}/{AREA_COORDINATES}/{DAY_RANGE}
   */
  async fetchAreaCsv(options?: FirmsFetchOptions): Promise<{ source: string; csvData: string }> {
    const apiKey = options?.apiKey || config.firms.apiKey;
    const source = options?.source || config.firms.sources[0] || "VIIRS_SNPP_NRT";
    const areaCoordinates = options?.areaCoordinates || config.firms.areaCoordinates;
    const dayRange = options?.dayRange || config.firms.dayRange;

    if (!apiKey) {
      throw new Error(
        "FIRMS_MAP_KEY is not configured. Please set FIRMS_MAP_KEY in your environment variables to fetch live NASA FIRMS data."
      );
    }

    const url = `${config.firms.baseUrl}/${apiKey}/${source}/${areaCoordinates}/${dayRange}`;

    logger.info(`Fetching NASA FIRMS data for source: ${source}, area: [${areaCoordinates}], dayRange: ${dayRange}...`);

    try {
      const response = await this.client.get<string>(url, {
        responseType: "text",
      });

      return {
        source,
        csvData: response.data,
      };
    } catch (error: any) {
      if (error.response?.status === 429) {
        logger.error("NASA FIRMS API Rate Limit Exceeded (HTTP 429).");
        throw new Error("FIRMS API Rate Limit Exceeded (HTTP 429)");
      }
      if (error.response?.status === 403 || error.response?.status === 401) {
        logger.error("NASA FIRMS API Authentication Error. Invalid MAP_KEY.");
        throw new Error("Invalid FIRMS MAP_KEY");
      }
      logger.error(`NASA FIRMS API Network/HTTP Error: ${error.message}`);
      throw error;
    }
  }
}

export const firmsClient = new FirmsClient();
export default firmsClient;

