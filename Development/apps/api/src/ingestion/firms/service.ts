import { query, withTransaction } from "../../db";
import { firmsClient, FirmsFetchOptions } from "./client";
import { normalizeFirmsCsv, NormalizedHotspotInput } from "./normalizer";
import { classificationQueue } from "../../queues";
import { telemetryTracker } from "../telemetry";
import logger from "../../utils/logger";

export interface FirmsIngestionResult {
  source: string;
  records_fetched: number;
  records_accepted: number;
  records_inserted: number;
  duplicates_skipped: number;
  invalid_count: number;
  duration_ms: number;
}

export class FirmsIngestionService {
  /**
   * Run FIRMS ingestion cycle for configured sources.
   */
  static async run(options?: FirmsFetchOptions): Promise<FirmsIngestionResult> {
    const startTime = Date.now();
    logger.info("⚡ [FIRMS Pipeline] Ingestion job started...");

    try {
      // 1. Fetch raw CSV from NASA FIRMS
      const { source, csvData } = await firmsClient.fetchAreaCsv(options);

      // 2. Normalize and validate records
      const normalization = normalizeFirmsCsv(csvData);
      const fetchedCount = normalization.valid.length + normalization.invalidCount;

      if (normalization.invalidCount > 0) {
        logger.warn(
          `⚠️ [FIRMS Pipeline] ${normalization.invalidCount} invalid rows skipped out of ${fetchedCount}. Errors: ${normalization.errors.join("; ")}`
        );
      }

      if (normalization.valid.length === 0) {
        const duration_ms = Date.now() - startTime;
        const result: FirmsIngestionResult = {
          source,
          records_fetched: fetchedCount,
          records_accepted: 0,
          records_inserted: 0,
          duplicates_skipped: 0,
          invalid_count: normalization.invalidCount,
          duration_ms,
        };
        telemetryTracker.recordFirmsRun(result);
        logger.info(`[FIRMS Pipeline] Completed in ${duration_ms}ms. 0 records to insert.`);
        return result;
      }

      // 3. Persist non-duplicate records into PostgreSQL
      const { insertedHotspots, duplicatesCount } = await this.persistHotspots(normalization.valid);

      // 4. Publish newly inserted records to classification queue for future AI processing
      if (insertedHotspots.length > 0) {
        await this.publishToClassificationQueue(insertedHotspots);
      }

      const duration_ms = Date.now() - startTime;
      const result: FirmsIngestionResult = {
        source,
        records_fetched: fetchedCount,
        records_accepted: normalization.valid.length,
        records_inserted: insertedHotspots.length,
        duplicates_skipped: duplicatesCount,
        invalid_count: normalization.invalidCount,
        duration_ms,
      };

      // 5. Update telemetry
      telemetryTracker.recordFirmsRun(result);

      logger.info(
        `✅ [FIRMS Pipeline] Job completed successfully in ${duration_ms}ms: ${result.records_inserted} inserted, ${result.duplicates_skipped} duplicates skipped.`
      );

      return result;
    } catch (error: any) {
      const duration_ms = Date.now() - startTime;
      telemetryTracker.recordFirmsError(error.message, duration_ms);
      logger.error(`❌ [FIRMS Pipeline] Ingestion job failed after ${duration_ms}ms: ${error.message}`);
      throw error;
    }
  }

  /**
   * Persist normalized hotspots with database-level deduplication.
   */
  private static async persistHotspots(
    hotspots: NormalizedHotspotInput[]
  ): Promise<{ insertedHotspots: Array<{ id: string; latitude: number; longitude: number; acq_date: string; acq_time: string; frp: number | null; instrument: string }>; duplicatesCount: number }> {
    let insertedCount = 0;
    let duplicatesCount = 0;
    const insertedHotspots: any[] = [];

    // Process in transactional chunks of 100 for high throughput
    const chunkSize = 100;
    for (let i = 0; i < hotspots.length; i += chunkSize) {
      const chunk = hotspots.slice(i, i + chunkSize);

      await withTransaction(async (client) => {
        for (const h of chunk) {
          const res = await client.query(
            `INSERT INTO hotspots (
              latitude, longitude, geometry, acq_date, acq_time, satellite, instrument,
              confidence, frp, bright_ti4, daynight, raw_payload, ingested_at
            ) VALUES (
              $1, $2, ST_SetSRID(ST_MakePoint($2, $1), 4326), $3, $4, $5, $6,
              $7, $8, $9, $10, $11, NOW()
            )
            ON CONFLICT ON CONSTRAINT uq_hotspots_dedup DO NOTHING
            RETURNING id, latitude, longitude, TO_CHAR(acq_date, 'YYYY-MM-DD') as acq_date, acq_time, frp, instrument;`,
            [
              h.latitude,
              h.longitude,
              h.acq_date,
              h.acq_time,
              h.satellite,
              h.instrument,
              h.confidence,
              h.frp,
              h.bright_ti4,
              h.daynight,
              JSON.stringify(h.raw_payload),
            ]
          );

          if (res.rowCount && res.rowCount > 0) {
            insertedCount++;
            insertedHotspots.push(res.rows[0]);
          } else {
            duplicatesCount++;
          }
        }
      });
    }

    return { insertedHotspots, duplicatesCount };
  }

  /**
   * Publish newly inserted hotspots to the downstream classification queue.
   */
  private static async publishToClassificationQueue(
    hotspots: Array<{ id: string; latitude: number; longitude: number; acq_date: string; acq_time: string; frp: number | null; instrument: string }>
  ): Promise<void> {
    try {
      const jobs = hotspots.map((h) => ({
        name: "classify-hotspot",
        data: {
          hotspot_id: h.id,
          latitude: h.latitude,
          longitude: h.longitude,
          acq_date: h.acq_date,
          acq_time: h.acq_time,
          frp: h.frp,
          instrument: h.instrument,
        },
        opts: {
          removeOnComplete: true,
        },
      }));

      await classificationQueue.addBulk(jobs);
      logger.info(`📤 Dispatched ${jobs.length} new hotspot(s) to BullMQ classification queue.`);
    } catch (err: any) {
      logger.warn(`Failed to dispatch jobs to classification queue (Redis optional in D3): ${err.message}`);
    }
  }
}

export default FirmsIngestionService;

