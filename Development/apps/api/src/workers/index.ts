import { createFirmsWorker } from "./firms.worker";
import { createOsmWorker } from "./osm.worker";
import { createClassificationWorker } from "./classification.worker";
import { setupSchedulers, closeQueues } from "../queues";
import logger from "../utils/logger";

async function startWorkers() {
  logger.info("🚀 Starting AgniDrishti Ingestion Pipeline Workers...");

  // Setup cron schedulers for repeatable ingestion runs
  await setupSchedulers();

  // Initialize workers
  const firmsWorker = createFirmsWorker();
  const osmWorker = createOsmWorker();
  const classificationWorker = createClassificationWorker();

  logger.info("✅ BullMQ workers listening for ingestion jobs.");

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully stopping workers and queues...`);
    await Promise.allSettled([
      firmsWorker.close(),
      osmWorker.close(),
      classificationWorker.close(),
      closeQueues(),
    ]);
    logger.info("Workers stopped. Exiting.");
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

if (require.main === module) {
  startWorkers().catch((err) => {
    logger.error(`Worker startup failed: ${err.message}`);
    process.exit(1);
  });
}

export { startWorkers };

