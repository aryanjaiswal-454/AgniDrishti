import { describe, expect, it, vi } from "vitest";

const processorRef = vi.hoisted(() => ({ current: undefined as undefined | ((job: any) => Promise<void>) }));
const databaseMocks = vi.hoisted(() => ({ query: vi.fn(), withTransaction: vi.fn() }));
const axiosPost = vi.hoisted(() => vi.fn());
const createAlert = vi.hoisted(() => vi.fn());

vi.mock("bullmq", () => ({
  Worker: class {
    constructor(_name: string, processor: (job: any) => Promise<void>) {
      processorRef.current = processor;
    }
    on() { return this; }
  },
}));
vi.mock("axios", () => ({ default: { post: axiosPost } }));
vi.mock("../src/db", () => databaseMocks);
vi.mock("../src/queues/connection", () => ({ default: {} }));
vi.mock("../src/services/alert.service", () => ({ AlertService: { createAlert } }));

import { createClassificationWorker } from "../src/workers/classification.worker";

describe("classification worker alert transaction boundary", () => {
  it("commits the classified event before creating its alert", async () => {
    const sequence: string[] = [];
    const dbHotspot = {
      id: "hotspot-1", latitude: 22.3, longitude: 70.0, frp: 110,
      acq_date: "2026-09-03", acq_time: "1200", instrument: "VIIRS",
      daynight: "D", confidence: "high", raw_payload: {},
    };

    databaseMocks.query
      .mockResolvedValueOnce({ rows: [dbHotspot] })
      .mockResolvedValueOnce({ rows: [{ count: "1" }] })
      .mockImplementationOnce(async () => {
        sequence.push("alert-check");
        return { rows: [] };
      });
    databaseMocks.withTransaction.mockImplementation(async (callback: (client: any) => Promise<string>) => {
      sequence.push("begin");
      const result = await callback({
        query: vi.fn()
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [{ id: "event-1" }] }),
      });
      sequence.push("commit");
      return result;
    });
    axiosPost.mockResolvedValueOnce({
      data: {
        error_count: 0, processed_count: 1,
        results: [{ hotspot_id: "hotspot-1", is_anomalous: true, sub_class: "industrial_fire" }],
      },
    });
    createAlert.mockImplementation(async () => { sequence.push("create-alert"); });

    createClassificationWorker();
    await processorRef.current!({ id: "job-1", data: { hotspot_id: "hotspot-1" } });

    expect(sequence).toEqual(["begin", "commit", "alert-check", "create-alert"]);
    expect(createAlert).toHaveBeenCalledWith({ classified_event_id: "event-1", severity: "high", status: "new" });
  });
});
