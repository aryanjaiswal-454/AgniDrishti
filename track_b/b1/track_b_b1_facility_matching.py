"""Track B Phase B1: nearest OSM-facility matching for the shared FIRMS sample."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import geopandas as gpd
import pandas as pd
from pyproj import CRS
from shapely.geometry import Point


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
INPUT = ROOT / "data/sample/input"
FIRMS = INPUT / "firms_sample.csv"
OSM = INPUT / "osm_facilities_thoothukudi_2025q4.json"
FACILITIES_OUTPUT = ROOT / "data/sample/processed/track_b_b1_facilities.geojson"
MATCHES_OUTPUT = ROOT / "data/sample/processed/track_b_b1_facility_matches.csv"
VALIDATION_OUTPUT = ROOT / "data/sample/validation/track_b_b1_validation.json"
WGS84 = "EPSG:4326"
# A local equidistant projection centred on the pilot, used only for metre distances.
METRE_CRS = CRS.from_proj4("+proj=aeqd +lat_0=8.65 +lon_0=78.15 +datum=WGS84 +units=m +no_defs")


def is_facility(tags: dict[str, str]) -> bool:
    return (
        "industrial" in tags
        or tags.get("landuse") in {"industrial", "quarry"}
        or tags.get("man_made") in {"works", "petroleum_well", "mineshaft"}
        or tags.get("power") == "plant"
        or tags.get("substance") == "lng"
    )


def facility_type(tags: dict[str, str]) -> str:
    name = tags.get("name", "").casefold()
    source = tags.get("plant:source", "").casefold()
    industrial = tags.get("industrial", "").casefold()
    if tags.get("substance", "").casefold() == "lng" or industrial == "lng" or "lng" in name:
        return "lng_terminal"
    if tags.get("landuse") == "quarry" or tags.get("man_made") == "mineshaft" or industrial == "mine":
        return "mining"
    if industrial == "iron_and_steel" or "steel" in name:
        return "steel"
    if industrial in {"refinery", "oil"} or "refinery" in name:
        return "refinery"
    if industrial == "petrochemical" or "petrochemical" in name:
        return "petrochemical"
    if tags.get("power") == "plant":
        return "thermal_power_plant" if source in {"coal", "oil", "gas", "natural_gas", "biomass"} or "thermal" in name else "power_plant"
    if industrial == "chemical" or "chemical" in tags:
        return "chemical_industry"
    if industrial == "port":
        return "industrial_port"
    if tags.get("man_made") == "works":
        return "industrial_works"
    return "generic_industrial"


def coordinate(element: dict) -> tuple[float, float] | None:
    raw = element.get("center") or element
    if raw.get("lat") is None or raw.get("lon") is None:
        return None
    return float(raw["lat"]), float(raw["lon"])


def load_facilities() -> gpd.GeoDataFrame:
    data = json.loads(OSM.read_text(encoding="utf-8"))
    rows = []
    for element in data.get("elements", []):
        tags = element.get("tags", {})
        location = coordinate(element)
        if not is_facility(tags) or location is None:
            continue
        latitude, longitude = location
        rows.append(
            {
                "facility_id": f"osm_{element['type']}_{element['id']}",
                "osm_element_type": element["type"],
                "osm_element_id": str(element["id"]),
                "name": tags.get("name") or None,
                "facility_type": facility_type(tags),
                "osm_tags": json.dumps(tags, sort_keys=True),
                "geometry": Point(longitude, latitude),
            }
        )
    facilities = gpd.GeoDataFrame(rows, crs=WGS84)
    if facilities.empty or not facilities["facility_id"].is_unique:
        raise RuntimeError("Facility extraction produced no facilities or unstable IDs.")
    return facilities.sort_values("facility_id").reset_index(drop=True)


def hotspot_id(row: pd.Series) -> str:
    identity = "|".join(str(row[field]) for field in ("source_dataset", "latitude", "longitude", "acq_date", "acq_time", "satellite"))
    return "firms_" + hashlib.sha256(identity.encode("utf-8")).hexdigest()[:16]


def run(radius_m: float) -> dict:
    if radius_m <= 0:
        raise ValueError("radius_m must be positive.")
    firms = pd.read_csv(FIRMS, dtype=str)
    required = {"latitude", "longitude", "source_dataset", "acq_date", "acq_time", "satellite"}
    missing = required - set(firms.columns)
    if missing:
        raise RuntimeError(f"FIRMS sample missing required columns: {sorted(missing)}")
    firms["latitude"] = firms["latitude"].astype(float)
    firms["longitude"] = firms["longitude"].astype(float)
    firms.insert(0, "hotspot_id", firms.apply(hotspot_id, axis=1))
    if not firms["hotspot_id"].is_unique:
        raise RuntimeError("Hotspot ID generation was not unique.")
    firms_gdf = gpd.GeoDataFrame(firms, geometry=gpd.points_from_xy(firms.longitude, firms.latitude), crs=WGS84)
    facilities = load_facilities()
    facilities.to_file(FACILITIES_OUTPUT, driver="GeoJSON")

    joined = gpd.sjoin_nearest(
        firms_gdf.to_crs(METRE_CRS),
        facilities.to_crs(METRE_CRS)[["facility_id", "facility_type", "name", "osm_element_type", "osm_element_id", "geometry"]],
        how="left",
        distance_col="nearest_facility_distance_m",
    ).reset_index(drop=True)
    # Resolve equidistant ties deterministically so the output remains one row per hotspot.
    joined = joined.sort_values(["hotspot_id", "nearest_facility_distance_m", "facility_id"], na_position="last").drop_duplicates("hotspot_id", keep="first")
    joined["facility_match_radius_m"] = radius_m
    joined["is_facility_matched"] = joined["nearest_facility_distance_m"].le(radius_m)
    outside_radius = ~joined["is_facility_matched"]
    joined.loc[outside_radius, ["facility_id", "facility_type", "name", "osm_element_type", "osm_element_id"]] = pd.NA
    # Policy: unmatched detections carry null facility fields and null distance (not an out-of-radius distance).
    joined["distance_to_facility_m"] = joined["nearest_facility_distance_m"].where(joined["is_facility_matched"]).round(3)
    joined = joined.drop(columns=["index_right", "nearest_facility_distance_m", "geometry"], errors="ignore")
    joined = joined.sort_values("hotspot_id").reset_index(drop=True)
    if len(joined) != len(firms) or not joined["hotspot_id"].is_unique:
        raise RuntimeError("B1 output must contain every input hotspot exactly once.")
    matched_mask = joined["is_facility_matched"]
    unmatched_mask = ~matched_mask
    if joined.loc[matched_mask, ["facility_id", "facility_type", "distance_to_facility_m"]].isna().any().any():
        raise RuntimeError("Matched hotspots must have facility ID, type, and distance.")
    if joined.loc[unmatched_mask, ["facility_id", "facility_type", "distance_to_facility_m"]].notna().any().any():
        raise RuntimeError("Unmatched hotspots must have null facility ID, type, and distance.")
    if (joined.loc[matched_mask, "distance_to_facility_m"] < 0).any() or (joined.loc[matched_mask, "distance_to_facility_m"] > radius_m).any():
        raise RuntimeError("Matched distance is outside the configured radius.")
    if not set(joined.loc[matched_mask, "facility_id"]).issubset(set(facilities["facility_id"])):
        raise RuntimeError("Matched output contains an untraceable facility ID.")
    joined.to_csv(MATCHES_OUTPUT, index=False)

    matched = int(joined["is_facility_matched"].sum())
    validation = {
        "status": "passed",
        "input_hotspots": len(firms),
        "output_hotspots": len(joined),
        "facility_count": len(facilities),
        "facility_types": {key: int(value) for key, value in facilities["facility_type"].value_counts().sort_index().items()},
        "matching_crs": METRE_CRS.to_string(),
        "matching_radius_m": radius_m,
        "matched_hotspots": matched,
        "unmatched_hotspots": len(joined) - matched,
        "distance_policy": "distance_to_facility_m is null when no facility is within the configured radius",
        "facility_id_traceability": "facility_id is osm_{element_type}_{element_id}; OSM IDs and tags are retained in data/sample/processed/track_b_b1_facilities.geojson",
    }
    VALIDATION_OUTPUT.write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")
    return validation


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--radius-m", type=float, default=5_000, help="Nearest-facility match radius in metres (default: 5000).")
    args = parser.parse_args()
    print(json.dumps(run(args.radius_m), indent=2))
