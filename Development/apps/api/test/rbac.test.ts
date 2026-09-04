import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/index";
import * as db from "../src/db";
import { signToken } from "../src/utils/jwt";

vi.mock("../src/db", () => ({
  query: vi.fn(),
  testDbConnection: vi.fn().mockResolvedValue({ ok: true }),
}));

describe("Role-Based Access Control (RBAC) Enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const viewerToken = signToken({
    userId: "v0000000-0000-0000-0000-000000000001",
    email: "viewer@aagnazar.in",
    name: "Viewer User",
    role: "viewer",
  });

  const analystToken = signToken({
    userId: "a0000000-0000-0000-0000-000000000001",
    email: "analyst@aagnazar.in",
    name: "Analyst User",
    role: "analyst",
  });

  const testAlertId = "00000000-0000-0000-0000-000000000001";
  const testEventId = "11111111-1111-1111-1111-111111111111";

  it("PATCH /api/v1/alerts/:id - should BLOCK a viewer from updating an alert (403 Forbidden)", async () => {
    const res = await request(app)
      .patch(`/api/v1/alerts/${testAlertId}`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ status: "acknowledged" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN_ERROR");
  });

  it("PATCH /api/v1/alerts/:id - should ALLOW an analyst to update an alert", async () => {
    vi.spyOn(db, "query")
      .mockResolvedValueOnce({ rows: [{ id: testAlertId, status: "new" }], rowCount: 1, command: "SELECT", oid: 0, fields: [] })
      .mockResolvedValueOnce({
        rows: [{ id: testAlertId, classified_event_id: testEventId, severity: "high", status: "acknowledged", sent_at: new Date().toISOString(), acknowledged_by: "analyst-id" }],
        rowCount: 1,
        command: "UPDATE",
        oid: 0,
        fields: [],
      });

    const res = await request(app)
      .patch(`/api/v1/alerts/${testAlertId}`)
      .set("Authorization", `Bearer ${analystToken}`)
      .send({ status: "acknowledged" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("acknowledged");
  });

  it("PATCH /api/v1/alerts/:id - should BLOCK changing a closed alert", async () => {
    vi.spyOn(db, "query").mockResolvedValueOnce({
      rows: [{ id: testAlertId, status: "resolved" }],
      rowCount: 1,
      command: "SELECT",
      oid: 0,
      fields: [],
    });

    const res = await request(app)
      .patch(`/api/v1/alerts/${testAlertId}`)
      .set("Authorization", `Bearer ${analystToken}`)
      .send({ status: "false_positive" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT_ERROR");
  });

  it("POST /api/v1/events/:id/feedback - should BLOCK a viewer from submitting feedback", async () => {
    const res = await request(app)
      .post(`/api/v1/events/${testEventId}/feedback`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ corrected_label: "industrial_fire", notes: "Viewer note" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN_ERROR");
  });

  it("POST /api/v1/events/:id/feedback - should ALLOW an analyst to submit feedback", async () => {
    vi.spyOn(db, "query")
      .mockResolvedValueOnce({ rows: [{ id: testEventId }], rowCount: 1, command: "SELECT", oid: 0, fields: [] })
      .mockResolvedValueOnce({
        rows: [{ id: "f1", classified_event_id: testEventId, user_id: "analyst-id", corrected_label: "industrial_fire", notes: "Note", created_at: new Date().toISOString() }],
        rowCount: 1,
        command: "INSERT",
        oid: 0,
        fields: [],
      });

    const res = await request(app)
      .post(`/api/v1/events/${testEventId}/feedback`)
      .set("Authorization", `Bearer ${analystToken}`)
      .send({ corrected_label: "industrial_fire", notes: "Note" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
