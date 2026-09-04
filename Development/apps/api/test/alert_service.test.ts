import { describe, expect, it, vi } from "vitest";

const databaseMocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../src/db", () => databaseMocks);
vi.mock("../src/realtime/socket", () => ({ emitAlertCreated: vi.fn() }));

import { AlertService } from "../src/services/alert.service";

describe("AlertService active policy filter", () => {
  it("keeps historical records but only returns open alerts whose events remain actionable", async () => {
    databaseMocks.query
      .mockResolvedValueOnce({ rows: [{ count: "1" }] })
      .mockResolvedValueOnce({ rows: [] });

    await AlertService.getAlerts({ limit: 10, offset: 0, active_only: true });

    expect(databaseMocks.query.mock.calls[0][0]).toContain("active_ce.is_anomalous = true OR active_ce.sub_class = 'industrial_fire'");
    expect(databaseMocks.query.mock.calls[0][0]).toContain("a.status IN ('new', 'acknowledged')");
  });
});
