import { describe, expect, it, vi } from "vitest";

const databaseMocks = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock("../src/db", () => databaseMocks);

import { EventService } from "../src/services/event.service";

describe("EventService regional filters", () => {
  it("filters unlinked events by the state and district of their nearest facility", async () => {
    databaseMocks.query
      .mockResolvedValueOnce({ rows: [{ count: "0" }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await EventService.getEvents({
      state: "Gujarat",
      district: "Jamnagar",
      limit: 20,
      offset: 0,
    });

    expect(result).toEqual({ events: [], total: 0 });

    const [countSql, countValues] = databaseMocks.query.mock.calls[0];
    const [listSql, listValues] = databaseMocks.query.mock.calls[1];

    for (const sql of [countSql, listSql]) {
      expect(sql).toContain("COALESCE(f.state");
      expect(sql).toContain("COALESCE(f.district");
      expect(sql).toContain("ST_Distance(candidate.geometry::geography, h.geometry::geography)");
    }
    expect(countValues).toEqual(["%Gujarat%", "%Jamnagar%"]);
    expect(listValues).toEqual(["%Gujarat%", "%Jamnagar%", 20, 0]);
  });
});
