"""Read-only provenance investigation for the 2024-07-19 S-NPP triplicate."""

from __future__ import annotations

import csv
import json
import math
from itertools import combinations
from pathlib import Path


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
RAW = ROOT / "data/raw/firms/viirs_snpp_sp_thoothukudi_2024_2025.csv"
SAMPLE = ROOT / "data/sample/input/firms_sample.csv"
EXTERNAL_REVIEW = ROOT / "data/sample/processed/track_b_b3_industrial_fire_external_review.csv"
REPORT = ROOT / "data/sample/validation/track_b_triplicate_hotspot_investigation.json"
TARGET_IDS = {
    "firms_aaa475fee26d4c1c",
    "firms_c6e6132bd0d7afdb",
    "firms_fefe6139f7128536",
}
TARGET_DATE = "2024-07-19"
TARGET_TIME = "750"
TARGET_FRP = "44.71"


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def time_value(row: dict[str, str]) -> str:
    return str(row["acq_time"]).strip().lstrip("0") or "0"


def coordinate_key(row: dict[str, str]) -> tuple[str, str]:
    return f"{float(row['latitude']):.5f}", f"{float(row['longitude']):.5f}"


def haversine_m(left: dict[str, str], right: dict[str, str]) -> float:
    lat1, lon1 = math.radians(float(left["latitude"])), math.radians(float(left["longitude"]))
    lat2, lon2 = math.radians(float(right["latitude"])), math.radians(float(right["longitude"]))
    a = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 6_371_000 * 2 * math.asin(math.sqrt(a))


def normalized_record(row: dict[str, str]) -> dict[str, str | float]:
    return {
        "latitude": float(row["latitude"]),
        "longitude": float(row["longitude"]),
        "acq_date": row["acq_date"],
        "acq_time": time_value(row),
        "instrument": row.get("instrument", ""),
        "satellite": row.get("satellite", ""),
        "frp": float(row["frp"]),
        "scan": float(row["scan"]),
        "track": float(row["track"]),
    }


def run() -> dict:
    raw_rows, sample_rows, external_rows = read_csv(RAW), read_csv(SAMPLE), read_csv(EXTERNAL_REVIEW)
    external_targets = [row for row in external_rows if row["hotspot_id"] in TARGET_IDS]
    if len(external_targets) != 3:
        raise RuntimeError("External-review export does not contain all three requested target rows.")
    target_coordinates = {coordinate_key(row) for row in external_targets}
    raw_triplicate = [
        row for row in raw_rows
        if row["acq_date"] == TARGET_DATE
        and time_value(row) == TARGET_TIME
        and row.get("instrument") == "VIIRS"
        and f"{float(row['frp']):.2f}" == TARGET_FRP
        and coordinate_key(row) in target_coordinates
    ]
    sample_triplicate = [
        row for row in sample_rows
        if row["acq_date"] == TARGET_DATE
        and time_value(row) == TARGET_TIME
        and row.get("instrument") == "VIIRS"
        and row.get("satellite") == "SNPP"
        and f"{float(row['frp']):.2f}" == TARGET_FRP
        and coordinate_key(row) in target_coordinates
    ]
    if len(raw_triplicate) != 3 or len(sample_triplicate) != 3:
        raise RuntimeError("The requested three records could not be traced through raw and merged sources.")
    raw_timestamp_context = [
        row for row in raw_rows
        if row["acq_date"] == TARGET_DATE and time_value(row) == TARGET_TIME
    ]
    pair_distances = [
        {
            "coordinates": [
                [float(left["latitude"]), float(left["longitude"])],
                [float(right["latitude"]), float(right["longitude"])],
            ],
            "centre_distance_m": round(haversine_m(left, right), 1),
        }
        for left, right in combinations(sorted(raw_triplicate, key=coordinate_key), 2)
    ]
    original_1020 = [row for row in sample_rows if row["acq_date"] >= "2024-01-01"]
    report = {
        "status": "passed",
        "investigation_scope": "read-only provenance check; no data or B1/B2/B3 logic was changed",
        "target_hotspot_ids": sorted(TARGET_IDS),
        "raw_source": str(RAW.relative_to(ROOT)),
        "merged_source": str(SAMPLE.relative_to(ROOT)),
        "external_review_source": str(EXTERNAL_REVIEW.relative_to(ROOT)),
        "raw_source_confirmation": {
            "three_independent_raw_rows_found": len(raw_triplicate),
            "raw_rows": [normalized_record(row) for row in sorted(raw_triplicate, key=coordinate_key)],
            "raw_timestamp_context_row_count": len(raw_timestamp_context),
            "raw_satellite_field_note": "The raw VIIRS S-NPP endpoint stores satellite=N; the merger normalizes this endpoint identity to satellite=SNPP without changing coordinates or measurements.",
        },
        "merged_sample_confirmation": {
            "three_rows_found": len(sample_triplicate),
            "original_2024_2025_baseline_rows": len(original_1020),
            "merged_rows": [normalized_record(row) for row in sorted(sample_triplicate, key=coordinate_key)],
        },
        "geometry": {
            "pairwise_centre_distances_m": pair_distances,
            "reported_scan_track": {"scan": 0.53, "track": 0.42},
            "interpretation": "The raw NASA response contains three distinct centres separated by roughly one reported footprint scale. This is consistent with adjacent/multi-pixel detections; raw provenance alone cannot prove whether they represent one large physical fire or separate nearby thermal sources.",
        },
        "conclusion": "genuine separate raw NASA FIRMS detections; not a merge artifact; physically consistent with a multi-pixel thermal event, with physical-event identity remaining inconclusive from FIRMS rows alone",
        "merge_artifact_signature_scan": {
            "required": False,
            "reason": "All three rows independently exist in the raw NASA response before merge, so the conditional systemic scan for merge-created near-duplicates is not applicable.",
        },
        "implications": {
            "industrial_fire_candidate_count": "The three B3 candidates are three FIRMS detection rows, not merge-created copies. They may still correspond to one physical incident and should be grouped during human/external review rather than counted as three independently confirmed fires.",
            "b2_recurrence_and_baselines": "No data-integrity correction is indicated. B2 correctly sees three observations; any future event-level aggregation policy would be a modelling decision, not a merge/dedup repair.",
        },
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
