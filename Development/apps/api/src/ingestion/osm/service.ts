import { withTransaction } from "../../db";
import { osmOverpassClient } from "./client";
import { normalizeOsmElements, NormalizedFacilityInput } from "./normalizer";
import { telemetryTracker } from "../telemetry";
import logger from "../../utils/logger";

export interface OsmSyncResult {
  features_fetched: number;
  facilities_upserted: number;
  invalid_features: number;
  duration_ms: number;
}

export class OsmSyncService {
  /**
   * Synchronize industrial facility infrastructure from OpenStreetMap.
   */
  static async run(customBbox?: string): Promise<OsmSyncResult> {
    const startTime = Date.now();
    logger.info("⚡ [OSM Pipeline] Facility sync job started...");

    try {
      // 1. Fetch Overpass raw elements
      const elements = await osmOverpassClient.fetchIndustrialFacilities(customBbox);

      // 2. Normalize elements and classify facility types
      const { valid, invalidCount } = normalizeOsmElements(elements);

      if (valid.length === 0) {
        const duration_ms = Date.now() - startTime;
        const result: OsmSyncResult = {
          features_fetched: elements.length,
          facilities_upserted: 0,
          invalid_features: invalidCount,
          duration_ms,
        };
        telemetryTracker.recordOsmRun(result);
        logger.info(`[OSM Pipeline] Completed in ${duration_ms}ms. 0 facilities to upsert.`);
        return result;
      }

      // 3. Upsert facilities into PostgreSQL database
      const upsertedCount = await this.upsertFacilities(valid);

      const duration_ms = Date.now() - startTime;
      const result: OsmSyncResult = {
        features_fetched: elements.length,
        facilities_upserted: upsertedCount,
        invalid_features: invalidCount,
        duration_ms,
      };

      // 4. Update telemetry
      telemetryTracker.recordOsmRun(result);

      logger.info(
        `✅ [OSM Pipeline] Sync job completed successfully in ${duration_ms}ms: ${upsertedCount} facilities upserted.`
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

    for (let i = 0; i < facilities.length; i += chunkSize) {
      const chunk = facilities.slice(i, i + chunkSize);

      await withTransaction(async (client) => {
        for (const f of chunk) {
          const res = await client.query(
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
              f.osm_id,
              f.name,
              f.facility_type,
              f.longitude,
              f.latitude,
              f.state,
              f.district,
              f.source,
            ]
          );

          if (res.rowCount && res.rowCount > 0) {
            upsertedCount++;
          }
        }
      });
    }

    return upsertedCount;
  }
}

export default OsmSyncService;

