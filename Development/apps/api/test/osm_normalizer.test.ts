import { describe, it, expect } from "vitest";
import { classifyFacilityType, normalizeOsmElement, normalizeOsmElements } from "../src/ingestion/osm/normalizer";
import { OverpassElement } from "../src/ingestion/osm/client";

describe("OpenStreetMap Normalizer & Tag Classifier", () => {
  it("should classify oil refinery correctly", () => {
    expect(classifyFacilityType({ man_made: "works", industrial: "oil" })).toBe("refinery");
    expect(classifyFacilityType({ name: "Mathura Oil Refinery" })).toBe("refinery");
  });

  it("should classify thermal power plant correctly", () => {
    expect(classifyFacilityType({ power: "plant", "plant:source": "coal" })).toBe("power_plant");
    expect(classifyFacilityType({ name: "Vindhyachal Super Thermal Power Station" })).toBe("power_plant");
  });

  it("should classify steel plant correctly", () => {
    expect(classifyFacilityType({ industrial: "iron_and_steel" })).toBe("steel");
    expect(classifyFacilityType({ name: "Bokaro Steel Plant (SAIL)" })).toBe("steel");
  });

  it("should classify mining quarry and opencast coalfields correctly", () => {
    expect(classifyFacilityType({ landuse: "quarry" })).toBe("mining");
    expect(classifyFacilityType({ man_made: "mineshaft" })).toBe("mining");
    expect(classifyFacilityType({ name: "Jharia Coalfield Opencast" })).toBe("mining");
  });

  it("should classify LNG terminal correctly", () => {
    expect(classifyFacilityType({ man_made: "storage_tank", content: "lng" })).toBe("lng_terminal");
    expect(classifyFacilityType({ name: "Dahej LNG Terminal" })).toBe("lng_terminal");
  });

  it("should fallback unknown industrial facilities to other_industrial", () => {
    expect(classifyFacilityType({ landuse: "industrial" })).toBe("other_industrial");
    expect(classifyFacilityType({})).toBe("other_industrial");
  });

  it("should normalize node element with point geometry and retain missing names as null", () => {
    const rawNode: OverpassElement = {
      type: "node",
      id: 123456,
      lat: 22.3556,
      lon: 69.8519,
      tags: {
        man_made: "works",
        industrial: "oil",
        "addr:state": "Gujarat",
        "addr:district": "Jamnagar",
      },
    };

    const normalized = normalizeOsmElement(rawNode);
    expect(normalized).not.toBeNull();
    expect(normalized?.osm_id).toBe("osm_node_123456");
    expect(normalized?.name).toBeNull(); // Missing name retained as null
    expect(normalized?.facility_type).toBe("refinery");
    expect(normalized?.state).toBe("Gujarat");
    expect(normalized?.district).toBe("Jamnagar");
    expect(normalized?.geometry.type).toBe("Point");
    expect(normalized?.geometry.coordinates).toEqual([69.8519, 22.3556]);
  });

  it("should normalize way element using center coordinates", () => {
    const rawWay: OverpassElement = {
      type: "way",
      id: 987654,
      center: { lat: 23.6693, lon: 86.1511 },
      tags: {
        name: "Bokaro Steel Plant",
        industrial: "iron_and_steel",
      },
    };

    const normalized = normalizeOsmElement(rawWay);
    expect(normalized).not.toBeNull();
    expect(normalized?.osm_id).toBe("osm_way_987654");
    expect(normalized?.name).toBe("Bokaro Steel Plant");
    expect(normalized?.facility_type).toBe("steel");
    expect(normalized?.geometry.coordinates).toEqual([86.1511, 23.6693]);
  });

  it("should safely filter out elements without coordinates", () => {
    const rawList: OverpassElement[] = [
      { type: "node", id: 1, lat: 22.0, lon: 77.0, tags: { name: "Valid" } },
      { type: "way", id: 2, tags: { name: "No Center" } }, // missing center/lat/lon
    ];

    const result = normalizeOsmElements(rawList);
    expect(result.valid.length).toBe(1);
    expect(result.invalidCount).toBe(1);
    expect(result.valid[0].name).toBe("Valid");
  });
});
