import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import http from "http";
import express from "express";
import { io as ClientSocket, Socket as ClientSocketType } from "socket.io-client";
import { initSocketServer, closeSocketServer, emitAlertCreated, emitClassifiedEventCreated, clearEmittedAlertCache } from "../src/realtime/socket";
import { REALTIME_EVENTS, AlertCreatedPayload, ClassifiedEventCreatedPayload } from "../src/realtime/events";
import { signToken } from "../src/utils/jwt";
import { AlertService } from "../src/services/alert.service";
import * as db from "../src/db";

vi.mock("../src/db", () => ({
  query: vi.fn(async (_sql: string, params?: unknown[]) => {
    const email = typeof params?.[0] === "string" ? params[0] : "analyst@aagnazar.in";
    const role = email.startsWith("admin") ? "admin" : email.startsWith("viewer") ? "viewer" : "analyst";
    return {
      rows: [{ id: `user-${role}`, name: `${role} user`, email, role, created_at: new Date().toISOString() }],
      rowCount: 1,
    };
  }),
}));

describe("Socket.io Real-Time Alert Server (D6.3)", () => {
  let server: http.Server;
  let port: number;
  let adminToken: string;
  let analystToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    const app = express();
    server = http.createServer(app);
    initSocketServer(server);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        if (address && typeof address === "object") {
          port = address.port;
        }
        resolve();
      });
    });

    adminToken = signToken({
      userId: "u-admin",
      email: "admin@aagnazar.in",
      name: "Admin User",
      role: "admin",
    });

    analystToken = signToken({
      userId: "u-analyst",
      email: "analyst@aagnazar.in",
      name: "Analyst User",
      role: "analyst",
    });

    viewerToken = signToken({
      userId: "u-viewer",
      email: "viewer@aagnazar.in",
      name: "Viewer User",
      role: "viewer",
    });
  });

  afterAll(async () => {
    await closeSocketServer();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    clearEmittedAlertCache();
    vi.clearAllMocks();
  });

  it("should reject unauthenticated socket connection with an authentication error", async () => {
    const client: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
      transports: ["websocket"],
      reconnection: false,
    });

    const errorPromise = new Promise<string>((resolve) => {
      client.on("connect_error", (err) => {
        resolve(err.message);
      });
    });

    const message = await errorPromise;
    expect(message).toContain("Authentication required");
    client.close();
  });

  it("should reject connection with invalid or expired JWT token", async () => {
    const client: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
      auth: { token: "invalid.jwt.token" },
      transports: ["websocket"],
      reconnection: false,
    });

    const errorPromise = new Promise<string>((resolve) => {
      client.on("connect_error", (err) => {
        resolve(err.message);
      });
    });

    const message = await errorPromise;
    expect(message).toContain("Authentication failed");
    client.close();
  });

  it("should successfully connect authenticated admin, analyst, and viewer clients", async () => {
    const connectClient = (token: string): Promise<ClientSocketType> => {
      return new Promise((resolve, reject) => {
        const client: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
          auth: { token },
          transports: ["websocket"],
        });
        client.on("connect", () => resolve(client));
        client.on("connect_error", (err) => reject(err));
      });
    };

    const adminClient = await connectClient(adminToken);
    const analystClient = await connectClient(analystToken);
    const viewerClient = await connectClient(viewerToken);

    expect(adminClient.connected).toBe(true);
    expect(analystClient.connected).toBe(true);
    expect(viewerClient.connected).toBe(true);

    adminClient.close();
    analystClient.close();
    viewerClient.close();
  });

  it("should broadcast high-severity alert to all connected authenticated clients", async () => {
    const client: ClientSocketType = await new Promise((resolve, reject) => {
      const c = ClientSocket(`http://localhost:${port}`, {
        auth: { token: analystToken },
        transports: ["websocket"],
      });
      c.on("connect", () => resolve(c));
      c.on("connect_error", reject);
    });

    const alertPayload: AlertCreatedPayload = {
      id: "a0000000-0000-0000-0000-000000000099",
      classified_event_id: "e0000000-0000-0000-0000-000000000001",
      severity: "high",
      status: "new",
      sent_at: new Date().toISOString(),
      event: {
        primary_class: "industrial",
        sub_class: "industrial_fire",
        confidence_score: 0.98,
        is_anomalous: true,
        facility_name: "Bokaro Steel Plant",
        frp: 210.5,
      },
    };

    const receivePromise = new Promise<AlertCreatedPayload>((resolve) => {
      client.on(REALTIME_EVENTS.ALERT_CREATED, (data: AlertCreatedPayload) => {
        resolve(data);
      });
    });

    const emitted = emitAlertCreated(alertPayload);
    expect(emitted).toBe(true);

    const receivedAlert = await receivePromise;
    expect(receivedAlert.id).toBe(alertPayload.id);
    expect(receivedAlert.severity).toBe("high");
    expect(receivedAlert.event?.facility_name).toBe("Bokaro Steel Plant");
    expect(receivedAlert.event?.frp).toBe(210.5);

    client.close();
  });

  it("should broadcast every newly classified event, even when no alert is created", async () => {
    const client: ClientSocketType = await new Promise((resolve, reject) => {
      const c = ClientSocket(`http://localhost:${port}`, {
        auth: { token: analystToken },
        transports: ["websocket"],
      });
      c.on("connect", () => resolve(c));
      c.on("connect_error", reject);
    });

    const payload: ClassifiedEventCreatedPayload = {
      classified_event_id: "e0000000-0000-0000-0000-000000000004",
      hotspot_id: "h0000000-0000-0000-0000-000000000004",
      primary_class: "natural",
      sub_class: "natural_thermal",
      is_anomalous: false,
      created_at: new Date().toISOString(),
    };
    const received = new Promise<ClassifiedEventCreatedPayload>((resolve) => {
      client.on(REALTIME_EVENTS.CLASSIFIED_EVENT_CREATED, resolve);
    });

    expect(emitClassifiedEventCreated(payload)).toBe(true);
    expect((await received).classified_event_id).toBe(payload.classified_event_id);
    client.close();
  });

  it("should broadcast medium and low severity alerts so connected maps stay current", async () => {
    const client: ClientSocketType = await new Promise((resolve, reject) => {
      const c = ClientSocket(`http://localhost:${port}`, {
        auth: { token: analystToken },
        transports: ["websocket"],
      });
      c.on("connect", () => resolve(c));
      c.on("connect_error", reject);
    });

    const received: AlertCreatedPayload[] = [];
    client.on(REALTIME_EVENTS.ALERT_CREATED, (alert: AlertCreatedPayload) => {
      received.push(alert);
    });

    // Medium severity
    const mediumAlert: AlertCreatedPayload = {
      id: "a0000000-0000-0000-0000-000000000050",
      classified_event_id: "e0000000-0000-0000-0000-000000000002",
      severity: "medium",
      status: "new",
      sent_at: new Date().toISOString(),
    };

    // Low severity
    const lowAlert: AlertCreatedPayload = {
      id: "a0000000-0000-0000-0000-000000000051",
      classified_event_id: "e0000000-0000-0000-0000-000000000003",
      severity: "low",
      status: "new",
      sent_at: new Date().toISOString(),
    };

    const emittedMedium = emitAlertCreated(mediumAlert);
    const emittedLow = emitAlertCreated(lowAlert);

    expect(emittedMedium).toBe(true);
    expect(emittedLow).toBe(true);

    await new Promise((r) => setTimeout(r, 100));
    expect(received.map((alert) => alert.severity).sort()).toEqual(["low", "medium"]);

    client.close();
  });

  it("should be idempotent and not broadcast duplicate events for the same alert ID", async () => {
    const client: ClientSocketType = await new Promise((resolve, reject) => {
      const c = ClientSocket(`http://localhost:${port}`, {
        auth: { token: analystToken },
        transports: ["websocket"],
      });
      c.on("connect", () => resolve(c));
      c.on("connect_error", reject);
    });

    let receiveCount = 0;
    client.on(REALTIME_EVENTS.ALERT_CREATED, () => {
      receiveCount++;
    });

    const highAlert: AlertCreatedPayload = {
      id: "a0000000-0000-0000-0000-000000000088",
      classified_event_id: "e0000000-0000-0000-0000-000000000001",
      severity: "high",
      status: "new",
      sent_at: new Date().toISOString(),
    };

    // First emission succeeds
    const firstEmit = emitAlertCreated(highAlert);
    expect(firstEmit).toBe(true);

    // Immediate second emission with same ID should be suppressed by idempotency guard
    const secondEmit = emitAlertCreated(highAlert);
    expect(secondEmit).toBe(false);

    await new Promise((r) => setTimeout(r, 100));
    expect(receiveCount).toBe(1);

    client.close();
  });

  it("AlertService.createAlert should persist alert to database and trigger broadcast for high-severity", async () => {
    const mockDbQuery = vi.spyOn(db, "query");

    const client: ClientSocketType = await new Promise((resolve, reject) => {
      const c = ClientSocket(`http://localhost:${port}`, {
        auth: { token: adminToken },
        transports: ["websocket"],
      });
      c.on("connect", () => resolve(c));
      c.on("connect_error", reject);
    });

    // Mock INSERT INTO alerts
    mockDbQuery.mockResolvedValueOnce({
      rows: [
        {
          id: "a0000000-0000-0000-0000-000000000077",
          classified_event_id: "e0000000-0000-0000-0000-000000000001",
          severity: "high",
          status: "new",
          sent_at: new Date().toISOString(),
        },
      ],
      rowCount: 1,
    } as any);

    // Mock getAlertById SELECT query
    mockDbQuery.mockResolvedValueOnce({
      rows: [
        {
          id: "a0000000-0000-0000-0000-000000000077",
          classified_event_id: "e0000000-0000-0000-0000-000000000001",
          severity: "high",
          status: "new",
          sent_at: new Date().toISOString(),
          primary_class: "industrial",
          sub_class: "industrial_fire",
          confidence_score: "0.95",
          is_anomalous: true,
          facility_name: "Bina Flare Stack Alpha",
          frp: "145.0",
        },
      ],
      rowCount: 1,
    } as any);

    const receivedAlertPromise = new Promise<AlertCreatedPayload>((resolve) => {
      client.on(REALTIME_EVENTS.ALERT_CREATED, resolve);
    });

    const created = await AlertService.createAlert({
      classified_event_id: "e0000000-0000-0000-0000-000000000001",
      severity: "high",
    });

    expect(created.id).toBe("a0000000-0000-0000-0000-000000000077");

    const broadcast = await receivedAlertPromise;
    expect(broadcast.id).toBe("a0000000-0000-0000-0000-000000000077");
    expect(broadcast.severity).toBe("high");
    expect(broadcast.event?.facility_name).toBe("Bina Flare Stack Alpha");

    client.close();
    mockDbQuery.mockRestore();
  });
});
