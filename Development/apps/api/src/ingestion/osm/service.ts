import { withTransaction } from "../../db";
import { isPointInIndia } from "../firms/india-boundary";
import { osmOverpassClient } from "./client";
import { isTargetIndustrialOsmElement, normalizeOsmElements, NormalizedFacilityInput } from "./normalizer";
import { telemetryTracker } from "../telemetry";
import { emitFacilitiesSynced } from "../../realtime/socket";
import logger from "../../utils/logger";

export interface OsmSyncResult {
  features_fetched: number;
  facilities_upserted: number;
  invalid_features: number;
  duration_ms: number;
}

export class OsmSyncService {
  /**
   * Import a pre-fetched OSM snapshot. This is used for controlled bulk
   * imports when the production worker cannot reach public Overpass services.
   */
  static async importOsmElements(elements: Parameters<typeof normalizeOsmElements>[0]): Promise<OsmSyncResult> {
    const startTime = Date.now();
    const targetElements = elements.filter(isTargetIndustrialOsmElement);
    const { valid, invalidCount } = normalizeOsmElements(targetElements);
    // The OSM bounding box includes parts of neighbouring countries. Enforce
    // the same India land-boundary rule as the FIRMS ingestion before saving.
    const indiaFacilities = valid.filter((facility) => {
      const [longitude, latitude] = facility.geometry.coordinates;
      return isPointInIndia(latitude, longitude);
    });
    const bulkFacilities = indiaFacilities.map((facility) => ({ ...facility, source: "osm_bulk" }));
    const facilitiesUpserted = bulkFacilities.length > 0 ? await this.upsertFacilities(bulkFacilities) : 0;

    return {
      features_fetched: elements.length,
      facilities_upserted: facilitiesUpserted,
      invalid_features:
        invalidCount +
        (elements.length - targetElements.length) +
        (valid.length - indiaFacilities.length),
      duration_ms: Date.now() - startTime,
    };
  }

  /**
   * Synchronize industrial facility infrastructure from OpenStreetMap.
   */
  static async run(customBbox?: string): Promise<OsmSyncResult> {
    const startTime = Date.now();
    logger.info("⚡ [OSM Pipeline] Facility sync job started...");

    try {
      const fetchResult = await osmOverpassClient.fetchIndustrialFacilities(customBbox);
      if (fetchResult.successfulChunks === 0) {
        throw new Error(
          "All OSM Overpass providers failed; no facility data was changed. Retry on the next scheduled sync or use a dedicated data source."
        );
      }

      const result = await this.importOsmElements(fetchResult.elements);
      result.duration_ms = Date.now() - startTime;

      telemetryTracker.recordOsmRun(result);
      emitFacilitiesSynced({
        ...result,
        synced_at: new Date().toISOString(),
      });

      logger.info(
        `[OSM Pipeline] Sync completed in ${result.duration_ms}ms: ${result.facilities_upserted} facility record(s) upserted from ${fetchResult.successfulChunks} successful chunk(s); ${fetchResult.failedChunks} failed chunk(s).`
      );
      return result;
    } catch (error: any) {
      const duration_ms = Date.now() - startTime;
      telemetryTracker.recordOsmError(error.message, duration_ms);
      logger.error(`❌ [OSM Pipeline] Sync job failed after ${duration_ms}ms: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upsert normalized facilities in batches with idempotent conflict resolution.
   */
  private static async upsertFacilities(facilities: NormalizedFacilityInput[]): Promise<number> {
    let upsertedCount = 0;
    const chunkSize = 100;

    for (let index = 0; index < facilities.length; index += chunkSize) {
      const chunk = facilities.slice(index, index + chunkSize);

      await withTransaction(async (client) => {
        for (const facility of chunk) {
          const result = await client.query(
            `INSERT INTO facilities (
              osm_id, name, facility_type, geometry, state, district, source, last_synced_at
            ) VALUES (
              $1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, $8, NOW()
            )
            ON CONFLICT (osm_id) DO UPDATE SET
              name = COALESCE(EXCLUDED.name, facilities.name),
              facility_type = EXCLUDED.facility_type,
              geometry = EXCLUDED.geometry,
              state = COALESCE(EXCLUDED.state, facilities.state),
              district = COALESCE(EXCLUDED.district, facilities.district),
              last_synced_at = NOW()
            RETURNING id;`,
            [
              facility.osm_id,
              facility.name,
              facility.facility_type,
              facility.longitude,
              facility.latitude,
              facility.state,
              facility.district,
              facility.source,
            ]
          );

          if (result.rowCount && result.rowCount > 0) {
            upsertedCount++;
          }
        }
      });
    }

    return upsertedCount;
  }
}

export default OsmSyncService;
