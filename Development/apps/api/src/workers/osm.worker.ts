import { Worker, Job } from "bullmq";
import config from "../config";
import redisConnection from "../queues/connection";
import { OsmSyncService } from "../ingestion/osm/service";
import logger from "../utils/logger";

export function createOsmWorker(): Worker {
  const worker = new Worker(
    config.queues.osmSync,
    async (job: Job) => {
      logger.info(`[OsmWorker] Processing job ${job.id} (${job.name})...`);
      const result = await OsmSyncService.run(job.data?.bbox);
      return result;
    },
    {
      connection: redisConnection,
      concurrency: 1,
    }
  );

  worker.on("completed", (job: Job, result: any) => {
    logger.info(
      `[OsmWorker] Job ${job.id} completed: ${result?.facilities_upserted ?? 0} facilities upserted.`
    );
  });

  worker.on("failed", (job: Job | undefined, err: Error) => {
    logger.error(`[OsmWorker] Job ${job?.id} failed: ${err.message}`, {
      stack: err.stack,
      attemptsMade: job?.attemptsMade,
    });
  });

  return worker;
}

export default createOsmWorker;

