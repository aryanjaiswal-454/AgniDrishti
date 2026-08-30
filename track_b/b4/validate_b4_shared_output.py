"""Validate B4 contract/traceability outputs without mutating B3 data."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import pandas as pd
from jsonschema import Draft202012Validator


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
B3_INPUT = ROOT / "data/sample/processed/track_b_b3_classified_anomalies.csv"
SCHEMA_PATH = ROOT / "shared/shared_output_contract.schema.json"
CONTRACT_OUTPUT = ROOT / "data/sample/processed/track_b_b4_contract_ready.jsonl"
TRACEABILITY_OUTPUT = ROOT / "data/sample/processed/track_b_b4_traceability.jsonl"
METADATA_OUTPUT = ROOT / "data/sample/processed/track_b_b4_contract_metadata.json"
REPORT = ROOT / "data/sample/validation/track_b_b4_validation.json"


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def run() -> dict[str, Any]:
    b3 = pd.read_csv(B3_INPUT)
    contract_records = read_jsonl(CONTRACT_OUTPUT)
    trace_records = read_jsonl(TRACEABILITY_OUTPUT)
    metadata = json.loads(METADATA_OUTPUT.read_text(encoding="utf-8"))
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema)
    schema_errors = [error.message for record in contract_records for error in validator.iter_errors(record)]

    b3_ids = b3["hotspot_id"].astype(str).tolist()
    contract_ids = [record["hotspot_id"] for record in contract_records]
    trace_ids = [record["hotspot_id"] for record in trace_records]
    trace_by_id = {record["hotspot_id"]: record for record in trace_records}
    traceability_matches_b3 = all(
        identifier in trace_by_id
        and trace_by_id[identifier]["source"]["instrument"] == (None if pd.isna(row.instrument) else str(row.instrument))
        and trace_by_id[identifier]["source"]["satellite"] == (None if pd.isna(row.satellite) else str(row.satellite))
        and trace_by_id[identifier]["source"]["acq_date"] == str(row.acq_date)
        for identifier, row in zip(b3_ids, b3.itertuples(index=False))
    )
    insufficient = b3.loc[b3["insufficient_history"].astype(bool)]
    guardrail_ok = bool(
        (~insufficient["is_anomalous"].astype(bool)).all()
        and (~insufficient["sub_class"].eq("industrial_fire")).all()
        and insufficient["confidence_score"].dropna().le(0.55).all()
    )
    expected_b3_hash = hashlib.sha256(B3_INPUT.read_bytes()).hexdigest()
    passed = (
        len(b3) == len(contract_records) == len(trace_records)
        and len(set(contract_ids)) == len(b3)
        and set(contract_ids) == set(b3_ids)
        and len(set(trace_ids)) == len(b3)
        and set(trace_ids) == set(b3_ids)
        and not schema_errors
        and traceability_matches_b3
        and guardrail_ok
        and metadata.get("input_b3_sha256") == expected_b3_hash
    )
    report = {
        "status": "passed" if passed else "failed",
        "input_path": str(B3_INPUT.relative_to(ROOT)),
        "contract_output_path": str(CONTRACT_OUTPUT.relative_to(ROOT)),
        "traceability_output_path": str(TRACEABILITY_OUTPUT.relative_to(ROOT)),
        "metadata_path": str(METADATA_OUTPUT.relative_to(ROOT)),
        "input_rows": int(len(b3)),
        "contract_rows": int(len(contract_records)),
        "traceability_rows": int(len(trace_records)),
        "unique_hotspot_ids": int(len(set(contract_ids))),
        "schema_validation": {"validator": "jsonschema Draft202012Validator", "error_count": len(schema_errors), "errors": schema_errors[:20]},
        "source_b3_sha256_matches_metadata": metadata.get("input_b3_sha256") == expected_b3_hash,
        "traceability_matches_b3": traceability_matches_b3,
        "unmatched_facility_rows": int(b3["facility_id"].isna().sum()),
        "null_z_score_rows": int(b3["z_score_frp"].isna().sum()),
        "null_recurrence_rows": int(b3["recurrence_count_90d"].isna().sum()),
        "insufficient_history_rows": int(len(insufficient)),
        "insufficient_history_guardrail_preserved": guardrail_ok,
        "classification_method": metadata.get("classification_method"),
        "evaluation_status": metadata.get("evaluation_status"),
        "imagery_enrichment_status": "separate optional utility; not required for contract validation",
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    if not passed:
        raise SystemExit(json.dumps(report, indent=2))
    return report


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
