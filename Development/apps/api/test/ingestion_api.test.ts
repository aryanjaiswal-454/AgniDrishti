import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/index";
import * as db from "../src/db";
import { signToken } from "../src/utils/jwt";
import { firmsQueue, osmQueue } from "../src/queues";

vi.mock("../src/db", () => ({
  query: vi.fn(),
  testDbConnection: vi.fn().mockResolvedValue({ ok: true }),
}));

describe("Ingestion Telemetry & Trigger API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const viewerToken = signToken({
    userId: "v1",
    email: "viewer@aagnazar.in",
    name: "Viewer",
    role: "viewer",
  });

  const adminToken = signToken({
    userId: "a1",
    email: "admin@aagnazar.in",
    name: "Admin",
    role: "admin",
  });

  it("GET /api/v1/ingestion/status - should return telemetry structure for authenticated users", async () => {
    const res = await request(app)
      .get("/api/v1/ingestion/status")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.firms).toBeDefined();
    expect(res.body.data.osm).toBeDefined();
    expect(res.body.data.server_time).toBeDefined();
  });

  it("POST /api/v1/ingestion/firms/trigger - should allow admin to queue async FIRMS ingestion job", async () => {
    vi.spyOn(firmsQueue, "add").mockResolvedValueOnce({ id: "job-firms-123" } as any);

    const res = await request(app)
      .post("/api/v1/ingestion/firms/trigger?async=true")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ source: "VIIRS_SNPP_NRT" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.jobId).toBe("job-firms-123");
  });

  it("POST /api/v1/ingestion/firms/trigger - should BLOCK non-admin from triggering ingestion (403 Forbidden)", async () => {
    const res = await request(app)
      .post("/api/v1/ingestion/firms/trigger")
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN_ERROR");
  });

  it("POST /api/v1/ingestion/osm/trigger - should allow admin to queue async OSM sync job", async () => {
    vi.spyOn(osmQueue, "add").mockResolvedValueOnce({ id: "job-osm-456" } as any);

    const res = await request(app)
      .post("/api/v1/ingestion/osm/trigger?async=true")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.jobId).toBe("job-osm-456");
  });
});
