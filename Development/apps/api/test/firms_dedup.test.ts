import { describe, it, expect } from "vitest";
import { normalizeCoordinate, normalizeFirmsCsv } from "../src/ingestion/firms/normalizer";

describe("NASA FIRMS Deduplication & Coordinates Normalization", () => {
  it("should normalize nearly identical floating-point coordinates to the exact same 5 decimal place string key", () => {
    const coord1 = 22.35561001;
    const coord2 = 22.35561009;

    const norm1 = normalizeCoordinate(coord1);
    const norm2 = normalizeCoordinate(coord2);

    expect(norm1).toBe(22.35561);
    expect(norm2).toBe(22.35561);
    expect(norm1).toBe(norm2);
  });

  it("should create deterministic deduplication keys for same acquisition event", () => {
    const csv = `latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
22.3556101,69.8519201,345.8,0.4,0.38,2026-08-28,1830,N,VIIRS,nominal,2.0NRT,298.2,45.6,N
22.3556109,69.8519209,345.8,0.4,0.38,2026-08-28,1830,N,VIIRS,nominal,2.0NRT,298.2,45.6,N`;

    const { valid } = normalizeFirmsCsv(csv);
    expect(valid.length).toBe(2);

    // Dedup keys based on DB constraint: (latitude, longitude, acq_date, acq_time, instrument, satellite)
    const key1 = `${valid[0].latitude}_${valid[0].longitude}_${valid[0].acq_date}_${valid[0].acq_time}_${valid[0].instrument}_${valid[0].satellite}`;
    const key2 = `${valid[1].latitude}_${valid[1].longitude}_${valid[1].acq_date}_${valid[1].acq_time}_${valid[1].instrument}_${valid[1].satellite}`;

    expect(key1).toBe(key2);
  });

  it("should differentiate events with different satellites or acquisition times", () => {
    const csv = `latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
22.35561,69.85192,345.8,0.4,0.38,2026-08-28,1830,N,VIIRS,nominal,2.0NRT,298.2,45.6,N
22.35561,69.85192,345.8,0.4,0.38,2026-08-28,1945,1,VIIRS,nominal,2.0NRT,298.2,45.6,N`;

    const { valid } = normalizeFirmsCsv(csv);
    const key1 = `${valid[0].latitude}_${valid[0].longitude}_${valid[0].acq_date}_${valid[0].acq_time}_${valid[0].instrument}_${valid[0].satellite}`;
    const key2 = `${valid[1].latitude}_${valid[1].longitude}_${valid[1].acq_date}_${valid[1].acq_time}_${valid[1].instrument}_${valid[1].satellite}`;

    expect(key1).not.toBe(key2);
  });
});
