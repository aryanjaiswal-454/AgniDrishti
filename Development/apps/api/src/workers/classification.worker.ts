import { Worker, Job } from "bullmq";
import axios from "axios";
import config from "../config";
import redisConnection from "../queues/connection";
import { withTransaction, query } from "../db";
import logger from "../utils/logger";
import { AlertService } from "../services/alert.service";

interface ClassifyHotspotJob {
  hotspot_id: string;
  latitude: number;
  longitude: number;
  acq_date: string;
  acq_time: string;
  frp: number | null;
  instrument: string;
}

export function createClassificationWorker(): Worker {
  logger.info("Initializing BullMQ Worker: classificationQueue");

  const worker = new Worker(
    config.queues.classification,
    async (job: Job<ClassifyHotspotJob>) => {
      logger.info(`[Classification Worker] Processing job ${job.id} for hotspot ${job.data.hotspot_id}`);
      const hotspot = job.data;

      // Fetch the full hotspot from the DB to send the full payload to the classifier
      const dbHotspotRes = await query(`SELECT * FROM hotspots WHERE id = $1`, [hotspot.hotspot_id]);
      if (dbHotspotRes.rows.length === 0) {
          logger.warn(`Hotspot ${hotspot.hotspot_id} not found in database, skipping classification.`);
          return;
      }

      const dbHotspot = dbHotspotRes.rows[0];

      // We send it to the Python FastAPI Classifier service
      const CLASSIFIER_URL = (process.env.CLASSIFIER_URL || config.classifier.url).replace(/\/+$/, "");

      // The FastAPI takes a batch, we send a batch of 1
      
      // D7: Inject Track A geospatial density dynamically
      const countRes = await query(
        "SELECT COUNT(*) as count FROM hotspots WHERE ST_DWithin(geometry::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 5000)",
        [dbHotspot.longitude, dbHotspot.latitude]
      );
      const neighborhoodCount = parseInt(countRes.rows[0].count) || 1;

      const payload = {
        hotspots: [
          {
            hotspot_id: dbHotspot.id,
            latitude: dbHotspot.latitude,
            longitude: dbHotspot.longitude,
            brightness: dbHotspot.bright_ti4 ? Number(dbHotspot.bright_ti4) : (dbHotspot.raw_payload?.brightness ? Number(dbHotspot.raw_payload.brightness) : 0),
            frp: dbHotspot.frp ? Number(dbHotspot.frp) : 0,
            acquisition_date: new Date(dbHotspot.acq_date).toISOString().split("T")[0],
            acquisition_time: dbHotspot.acq_time,
            instrument: dbHotspot.instrument,
            daynight: dbHotspot.daynight,
            confidence: dbHotspot.confidence,
            neighborhood_count: neighborhoodCount
          }
        ]
      };

      try {
        const response = await axios.post(`${CLASSIFIER_URL}/internal/classify`, payload, {
          timeout: 30000, // 30s timeout
          headers: { 'Content-Type': 'application/json' }
        });

        const data = response.data;
        if (data.error_count > 0 && data.errors.length > 0) {
            throw new Error(`Classifier returned error for hotspot: ${data.errors[0].error}`);
        }

        if (data.processed_count === 0 || !data.results || data.results.length === 0) {
            throw new Error(`Classifier returned no results`);
        }

        const result = data.results[0];

        // Persist the classified event first. AlertService uses the pool rather
        // than this transaction client, so alert creation must happen after the
        // event commit or its foreign-key check can block on uncommitted data.
        const eventId = await withTransaction(async (client) => {
          // Check if already exists to avoid duplicates if job is retried
          const existing = await client.query(`SELECT id FROM classified_events WHERE hotspot_id = $1`, [result.hotspot_id]);
          if (existing.rows.length > 0) {
             return existing.rows[0].id as string;
          }

          const insertRes = await client.query(
            `INSERT INTO classified_events (
              hotspot_id, facility_id, primary_class, sub_class,
              land_cover_type, distance_to_facility_m, recurrence_count_90d,
              z_score_frp, confidence_score, model_version, is_anomalous
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
            [
              result.hotspot_id,
              result.facility_id || null,
              result.primary_class,
              result.sub_class,
              result.land_cover_type || null,
              result.distance_to_facility_m || null,
              result.recurrence_count_90d || 0,
              result.z_score_frp || null,
              result.confidence_score || 0.0,
              result.model_version || "unknown",
              result.is_anomalous || false
            ]
          );

          return insertRes.rows[0].id as string;
        });

        // D7: alerts are created after commit. On a retry, avoid creating a
        // second alert for an already-classified event.
        if (result.is_anomalous || result.sub_class === 'industrial_fire') {
          const existingAlert = await query("SELECT id FROM alerts WHERE classified_event_id = $1 LIMIT 1", [eventId]);
          if (existingAlert.rows.length === 0) {
            const severity = result.sub_class === 'industrial_fire' ? 'high' : 'medium';
            await AlertService.createAlert({ classified_event_id: eventId, severity: severity as any, status: "new" });
          }
        }

        logger.info(`✅ Successfully classified and saved hotspot ${dbHotspot.id}`);
      } catch (err: any) {
        if (err.code === 'ECONNREFUSED') {
           logger.error(`❌ Connection to classifier service refused. Is FastAPI running on ${CLASSIFIER_URL}?`);
           throw err; // Rely on BullMQ retry
        } else if (err.response) {
           logger.error(`❌ Classifier API error: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
           throw new Error(`Classifier API error: ${err.response.status}`);
        } else {
           logger.error(`❌ Failed to classify hotspot ${dbHotspot.id}: ${err.message}`);
           throw err;
        }
      }
    },
    {
      connection: redisConnection,
      concurrency: 5, // Process 5 requests at a time
    }
  );

  worker.on("failed", (job, err) => {
    logger.error(`[Classification Worker] Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}

