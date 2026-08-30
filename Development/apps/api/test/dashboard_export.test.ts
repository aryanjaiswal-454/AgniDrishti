import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/index";
import * as db from "../src/db";
import { signToken } from "../src/utils/jwt";

vi.mock("../src/db", () => ({
  query: vi.fn(),
  testDbConnection: vi.fn().mockResolvedValue({ ok: true }),
}));

describe("Dashboard Summary & Data Export API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validToken = signToken({
    userId: "u1",
    email: "user@aagnazar.in",
    name: "User",
    role: "viewer",
  });

  it("GET /api/v1/dashboard/summary - should return aggregated command center metrics", async () => {
    vi.spyOn(db, "query")
      .mockResolvedValueOnce({
        rows: [
          {
            total_hotspots: "250",
            total_classified_events: "240",
            industrial_fires_count: "12",
            persistent_sources_count: "85",
            natural_fires_count: "140",
            anomalous_events_count: "8",
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      }) // metrics
      .mockResolvedValueOnce({
        rows: [{ active_alerts: "3", high_severity_alerts: "1" }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      }) // alerts
      .mockResolvedValueOnce({
        rows: [
          { sub_class: "gas_flare", count: "85" },
          { sub_class: "forest_fire", count: "80" },
        ],
        rowCount: 2,
        command: "SELECT",
        oid: 0,
        fields: [],
      }) // breakdown
      .mockResolvedValueOnce({
        rows: [
          {
            id: "e1",
            primary_class: "industrial",
            sub_class: "gas_flare",
            confidence_score: "0.94",
            is_anomalous: false,
            created_at: new Date().toISOString(),
            facility_name: "Jamnagar",
            latitude: 22.35,
            longitude: 69.85,
            frp: "88.2",
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      }); // recent

    const res = await request(app)
      .get("/api/v1/dashboard/summary")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics.total_hotspots).toBe(250);
    expect(res.body.data.metrics.anomalous_events_count).toBe(8);
    expect(res.body.data.metrics.active_alerts_count).toBe(3);
    expect(res.body.data.breakdown_by_class.length).toBe(2);
    expect(res.body.data.recent_events.length).toBe(1);
  });

  it("GET /api/v1/export - should export classified events as JSON", async () => {
    vi.spyOn(db, "query").mockResolvedValueOnce({
      rows: [
        {
          event_id: "e1",
          hotspot_id: "h1",
          acq_date: "2026-08-28",
          acq_time: "1830",
          latitude: 22.35,
          longitude: 69.85,
          instrument: "VIIRS",
          satellite: "N",
          frp: "88.2",
          bright_ti4: "338.5",
          primary_class: "industrial",
          sub_class: "gas_flare",
          confidence_score: "0.94",
          is_anomalous: false,
          facility_name: "Jamnagar",
          created_at: new Date().toISOString(),
        },
      ],
      rowCount: 1,
      command: "SELECT",
      oid: 0,
      fields: [],
    });

    const res = await request(app)
      .get("/api/v1/export?format=json")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/json");
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].facility_name).toBe("Jamnagar");
  });

  it("GET /api/v1/export - should export classified events as CSV with attachment headers", async () => {
    vi.spyOn(db, "query").mockResolvedValueOnce({
      rows: [
        {
          event_id: "e1",
          hotspot_id: "h1",
          acq_date: "2026-08-28",
          acq_time: "1830",
          latitude: 22.35,
          longitude: 69.85,
          instrument: "VIIRS",
          satellite: "N",
          frp: "88.2",
          bright_ti4: "338.5",
          primary_class: "industrial",
          sub_class: "gas_flare",
          confidence_score: "0.94",
          is_anomalous: false,
          facility_name: "Jamnagar, Gujarat", // test comma escaping
          created_at: new Date().toISOString(),
        },
      ],
      rowCount: 1,
      command: "SELECT",
      oid: 0,
      fields: [],
    });

    const res = await request(app)
      .get("/api/v1/export?format=csv")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain("attachment");
    expect(res.text).toContain("event_id,hotspot_id");
    expect(res.text).toContain('"Jamnagar, Gujarat"');
  });
});
