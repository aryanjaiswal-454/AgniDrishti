import { FacilityType, GeoJSONPoint } from "@agnidrishti/shared-types";
import { OverpassElement } from "./client";
import { normalizeCoordinate } from "../firms/normalizer";

export interface NormalizedFacilityInput {
  osm_id: string;
  name: string | null;
  facility_type: FacilityType;
  geometry: GeoJSONPoint;
  latitude: number;
  longitude: number;
  state: string | null;
  district: string | null;
  source: string;
}

/**
 * Restrict bulk imports to the industrial categories supported by the product.
 * A generic `power=plant` tag alone is deliberately insufficient: it would
 * otherwise import solar and wind sites into a thermal-industrial registry.
 */
export function isTargetIndustrialOsmElement(element: OverpassElement): boolean {
  const tags = element.tags || {};
  const industrial = (tags.industrial || "").toLowerCase();
  const manMade = (tags.man_made || "").toLowerCase();
  const power = (tags.power || "").toLowerCase();
  const plantSource = (tags["plant:source"] || "").toLowerCase();
  const landuse = (tags.landuse || "").toLowerCase();
  const name = (tags.name || "").toLowerCase();

  return (
    (manMade === "works" && industrial.includes("oil")) ||
    industrial === "oil" ||
    industrial === "chemical" ||
    industrial === "petrochemical" ||
    (power === "plant" && /coal|gas|oil|thermal/.test(plantSource)) ||
    (power === "plant" && /thermal|super thermal|ntpc|tps|power station/.test(name)) ||
    industrial === "iron_and_steel" ||
    industrial === "steel" ||
    landuse === "quarry" ||
    manMade === "mineshaft" ||
    industrial === "mine" ||
    (manMade === "storage_tank" && tags.content === "lng") ||
    industrial === "gas" ||
    /refinery|petrochemical|steel|lng|gas terminal|petronet|coal|mine|mining|colliery|coalfield|opencast/.test(name)
  );
}

/**
 * Classify OSM tags and facility name into canonical FacilityType enum.
 */
export function classifyFacilityType(tags: Record<string, string> = {}): FacilityType {
  const industrial = (tags.industrial || "").toLowerCase();
  const manMade = (tags.man_made || "").toLowerCase();
  const power = (tags.power || "").toLowerCase();
  const plantSource = (tags["plant:source"] || "").toLowerCase();
  const landuse = (tags.landuse || "").toLowerCase();
  const name = (tags.name || "").toLowerCase();

  // 1. LNG Terminal
  if (
    tags.content === "lng" ||
    name.includes("lng") ||
    name.includes("gas terminal") ||
    name.includes("petronet")
  ) {
    return "lng_terminal";
  }

  // 2. Oil Refinery
  if (
    (manMade === "works" && industrial.includes("oil")) ||
    industrial === "oil" ||
    name.includes("refinery") ||
    name.includes("oil refinery") ||
    industrial === "oil_refinery"
  ) {
    return "refinery";
  }

  // 3. Petrochemical
  if (
    industrial === "chemical" ||
    industrial === "petrochemical" ||
    name.includes("petrochemical") ||
    name.includes("chemical complex")
  ) {
    return "petrochemical";
  }

  // 4. Thermal Power Plant
  if (
    power === "plant" ||
    power === "generator" ||
    plantSource.includes("coal") ||
    plantSource.includes("gas") ||
    plantSource.includes("thermal") ||
    name.includes("thermal power") ||
    name.includes("tps") ||
    name.includes("stps") ||
    name.includes("power station")
  ) {
    return "power_plant";
  }

  // 5. Steel Industry
  if (
    industrial === "iron_and_steel" ||
    industrial === "steel" ||
    name.includes("steel") ||
    name.includes("isp") ||
    name.includes("blast furnace") ||
    name.includes("sail") ||
    name.includes("jsw steel") ||
    name.includes("tata steel")
  ) {
    return "steel";
  }

  // 6. Mining & Coalfields
  if (
    landuse === "quarry" ||
    manMade === "mineshaft" ||
    industrial === "mine" ||
    name.includes("mine") ||
    name.includes("mining") ||
    name.includes("colliery") ||
    name.includes("coalfield") ||
    name.includes("opencast")
  ) {
    return "mining";
  }

  // 7. General Industrial fallback
  return "other_industrial";
}

/**
 * Normalize raw Overpass element into internal facility schema.
 */
export function normalizeOsmElement(element: OverpassElement): NormalizedFacilityInput | null {
  const tags = element.tags || {};
  const osmId = `osm_${element.type}_${element.id}`;

  // Extract coordinates (node lat/lon or way/relation center)
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;

  if (lat === undefined || lon === undefined) {
    return null;
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }

  const normalizedLat = normalizeCoordinate(lat);
  const normalizedLon = normalizeCoordinate(lon);

  // Preserve unnamed facilities with name = null (flagged for review)
  const rawName = tags.name || tags["name:en"] || tags.operator || tags.brand;
  const name = rawName ? rawName.trim() : null;

  const facilityType = classifyFacilityType(tags);

  const state = tags["addr:state"] || tags["is_in:state"] || null;
  const district = tags["addr:district"] || tags["is_in:district"] || tags["addr:city"] || null;

  return {
    osm_id: osmId,
    name,
    facility_type: facilityType,
    latitude: normalizedLat,
    longitude: normalizedLon,
    geometry: {
      type: "Point",
      coordinates: [normalizedLon, normalizedLat],
    },
    state,
    district,
    source: "osm",
  };
}

/**
 * Normalize an array of Overpass elements.
 */
export function normalizeOsmElements(elements: OverpassElement[]): {
  valid: NormalizedFacilityInput[];
  invalidCount: number;
} {
  const valid: NormalizedFacilityInput[] = [];
  let invalidCount = 0;

  for (const el of elements) {
    const normalized = normalizeOsmElement(el);
    if (normalized) {
      valid.push(normalized);
    } else {
      invalidCount++;
    }
  }

  return { valid, invalidCount };
}

