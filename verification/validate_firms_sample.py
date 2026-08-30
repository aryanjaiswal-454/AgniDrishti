"""Validate the shared FIRMS sample and summarize its OSM facility proximity."""

from __future__ import annotations

import csv
import json
import math
from collections import Counter
from datetime import date
from pathlib import Path


HERE = Path(__file__).parent
ROOT = HERE.parent
SAMPLE_INPUT = ROOT / "data/sample/input"
FIRMS = SAMPLE_INPUT / "firms_sample.csv"
ORIGINAL_Q4 = SAMPLE_INPUT / "firms_thoothukudi_2025q4.csv"
ORIGINAL_SNPP = SAMPLE_INPUT / "firms_sample_snpp_baseline.csv"
OSM = SAMPLE_INPUT / "osm_facilities_thoothukudi_2025q4.json"
REPORT = ROOT / "data/sample/validation/firms_sample_validation.json"
WEST, SOUTH, EAST, NORTH = 77.85, 8.35, 78.45, 8.95
START, END = date(2024, 1, 1), date(2025, 12, 31)
REQUIRED = {"latitude", "longitude", "acq_date", "acq_time", "satellite", "instrument", "confidence", "frp", "daynight"}
VALID_INSTRUMENTS = {"MODIS", "VIIRS"}


def point(element: dict) -> tuple[float, float] | None:
    if "lat" in element and "lon" in element:
        return float(element["lat"]), float(element["lon"])
    center = element.get("center")
    if center and "lat" in center and "lon" in center:
        return float(center["lat"]), float(center["lon"])
    return None


def is_facility(tags: dict) -> bool:
    """Exclude transmission infrastructure; retain industrial and generation sites."""
    return (
        "industrial" in tags
        or tags.get("landuse") == "industrial"
        or tags.get("landuse") == "quarry"
        or tags.get("man_made") in {"works", "petroleum_well", "mineshaft"}
        or tags.get("power") == "plant"
        or tags.get("substance") == "lng"
    )


def haversine_m(latitude: float, longitude: float, other_lat: float, other_lon: float) -> float:
    rad = math.pi / 180
    dlat, dlon = (other_lat - latitude) * rad, (other_lon - longitude) * rad
    a = math.sin(dlat / 2) ** 2 + math.cos(latitude * rad) * math.cos(other_lat * rad) * math.sin(dlon / 2) ** 2
    return 6_371_000 * 2 * math.asin(math.sqrt(a))


def contract_key(row: dict[str, str]) -> tuple[str, str, str, str, str, str]:
    return (
        f"{float(row['latitude']):.5f}", f"{float(row['longitude']):.5f}", row["acq_date"],
        row["acq_time"], row["instrument"], row["satellite"],
    )


def canonical_for_comparison(row: dict[str, str]) -> dict[str, str]:
    """Apply the current data contract to legacy saved S-NPP rows before comparison."""
    canonical = dict(row)
    if canonical.get("satellite") == "SNPP":
        canonical["instrument"] = "VIIRS"
    return canonical


def main() -> None:
    with FIRMS.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        assert reader.fieldnames and REQUIRED.issubset(reader.fieldnames), "FIRMS sample is missing required DataSpecification §2.1 fields."
        assert {"brightness", "bright_ti4"}.intersection(reader.fieldnames), "FIRMS sample is missing both brightness variants."
        records = list(reader)
    assert records, "FIRMS sample is empty."
    contract_keys = [contract_key(record) for record in records]
    duplicate_contract_keys = len(contract_keys) - len(set(contract_keys))
    assert not duplicate_contract_keys, "FIRMS sample still has duplicate contract keys."
    with ORIGINAL_Q4.open(newline="", encoding="utf-8") as handle:
        original_q4 = list(csv.DictReader(handle))
    def missing_from_combined(source_rows: list[dict[str, str]]) -> list[dict[str, str]]:
        return [source for source in source_rows if not any(all(record.get(name, "") == value for name, value in canonical_for_comparison(source).items()) for record in records)]

    missing_original = missing_from_combined(original_q4)
    assert not missing_original, f"{len(missing_original)} original Q4 2025 records are missing from the combined sample."
    with ORIGINAL_SNPP.open(newline="", encoding="utf-8") as handle:
        original_snpp = list(csv.DictReader(handle))
    missing_snpp = missing_from_combined(original_snpp)
    assert not missing_snpp, f"{len(missing_snpp)} original S-NPP baseline records are missing from the combined sample."
    invalid_instruments = sorted({record["instrument"] for record in records} - VALID_INSTRUMENTS)
    assert not invalid_instruments, f"Invalid instruments: {invalid_instruments}"

    with OSM.open(encoding="utf-8") as handle:
        osm = json.load(handle)
    facilities = [p for element in osm["elements"] if is_facility(element.get("tags", {})) and (p := point(element))]
    assert facilities, "No qualifying OSM facility points found."

    years, instruments, sources = Counter(), Counter(), Counter()
    satellites_by_source: dict[str, set[str]] = {}
    within_1km = 0
    failures = []
    for row in records:
        latitude, longitude = float(row["latitude"]), float(row["longitude"])
        observed = date.fromisoformat(row["acq_date"])
        missing_fields = [field for field in REQUIRED if not row.get(field, "").strip()]
        if not (row.get("brightness", "").strip() or row.get("bright_ti4", "").strip()):
            missing_fields.append("brightness/bright_ti4")
        if missing_fields:
            failures.append({"missing_fields": missing_fields, **row})
        if not (SOUTH <= latitude <= NORTH and WEST <= longitude <= EAST and START <= observed <= END):
            failures.append(row)
        years[str(observed.year)] += 1
        instruments[row["instrument"]] += 1
        sources[row.get("source_dataset", "unattributed")] += 1
        satellites_by_source.setdefault(row.get("source_dataset", "unattributed"), set()).add(row["satellite"])
        if min(haversine_m(latitude, longitude, facility_lat, facility_lon) for facility_lat, facility_lon in facilities) <= 1_000:
            within_1km += 1
    assert not failures, f"{len(failures)} records fall outside the agreed bounds or time range."

    report = {
        "status": "passed",
        "pilot_bbox_wgs84": [WEST, SOUTH, EAST, NORTH],
        "time_window": [START.isoformat(), END.isoformat()],
        "required_fields_present": sorted(REQUIRED),
        "total_records": len(records),
        "duplicate_contract_keys": duplicate_contract_keys,
        "original_q4_2025_records_preserved": len(original_q4),
        "original_snpp_baseline_records_preserved": len(original_snpp),
        "records_by_instrument": dict(sorted(instruments.items())),
        "records_by_source_dataset": dict(sorted(sources.items())),
        "satellites_by_source_dataset": {name: sorted(values) for name, values in sorted(satellites_by_source.items())},
        "records_by_year": dict(sorted(years.items())),
        "facility_proxy": {
            "threshold_m": 1000,
            "qualifying_osm_facility_points": len(facilities),
            "qualifying_tags": "industrial=*, landuse=industrial, man_made=works|petroleum_well, or power=plant; transmission lines/towers and standalone generators are excluded",
            "within_1km": within_1km,
            "outside_1km": len(records) - within_1km,
        },
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
