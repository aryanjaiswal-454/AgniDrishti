import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/index";
import * as db from "../src/db";
import { signToken } from "../src/utils/jwt";

vi.mock("../src/db", () => ({
  query: vi.fn(),
  testDbConnection: vi.fn().mockResolvedValue({ ok: true }),
}));

describe("Facilities API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validToken = signToken({
    userId: "u1",
    email: "user@aagnazar.in",
    name: "User",
    role: "viewer",
  });

  const facilityId = "f0000000-0000-0000-0000-000000000001";

  it("GET /api/v1/facilities - should list facilities with pagination metadata", async () => {
    vi.spyOn(db, "query")
      .mockResolvedValueOnce({ rows: [{ count: "1" }], rowCount: 1, command: "SELECT", oid: 0, fields: [] }) // count
      .mockResolvedValueOnce({
        rows: [
          {
            id: facilityId,
            osm_id: "way_1",
            name: "Jamnagar Refinery",
            facility_type: "refinery",
            geometry: { type: "Point", coordinates: [69.85, 22.35] },
            state: "Gujarat",
            district: "Jamnagar",
            source: "osm",
            last_synced_at: null,
            created_at: new Date().toISOString(),
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      }); // results

    const res = await request(app)
      .get("/api/v1/facilities?facility_type=refinery&limit=10")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe("Jamnagar Refinery");
    expect(res.body.meta.total).toBe(1);
  });

  it("GET /api/v1/facilities/:id - should return single facility with baseline", async () => {
    vi.spyOn(db, "query")
      .mockResolvedValueOnce({
        rows: [
          {
            id: facilityId,
            osm_id: "way_1",
            name: "Jamnagar Refinery",
            facility_type: "refinery",
            geometry: { type: "Point", coordinates: [69.85, 22.35] },
            state: "Gujarat",
            district: "Jamnagar",
            source: "osm",
            last_synced_at: null,
            created_at: new Date().toISOString(),
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      })
      .mockResolvedValueOnce({
        rows: [{ id: "b1", facility_id: facilityId, avg_daily_detections: 4.2, avg_frp: 85.5, std_dev_frp: 14.2 }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      })
      .mockResolvedValueOnce({
        rows: [{ total_events: "12", anomalous_count: "1" }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

    const res = await request(app)
      .get(`/api/v1/facilities/${facilityId}`)
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Jamnagar Refinery");
    expect(res.body.data.baseline).toBeDefined();
    expect(res.body.data.total_events).toBe(12);
  });

  it("GET /api/v1/facilities/:id/timeseries - should return timeseries points for Recharts", async () => {
    vi.spyOn(db, "query")
      .mockResolvedValueOnce({ rows: [{ id: facilityId }], rowCount: 1, command: "SELECT", oid: 0, fields: [] })
      .mockResolvedValueOnce({
        rows: [
          { date: "2026-08-27", avg_frp: 82.1, max_frp: 95.0, detections_count: 3, anomalous_count: 0 },
          { date: "2026-08-28", avg_frp: 88.2, max_frp: 110.0, detections_count: 4, anomalous_count: 0 },
        ],
        rowCount: 2,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

    const res = await request(app)
      .get(`/api/v1/facilities/${facilityId}/timeseries`)
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].date).toBe("2026-08-27");
  });
});
