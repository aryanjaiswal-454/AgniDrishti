import { describe, it, expect } from "vitest";
import { normalizeFirmsCsv, normalizeCoordinate } from "../src/ingestion/firms/normalizer";

describe("NASA FIRMS Normalizer", () => {
  it("should normalize valid VIIRS active fire CSV record", () => {
    const viirsCsv = `latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
22.35561,69.85192,345.8,0.4,0.38,2026-08-28,1830,N,VIIRS,nominal,2.0NRT,298.2,45.6,N`;

    const result = normalizeFirmsCsv(viirsCsv);

    expect(result.valid.length).toBe(1);
    expect(result.invalidCount).toBe(0);

    const record = result.valid[0];
    expect(record.latitude).toBe(22.35561);
    expect(record.longitude).toBe(69.85192);
    expect(record.bright_ti4).toBe(345.8);
    expect(record.brightness_temp).toBe(345.8);
    expect(record.frp).toBe(45.6);
    expect(record.instrument).toBe("VIIRS");
    expect(record.satellite).toBe("N");
    expect(record.confidence).toBe("nominal");
    expect(record.daynight).toBe("N");
    expect(record.acq_date).toBe("2026-08-28");
    expect(record.acq_time).toBe("1830");
    expect(record.raw_payload).toBeDefined();
    expect(record.raw_payload.version).toBe("2.0NRT");
  });

  it("should normalize valid MODIS active fire CSV record mapping brightness to bright_ti4", () => {
    const modisCsv = `latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight,type
21.85421,86.34211,325.4,1.1,1.0,2026-08-28,0750,1,MODIS,85,6.1NRT,295.1,142.6,D,0`;

    const result = normalizeFirmsCsv(modisCsv);

    expect(result.valid.length).toBe(1);
    expect(result.invalidCount).toBe(0);

    const record = result.valid[0];
    expect(record.latitude).toBe(21.85421);
    expect(record.longitude).toBe(86.34211);
    expect(record.bright_ti4).toBe(325.4);
    expect(record.brightness_temp).toBe(325.4);
    expect(record.frp).toBe(142.6);
    expect(record.instrument).toBe("MODIS");
    expect(record.satellite).toBe("1");
    expect(record.confidence).toBe("85");
    expect(record.daynight).toBe("D");
    expect(record.acq_date).toBe("2026-08-28");
    expect(record.acq_time).toBe("0750");
  });

  it("should round coordinates to 5 decimal places", () => {
    expect(normalizeCoordinate(22.355618999)).toBe(22.35562);
    expect(normalizeCoordinate(69.851921111)).toBe(69.85192);
  });

  it("should safely skip invalid coordinates without crashing the batch", () => {
    const mixedCsv = `latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
95.00000,69.85192,345.8,0.4,0.38,2026-08-28,1830,N,VIIRS,nominal,2.0NRT,298.2,45.6,N
22.35561,69.85192,345.8,0.4,0.38,2026-08-28,1830,N,VIIRS,nominal,2.0NRT,298.2,45.6,N
invalid,invalid,345.8,0.4,0.38,2026-08-28,1830,N,VIIRS,nominal,2.0NRT,298.2,45.6,N`;

    const result = normalizeFirmsCsv(mixedCsv);

    expect(result.valid.length).toBe(1);
    expect(result.invalidCount).toBe(2);
    expect(result.valid[0].latitude).toBe(22.35561);
  });

  it("should handle empty or whitespace CSV gracefully", () => {
    const result = normalizeFirmsCsv("   \n\n  ");
    expect(result.valid.length).toBe(0);
    expect(result.invalidCount).toBe(0);
  });
});
