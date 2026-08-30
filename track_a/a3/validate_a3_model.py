"""Focused A3 checks: artifacts, held-out report, and real-row inference."""

from __future__ import annotations

import json

import pandas as pd

from inference import classify_primary, load_a3_model
from train_a3_model import DEFAULT_A2_INPUT, DEFAULT_EVALUATION, DEFAULT_MODEL, FEATURE_COLUMNS


def main() -> None:
    report = json.loads(DEFAULT_EVALUATION.read_text(encoding="utf-8"))
    artifact = load_a3_model(DEFAULT_MODEL)
    frame = pd.read_csv(DEFAULT_A2_INPUT, keep_default_na=False)
    assert DEFAULT_MODEL.exists() and DEFAULT_EVALUATION.exists()
    assert report["train_rows"] + report["test_rows"] == len(frame)
    assert 0 <= report["primary_held_out"]["accuracy"] <= 1
    assert set(artifact["feature_columns"]) == set(FEATURE_COLUMNS)
    natural_indexes = frame.index[frame["primary_class"] == "natural"][:3].tolist()
    industrial_indexes = frame.index[frame["primary_class"] == "industrial"][:1].tolist()
    results = [classify_primary(frame.loc[index, FEATURE_COLUMNS].to_dict()) for index in natural_indexes + industrial_indexes]
    for result in results:
        assert result["primary_class"] in {"industrial", "natural"}
        assert result["sub_class"] in {"forest_fire", "agricultural_burning", "other_natural", None}
        assert 0 <= result["confidence_score"] <= 1
        assert result["model_version"] == report["model_version"]
    assert results[-1]["primary_class"] == "industrial" and results[-1]["sub_class"] is None
    print(json.dumps({"status": "passed", "held_out_accuracy": report["primary_held_out"]["accuracy"], "inference_results": results}, indent=2))


if __name__ == "__main__":
    main()
