import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/index";
import * as db from "../src/db";
import { signToken } from "../src/utils/jwt";

vi.mock("../src/db", () => ({
  query: vi.fn(),
  testDbConnection: vi.fn().mockResolvedValue({ ok: true }),
}));

describe("Classified Events API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validToken = signToken({
    userId: "u1",
    email: "user@aagnazar.in",
    name: "User",
    role: "viewer",
  });

  const eventId = "e0000000-0000-0000-0000-000000000001";

  it("GET /api/v1/events - should filter events by primary_class, sub_class, and anomaly status", async () => {
    vi.spyOn(db, "query")
      .mockResolvedValueOnce({ rows: [{ count: "1" }], rowCount: 1, command: "SELECT", oid: 0, fields: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: eventId,
            hotspot_id: "h1",
            facility_id: "f1",
            primary_class: "industrial",
            sub_class: "industrial_fire",
            land_cover_type: "built_up",
            distance_to_facility_m: "120",
            recurrence_count_90d: 1,
            z_score_frp: "0",
            confidence_score: "0.95",
            model_version: "v1.0",
            is_anomalous: true,
            created_at: new Date().toISOString(),
            latitude: 23.67,
            longitude: 86.15,
            acq_date: "2026-08-28",
            acq_time: "1945",
            satellite: "N",
            instrument: "VIIRS",
            hotspot_confidence: "high",
            frp: "185.0",
            bright_ti4: "367.2",
            daynight: "N",
            hotspot_geometry: { type: "Point", coordinates: [86.15, 23.67] },
            facility_name: "Bokaro Steel",
            facility_type: "steel",
            facility_state: "Jharkhand",
            facility_district: "Bokaro",
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

    const res = await request(app)
      .get("/api/v1/events?primary_class=industrial&is_anomalous=true&sub_class=industrial_fire")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].primary_class).toBe("industrial");
    expect(res.body.data[0].is_anomalous).toBe(true);
    expect(res.body.data[0].z_score_frp).toBe(0);
    expect(res.body.data[0].hotspot).toBeDefined();
    expect(res.body.data[0].facility.name).toBe("Bokaro Steel");
  });

  it("GET /api/v1/events - should return 400 when invalid primary_class is passed", async () => {
    const res = await request(app)
      .get("/api/v1/events?primary_class=invalid_class")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("GET /api/v1/events/:id - should return event detail with full joins and feedback", async () => {
    vi.spyOn(db, "query")
      .mockResolvedValueOnce({
        rows: [
          {
            id: eventId,
            hotspot_id: "h1",
            facility_id: "f1",
            primary_class: "industrial",
            sub_class: "industrial_fire",
            land_cover_type: "built_up",
            distance_to_facility_m: "120",
            recurrence_count_90d: 1,
            z_score_frp: "0",
            confidence_score: "0.95",
            model_version: "v1.0",
            is_anomalous: true,
            created_at: new Date().toISOString(),
            latitude: 23.67,
            longitude: 86.15,
            acq_date: "2026-08-28",
            acq_time: "1945",
            satellite: "N",
            instrument: "VIIRS",
            hotspot_confidence: "high",
            frp: "185.0",
            bright_ti4: "367.2",
            daynight: "N",
            raw_payload: {},
            hotspot_geometry: { type: "Point", coordinates: [86.15, 23.67] },
            facility_osm_id: "way_1",
            facility_name: "Bokaro Steel",
            facility_type: "steel",
            facility_state: "Jharkhand",
            facility_district: "Bokaro",
            facility_geometry: { type: "Point", coordinates: [86.15, 23.67] },
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "fb1",
            classified_event_id: eventId,
            user_id: "u1",
            corrected_label: "industrial_fire",
            notes: "Confirmed flare spike",
            created_at: new Date().toISOString(),
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      });

    const res = await request(app)
      .get(`/api/v1/events/${eventId}`)
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(eventId);
    expect(res.body.data.z_score_frp).toBe(0);
    expect(res.body.data.feedback_history.length).toBe(1);
  });
});
