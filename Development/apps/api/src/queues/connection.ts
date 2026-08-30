import Redis, { RedisOptions } from "ioredis";
import config from "../config";
import logger from "../utils/logger";

const redisOptions: RedisOptions = config.redis.url
  ? {
      // Connect using URL
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
    }
  : {
      host: config.redis.host,
      port: config.redis.port,
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
    };

export const redisConnection = config.redis.url
  ? new Redis(config.redis.url, redisOptions)
  : new Redis(redisOptions);

redisConnection.on("error", (err) => {
  // Graceful logging without spamming
  logger.warn(`Redis connection warning: ${err.message}`);
});

redisConnection.on("connect", () => {
  logger.info("Connected to Redis successfully for BullMQ queues.");
});

export default redisConnection;

