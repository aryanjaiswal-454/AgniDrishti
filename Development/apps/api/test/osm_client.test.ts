import { describe, expect, it } from "vitest";
import { chunkBoundingBox } from "../src/ingestion/osm/client";
import { isTargetIndustrialOsmElement } from "../src/ingestion/osm/normalizer";

describe("chunkBoundingBox", () => {
  it("splits a valid bbox into the requested row and column grid", () => {
    expect(chunkBoundingBox("0,0,10,20", 2, 2)).toEqual([
      "0.0000,0.0000,5.0000,10.0000",
      "0.0000,10.0000,5.0000,20.0000",
      "5.0000,0.0000,10.0000,10.0000",
      "5.0000,10.0000,10.0000,20.0000",
    ]);
  });

  it("rejects malformed and reversed bounding boxes", () => {
    expect(() => chunkBoundingBox("6.5,68,37.5", 2, 3)).toThrow("Invalid OSM bounding box");
    expect(() => chunkBoundingBox("37.5,68,6.5,97.5", 2, 3)).toThrow("Invalid OSM bounding box");
  });

  it("keeps thermal-industrial facilities while excluding generic renewable power plants", () => {
    expect(isTargetIndustrialOsmElement({ type: "way", id: 1, tags: { power: "plant", "plant:source": "coal" } })).toBe(true);
    expect(isTargetIndustrialOsmElement({ type: "way", id: 2, tags: { industrial: "steel" } })).toBe(true);
    expect(isTargetIndustrialOsmElement({ type: "way", id: 3, tags: { power: "plant", "plant:source": "solar" } })).toBe(false);
  });
});
