import Redis from "ioredis";
import config from "../config";
import logger from "../utils/logger";

/**
 * Worker processes cannot access the API process's Socket.IO instance. This
 * Redis channel relays their committed updates to the API without requiring
 * another environment variable or service.
 */
export const REALTIME_BUS_CHANNEL = "agnidrishti:realtime:v1";

let publisher: Redis | null = null;
let subscriber: Redis | null = null;

function createRedisClient(): Redis {
  return new Redis(config.redis.url, {
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  });
}

function getPublisher(): Redis {
  if (!publisher) {
    publisher = createRedisClient();
    publisher.on("error", (error) => logger.warn(`[Realtime bus] publisher error: ${error.message}`));
  }
  return publisher;
}

export function publishRealtimeEvent(type: string, payload: unknown): void {
  if (config.env === "test") return;

  void getPublisher()
    .publish(REALTIME_BUS_CHANNEL, JSON.stringify({ type, payload }))
    .catch((error) => logger.error(`[Realtime bus] publish failed: ${error.message}`));
}

export function startRealtimeSubscriber(
  onEvent: (event: { type: string; payload: unknown }) => void
): void {
  if (config.env === "test" || subscriber) return;

  subscriber = createRedisClient();
  subscriber.on("error", (error) => logger.warn(`[Realtime bus] subscriber error: ${error.message}`));
  subscriber.on("message", (channel, rawMessage) => {
    if (channel !== REALTIME_BUS_CHANNEL) return;
    try {
      const event = JSON.parse(rawMessage);
      if (typeof event?.type !== "string") throw new Error("event type is missing");
      onEvent(event);
    } catch (error: any) {
      logger.warn(`[Realtime bus] ignored invalid message: ${error.message}`);
    }
  });

  void subscriber
    .subscribe(REALTIME_BUS_CHANNEL)
    .then(() => logger.info("[Realtime bus] API subscribed to worker updates."))
    .catch((error) => logger.error(`[Realtime bus] subscribe failed: ${error.message}`));
}

export async function closeRealtimeBus(): Promise<void> {
  await Promise.allSettled([publisher?.quit(), subscriber?.quit()]);
  publisher = null;
  subscriber = null;
}
