import { Queue, QueueOptions } from "bullmq";
import config from "../config";
import redisConnection from "./connection";
import logger from "../utils/logger";

const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2000, // 2s, 4s, 8s, 16s, 32s
    },
    removeOnComplete: {
      count: 100, // keep last 100 completed jobs
    },
    removeOnFail: {
      count: 50, // keep last 50 failed jobs for inspection
    },
  },
};

export const firmsQueue = new Queue(config.queues.firmsIngestion, queueOptions);
export const osmQueue = new Queue(config.queues.osmSync, queueOptions);
export const classificationQueue = new Queue(config.queues.classification, queueOptions);

/**
 * Setup recurring cron schedulers for FIRMS and OSM ingestion.
 */
export async function setupSchedulers(): Promise<void> {
  try {
    // 0. Immediate invocation on startup to guarantee data is present!
    await firmsQueue.add(
      "immediate-firms-fetch",
      { source: "startup" },
      { removeOnComplete: true, jobId: `immediate-firms-${Date.now()}` }
    );
    logger.info("Queued IMMEDIATE FIRMS fetch on worker startup.");

    await osmQueue.add(
      "immediate-osm-sync",
      { source: "startup" },
      { removeOnComplete: true, jobId: `immediate-osm-startup-${Date.now()}` }
    );
    logger.info("Queued IMMEDIATE OSM facility sync on worker startup.");

    // 1. FIRMS repeatable job (e.g., every 30 minutes)
    await firmsQueue.add(
      "scheduled-firms-fetch",
      { source: "scheduled-cron" },
      {
        repeat: {
          pattern: config.firms.cronSchedule,
        },
        jobId: "scheduled-firms-cron-job",
      }
    );
    logger.info(`Scheduled FIRMS NRT polling with cron pattern: '${config.firms.cronSchedule}'`);

    // 2. OSM repeatable job (e.g., weekly)
    await osmQueue.add(
      "scheduled-osm-sync",
      { source: "scheduled-cron" },
      {
        repeat: {
          pattern: config.osm.cronSchedule,
        },
        jobId: "scheduled-osm-cron-job",
      }
    );
    logger.info(`Scheduled OSM facility sync with cron pattern: '${config.osm.cronSchedule}'`);
  } catch (error: any) {
    logger.warn(`Failed to schedule repeatable jobs (Redis may be offline): ${error.message}`);
  }
}

/**
 * Helper to close queues gracefully.
 */
export async function closeQueues(): Promise<void> {
  await Promise.allSettled([
    firmsQueue.close(),
    osmQueue.close(),
    classificationQueue.close(),
  ]);
}

