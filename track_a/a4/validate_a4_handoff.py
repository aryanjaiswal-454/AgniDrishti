"""Focused Phase A4 shared-contract validation using actual A2 sample rows."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
from jsonschema import Draft202012Validator

from handoff import ROOT, classify_track_a


A2_INPUT = ROOT / "data/sample/processed/firms_sample_a2_rule_based.csv"
SCHEMA_PATH = ROOT / "shared/shared_output_contract.schema.json"
TRACK_B_NULL_FIELDS = {
    "facility_id", "distance_to_facility_m", "recurrence_count_90d", "z_score_frp", "is_anomalous"
}


def _sample_record(row: pd.Series) -> dict[str, object]:
    record = row.to_dict()
    # The sample output predates the D7 database identity; the handoff API
    # therefore requires a caller-provided identity. This is only a test value.
    record["hotspot_id"] = f"sample-{row['a1_input_row']}"
    return record


def main() -> None:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema)
    frame = pd.read_csv(A2_INPUT, keep_default_na=False)
    rows = [
        frame.loc[frame["primary_class"] == "natural"].iloc[0],
        frame.loc[frame["primary_class"] == "industrial"].iloc[0],
    ]
    results = []
    for row in rows:
        record = classify_track_a(_sample_record(row))
        validator.validate(record)
        assert set(record) == set(schema["required"])
        assert all(record[field] is None for field in TRACK_B_NULL_FIELDS)
        assert record["primary_class"] in {"industrial", "natural"}
        assert record["sub_class"] in {"forest_fire", "agricultural_burning", "other_natural", None}
        assert 0 <= record["confidence_score"] <= 1
        results.append(record)
    assert results[1]["primary_class"] == "industrial" and results[1]["sub_class"] is None
    print(json.dumps({"status": "passed", "schema": str(SCHEMA_PATH), "records": results}, indent=2))


if __name__ == "__main__":
    main()
