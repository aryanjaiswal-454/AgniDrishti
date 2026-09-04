import { describe, expect, it, vi } from "vitest";

const databaseMocks = vi.hoisted(() => ({ query: vi.fn(), withTransaction: vi.fn() }));
const socketMocks = vi.hoisted(() => ({ emitAlertCreated: vi.fn(), emitSystemSettingsUpdated: vi.fn() }));

vi.mock("../src/db", () => databaseMocks);
vi.mock("../src/realtime/socket", () => socketMocks);
vi.mock("../src/services/alert.service", () => ({ AlertService: { getAlertById: vi.fn() } }));

import { SettingsService } from "../src/services/settings.service";

describe("SettingsService policy recalculation", () => {
  it("recalculates anomaly markers, active alerts, and creates newly qualifying alerts in one transaction", async () => {
    const client = {
      query: vi.fn()
        .mockResolvedValueOnce({
          rows: [{
            critical_frp_threshold: "120",
            anomaly_z_score_threshold: "2.5",
            default_map_baselayer: "satellite",
            updated_at: "2026-09-04T00:00:00.000Z",
            updated_by: "admin-id",
          }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 4 })
        .mockResolvedValueOnce({ rows: [], rowCount: 2 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }),
    };
    databaseMocks.withTransaction.mockImplementation(async (callback: (transactionClient: typeof client) => Promise<unknown>) => callback(client));

    const result = await SettingsService.updateSettings({
      critical_frp_threshold: 120,
      anomaly_z_score_threshold: 2.5,
      default_map_baselayer: "satellite",
    }, "admin-id");

    expect(result.recalculation).toEqual({
      events_reclassified: 4,
      alerts_created: 0,
      alerts_severity_updated: 2,
    });
    expect(client.query.mock.calls[1][0]).toContain("COALESCE(h.frp, 0) >= $2");
    expect(client.query.mock.calls[2][0]).toContain("SET severity = qualifying.severity");
    expect(client.query.mock.calls[3][0]).toContain("INSERT INTO alerts");
    expect(socketMocks.emitSystemSettingsUpdated).toHaveBeenCalledWith(result.settings);
  });
});
