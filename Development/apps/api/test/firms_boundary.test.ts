import { describe, expect, it } from "vitest";
import { isPointInIndia } from "../src/ingestion/firms/india-boundary";
import { redactFirmsError } from "../src/ingestion/firms/client";
import { resolveFirmsSources } from "../src/ingestion/firms/service";

describe("FIRMS India-only ingestion", () => {
  it("accepts Indian locations and excludes Sri Lanka and neighbouring countries", () => {
    expect(isPointInIndia(13.0827, 80.2707)).toBe(true); // Chennai
    expect(isPointInIndia(19.076, 72.8777)).toBe(true); // Mumbai
    expect(isPointInIndia(6.9271, 79.8612)).toBe(false); // Colombo
    expect(isPointInIndia(23.8103, 90.4125)).toBe(false); // Dhaka
  });

  it("uses all configured sources for scheduled jobs and preserves an explicit source", () => {
    expect(resolveFirmsSources("scheduled-cron")).toEqual(["VIIRS_SNPP_NRT", "MODIS_NRT"]);
    expect(resolveFirmsSources("MODIS_NRT")).toEqual(["MODIS_NRT"]);
  });

  it("redacts a FIRMS map key embedded in an HTTP error URL", () => {
    const message = redactFirmsError(
      new Error("Request failed: https://firms.modaps.eosdis.nasa.gov/api/area/csv/example-key/MODIS_NRT/68,6,98,38/1")
    );

    expect(message).not.toContain("example-key");
    expect(message).toContain("[REDACTED]");
  });
});
