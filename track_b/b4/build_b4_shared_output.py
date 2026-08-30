"""Adapt immutable Track B B3 records to the shared AIML output contract."""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
from typing import Any

import pandas as pd


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
B3_INPUT = ROOT / "data/sample/processed/track_b_b3_classified_anomalies.csv"
B3_VALIDATION = ROOT / "data/sample/validation/track_b_b3_validation.json"
SCHEMA_PATH = ROOT / "shared/shared_output_contract.schema.json"
CONTRACT_OUTPUT = ROOT / "data/sample/processed/track_b_b4_contract_ready.jsonl"
TRACEABILITY_OUTPUT = ROOT / "data/sample/processed/track_b_b4_traceability.jsonl"
METADATA_OUTPUT = ROOT / "data/sample/processed/track_b_b4_contract_metadata.json"
MODEL_VERSION = "track_b_b3_rules_v1_rule_based"


def nullable(value: Any) -> Any:
    """Convert pandas/numpy missing values to JSON null without inventing data."""
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    return value.item() if hasattr(value, "item") else value


def nullable_float(value: Any) -> float | None:
    value = nullable(value)
    return None if value is None else float(value)


def nullable_int(value: Any) -> int | None:
    value = nullable(value)
    if value is None:
        return None
    numeric = float(value)
    if not numeric.is_integer():
        raise ValueError(f"Expected integer-valued recurrence count, got {value!r}.")
    return int(numeric)


def nullable_text(value: Any) -> str | None:
    value = nullable(value)
    return None if value is None else str(value)


def b3_sha256() -> str:
    return hashlib.sha256(B3_INPUT.read_bytes()).hexdigest()


def contract_record(row: pd.Series) -> dict[str, Any]:
    return {
        "hotspot_id": str(row["hotspot_id"]),
        "latitude": float(row["latitude"]),
        "longitude": float(row["longitude"]),
        # Track A owns primary/natural classification fields during standalone work.
        "primary_class": None,
        "sub_class": nullable_text(row["sub_class"]),
        "land_cover_type": None,
        "facility_id": nullable_text(row["facility_id"]),
        "distance_to_facility_m": nullable_float(row["distance_to_facility_m"]),
        "recurrence_count_90d": nullable_int(row["recurrence_count_90d"]),
        "z_score_frp": nullable_float(row["z_score_frp"]),
        "is_anomalous": bool(row["is_anomalous"]),
        "confidence_score": nullable_float(row["confidence_score"]),
        "model_version": MODEL_VERSION,
    }


def traceability_record(row: pd.Series) -> dict[str, Any]:
    """Keep fields forbidden by the strict shared contract in a linked sidecar."""
    return {
        "hotspot_id": str(row["hotspot_id"]),
        "source": {
            "source_dataset": nullable_text(row["source_dataset"]),
            "acquisition_timestamp_utc": nullable_text(row["acquisition_timestamp_utc"]),
            "acq_date": nullable_text(row["acq_date"]),
            "acq_time": nullable_int(row["acq_time"]),
            "latitude": float(row["latitude"]),
            "longitude": float(row["longitude"]),
            "instrument": nullable_text(row["instrument"]),
            "satellite": nullable_text(row["satellite"]),
            "frp": nullable_float(row["frp"]),
        },
        "facility_match": {
            "facility_id": nullable_text(row["facility_id"]),
            "facility_type": nullable_text(row["facility_type"]),
            "facility_name": nullable_text(row["name"]),
            "osm_element_type": nullable_text(row["osm_element_type"]),
            "osm_element_id": nullable_int(row["osm_element_id"]),
            "distance_to_facility_m": nullable_float(row["distance_to_facility_m"]),
            "is_facility_matched": bool(row["is_facility_matched"]),
        },
        "b2_context": {
            "recurrence_count_90d": nullable_int(row["recurrence_count_90d"]),
            "facility_frp_observation_count_90d": nullable_int(row["facility_frp_observation_count_90d"]),
            "facility_frp_mean_90d": nullable_float(row["facility_frp_mean_90d"]),
            "facility_frp_std_90d": nullable_float(row["facility_frp_std_90d"]),
            "history_coverage_days": nullable_float(row["history_coverage_days"]),
            "insufficient_history": bool(row["insufficient_history"]),
        },
        "b3_context": {
            "sub_class": nullable_text(row["sub_class"]),
            "z_score_frp": nullable_float(row["z_score_frp"]),
            "is_anomalous": bool(row["is_anomalous"]),
            "confidence_score": nullable_float(row["confidence_score"]),
            "rule_version": MODEL_VERSION,
        },
    }


def write_jsonl(path: Path, records: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(record, allow_nan=False) + "\n" for record in records), encoding="utf-8")


def run() -> dict[str, Any]:
    b3 = pd.read_csv(B3_INPUT)
    if b3["hotspot_id"].duplicated().any():
        raise ValueError("B3 input contains duplicate hotspot IDs.")
    contract_records = [contract_record(row) for _, row in b3.iterrows()]
    traceability_records = [traceability_record(row) for _, row in b3.iterrows()]
    write_jsonl(CONTRACT_OUTPUT, contract_records)
    write_jsonl(TRACEABILITY_OUTPUT, traceability_records)

    b3_report = json.loads(B3_VALIDATION.read_text(encoding="utf-8"))
    metadata = {
        "status": "contract_output_built",
        "input_path": str(B3_INPUT.relative_to(ROOT)),
        "input_b3_sha256": b3_sha256(),
        "contract_schema_path": str(SCHEMA_PATH.relative_to(ROOT)),
        "contract_schema_sha256": hashlib.sha256(SCHEMA_PATH.read_bytes()).hexdigest(),
        "contract_output_path": str(CONTRACT_OUTPUT.relative_to(ROOT)),
        "traceability_output_path": str(TRACEABILITY_OUTPUT.relative_to(ROOT)),
        "record_count": int(len(b3)),
        "model_version": MODEL_VERSION,
        "classification_method": "rule_based",
        "evaluation_status": "no_independently_verified_metrics_available",
        "human_review_status": "AI-assisted uncertain labels are excluded from evaluation metrics and threshold tuning.",
        "history_guardrail": "Rows with insufficient_history=true are not high-confidence anomaly decisions; B3 never marks them industrial_fire/anomalous.",
        "known_open_follow_up": "The March-2025 TTPS fire is a distinct lead and is not linked to a B3 event.",
        "contract_mapping": {
            "track_b_owned": ["facility_id", "distance_to_facility_m", "recurrence_count_90d", "z_score_frp", "is_anomalous", "confidence_score", "sub_class"],
            "track_a_owned_set_to_null": ["primary_class", "land_cover_type"],
            "source_and_extended_context_sidecar": ["acquisition timestamp", "instrument", "satellite", "FRP", "facility tags", "rolling FRP baseline", "history coverage"],
        },
        "b3_rule_version": b3_report.get("rule_version"),
        "b3_insufficient_history_rows": b3_report.get("insufficient_history_rows"),
    }
    METADATA_OUTPUT.write_text(json.dumps(metadata, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    return metadata


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
