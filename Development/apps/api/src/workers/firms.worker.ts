import { Worker, Job } from "bullmq";
import config from "../config";
import redisConnection from "../queues/connection";
import { FirmsIngestionService } from "../ingestion/firms/service";
import logger from "../utils/logger";

export function createFirmsWorker(): Worker {
  const worker = new Worker(
    config.queues.firmsIngestion,
    async (job: Job) => {
      logger.info(`[FirmsWorker] Processing job ${job.id} (${job.name})...`);
      const options = { ...job.data };

      if (options.source === "scheduled-cron") {
        delete options.source;
      }

      const result = await FirmsIngestionService.run(options);
      return result;
    },
    {
      connection: redisConnection,
      concurrency: 1, // serial ingestion to prevent conflicting batch writes
    }
  );

  worker.on("completed", (job: Job, result: any) => {
    logger.info(
      `[FirmsWorker] Job ${job.id} completed: ${result?.records_inserted ?? 0} inserted, ${result?.duplicates_skipped ?? 0} duplicates skipped.`
    );
  });

  worker.on("failed", (job: Job | undefined, err: Error) => {
    logger.error(`[FirmsWorker] Job ${job?.id} failed: ${err.message}`, {
      stack: err.stack,
      attemptsMade: job?.attemptsMade,
    });
  });

  return worker;
}

export default createFirmsWorker;

