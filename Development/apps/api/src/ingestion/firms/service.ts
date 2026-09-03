import { withTransaction } from "../../db";
import config from "../../config";
import { firmsClient, FirmsFetchOptions, redactFirmsError } from "./client";
import { normalizeFirmsCsv, NormalizedHotspotInput } from "./normalizer";
import { isPointInIndia } from "./india-boundary";
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

const CONTROL_JOB_SOURCES = new Set(["startup", "scheduled-cron"]);

/**
 * Startup and scheduled jobs fetch every FIRMS collection in FIRMS_SOURCE.
 * An explicit one-off source remains a one-source run.
 */
export function resolveFirmsSources(requestedSource?: string): string[] {
  const source = requestedSource?.trim();
  if (source && !CONTROL_JOB_SOURCES.has(source)) {
    return [source];
  }

  const configuredSources = config.firms.sources.filter(Boolean);
  return configuredSources.length > 0 ? configuredSources : ["VIIRS_SNPP_NRT"];
}

export class FirmsIngestionService {
  /** Run a complete FIRMS ingestion cycle. */
  static async run(options?: FirmsFetchOptions): Promise<FirmsIngestionResult> {
    const startTime = Date.now();
    logger.info("[FIRMS Pipeline] Ingestion job started.");

    try {
      const sources = resolveFirmsSources(options?.source);
      let recordsFetched = 0;
      let recordsAccepted = 0;
      let recordsInserted = 0;
      let duplicatesSkipped = 0;
      let invalidCount = 0;
      let excludedOutsideIndia = 0;
      let successfulSources = 0;

      for (const source of sources) {
        try {
          // Request each configured collection independently. A transient failure
          // from one NASA feed must not suppress the other feed.
          const { csvData } = await firmsClient.fetchAreaCsv({ ...options, source });
          const normalization = normalizeFirmsCsv(csvData);
          const fetchedCount = normalization.valid.length + normalization.invalidCount;
          const indiaHotspots = normalization.valid.filter((hotspot) =>
            isPointInIndia(hotspot.latitude, hotspot.longitude)
          );

          successfulSources++;
          recordsFetched += fetchedCount;
          recordsAccepted += indiaHotspots.length;
          invalidCount += normalization.invalidCount;
          excludedOutsideIndia += normalization.valid.length - indiaHotspots.length;

          if (normalization.invalidCount > 0) {
            logger.warn(
              `[FIRMS Pipeline] ${source}: ${normalization.invalidCount} invalid rows skipped out of ${fetchedCount}. Errors: ${normalization.errors.join("; ")}`
            );
          }

          if (indiaHotspots.length === 0) {
            logger.info(`[FIRMS Pipeline] ${source}: no India records to insert.`);
            continue;
          }

          const { insertedHotspots, duplicatesCount } = await this.persistHotspots(indiaHotspots);
          recordsInserted += insertedHotspots.length;
          duplicatesSkipped += duplicatesCount;

          if (insertedHotspots.length > 0) {
            await this.publishToClassificationQueue(insertedHotspots);
          }
        } catch (sourceError: unknown) {
          logger.warn(`[FIRMS Pipeline] ${source} fetch failed: ${redactFirmsError(sourceError)}`);
        }
      }

      if (successfulSources === 0) {
        throw new Error("All configured NASA FIRMS sources failed to fetch.");
      }

      const duration_ms = Date.now() - startTime;
      const result: FirmsIngestionResult = {
        source: sources.join(","),
        records_fetched: recordsFetched,
        records_accepted: recordsAccepted,
        records_inserted: recordsInserted,
        duplicates_skipped: duplicatesSkipped,
        invalid_count: invalidCount,
        duration_ms,
      };

      telemetryTracker.recordFirmsRun(result);
      logger.info(
        `[FIRMS Pipeline] Job completed in ${duration_ms}ms: ${recordsInserted} inserted, ${duplicatesSkipped} duplicates skipped, ${excludedOutsideIndia} outside India excluded.`
      );
      return result;
    } catch (error: unknown) {
      const duration_ms = Date.now() - startTime;
      const message = redactFirmsError(error);
      telemetryTracker.recordFirmsError(message, duration_ms);
      logger.error(`[FIRMS Pipeline] Ingestion job failed after ${duration_ms}ms: ${message}`);
      throw error;
    }
  }

  /** Persist normalized hotspots with database-level deduplication. */
  private static async persistHotspots(
    hotspots: NormalizedHotspotInput[]
  ): Promise<{
    insertedHotspots: Array<{
      id: string;
      latitude: number;
      longitude: number;
      acq_date: string;
      acq_time: string;
      frp: number | null;
      instrument: string;
    }>;
    duplicatesCount: number;
  }> {
    let insertedCount = 0;
    let duplicatesCount = 0;
    const insertedHotspots: any[] = [];
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

  /** Publish newly inserted records to downstream classification. */
  private static async publishToClassificationQueue(
    hotspots: Array<{
      id: string;
      latitude: number;
      longitude: number;
      acq_date: string;
      acq_time: string;
      frp: number | null;
      instrument: string;
    }>
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
        opts: { removeOnComplete: true },
      }));

      await classificationQueue.addBulk(jobs);
      logger.info(`Dispatched ${jobs.length} new hotspot(s) to BullMQ classification queue.`);
    } catch (err: unknown) {
      logger.warn(`Failed to dispatch jobs to classification queue: ${redactFirmsError(err)}`);
    }
  }
}

export default FirmsIngestionService;
