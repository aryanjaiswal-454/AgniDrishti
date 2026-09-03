import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/index";
import * as db from "../src/db";
import { signToken } from "../src/utils/jwt";

vi.mock("../src/db", () => ({
  query: vi.fn(),
  testDbConnection: vi.fn().mockResolvedValue({ ok: true, postgisVersion: "3.4" }),
}));

describe("Authentication & User API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    id: "a0000000-0000-0000-0000-000000000001",
    name: "Duty Analyst",
    email: "analyst@aagnazar.in",
    password_hash: "$2a$10$abcdefghijklmnopqrstuvwxyz123456", // mocked
    role: "analyst",
    created_at: new Date().toISOString(),
  };

  it("GET /api/v1/auth/me - should return current user profile with valid Bearer token", async () => {
    const token = signToken({
      userId: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      role: "analyst",
    });

    vi.spyOn(db, "query").mockResolvedValueOnce({
      rows: [{ id: mockUser.id, name: mockUser.name, email: mockUser.email, role: "analyst", created_at: mockUser.created_at }],
      rowCount: 1,
      command: "SELECT",
      oid: 0,
      fields: [],
    });

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(mockUser.email);
  });

  it("GET /api/v1/auth/me - should reject request without token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTHENTICATION_ERROR");
  });

  it("POST /api/v1/auth/register - should allow admin to register new user", async () => {
    const adminToken = signToken({
      userId: "00000000-0000-0000-0000-000000000000",
      email: "admin@aagnazar.in",
      name: "Admin User",
      role: "admin",
    });

    // Check duplicate
    vi.spyOn(db, "query")
      .mockResolvedValueOnce({ rows: [], rowCount: 0, command: "SELECT", oid: 0, fields: [] }) // duplicate check
      .mockResolvedValueOnce({
        rows: [{ id: "new-user-id", name: "New Analyst", email: "new@aagnazar.in", role: "analyst", created_at: new Date().toISOString() }],
        rowCount: 1,
        command: "INSERT",
        oid: 0,
        fields: [],
      }); // insert

    const res = await request(app)
      .post("/api/v1/auth/register")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "New Analyst",
        email: "new@aagnazar.in",
        password: "SecurePassword123!",
        role: "analyst",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("new@aagnazar.in");
  });

  it("POST /api/v1/auth/register - should deny non-admin users with 403 Forbidden", async () => {
    const analystToken = signToken({
      userId: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      role: "analyst",
    });

    const res = await request(app)
      .post("/api/v1/auth/register")
      .set("Authorization", `Bearer ${analystToken}`)
      .send({
        name: "Viewer User",
        email: "viewer@aagnazar.in",
        password: "SecurePassword123!",
        role: "viewer",
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN_ERROR");
  });
});
