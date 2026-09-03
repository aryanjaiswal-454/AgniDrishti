import { describe, it, expect, vi, beforeEach } from "vitest";
import { firmsQueue, osmQueue, classificationQueue, setupSchedulers } from "../src/queues";

describe("BullMQ Ingestion Queues & Schedulers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize queues with exponential retry backoff default options", () => {
    expect(firmsQueue.name).toBe("firms-ingestion-queue");
    expect(osmQueue.name).toBe("osm-sync-queue");
    expect(classificationQueue.name).toBe("classification-queue");

    expect(firmsQueue.defaultJobOptions.attempts).toBe(5);
    expect(firmsQueue.defaultJobOptions.backoff).toEqual({
      type: "exponential",
      delay: 2000,
    });
  });

  it("should enqueue an immediate OSM sync and register its repeatable schedule", async () => {
    const addFirmsSpy = vi.spyOn(firmsQueue, "add").mockResolvedValue({ id: "job1" } as any);
    const addOsmSpy = vi.spyOn(osmQueue, "add").mockResolvedValue({ id: "job2" } as any);

    await setupSchedulers();

    expect(addFirmsSpy).toHaveBeenCalledWith(
      "scheduled-firms-fetch",
      { source: "scheduled-cron" },
      expect.objectContaining({
        repeat: expect.objectContaining({
          pattern: expect.any(String),
        }),
      })
    );

    expect(addOsmSpy).toHaveBeenCalledWith(
      "immediate-osm-sync",
      { source: "startup" },
      expect.objectContaining({
        removeOnComplete: true,
        jobId: expect.stringMatching(/^immediate-osm-startup-/),
      })
    );
    expect(addOsmSpy).toHaveBeenCalledWith(
      "scheduled-osm-sync",
      { source: "scheduled-cron" },
      expect.objectContaining({
        repeat: expect.objectContaining({
          pattern: expect.any(String),
        }),
      })
    );
  });
});
