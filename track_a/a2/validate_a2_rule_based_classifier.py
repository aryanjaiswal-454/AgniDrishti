"""Focused validation for the Phase A2 rule-based baseline output."""

from __future__ import annotations

import json

import pandas as pd

from build_a2_rule_based_classifier import DEFAULT_A1_INPUT, DEFAULT_OUTPUT, DEFAULT_REPORT


TRACK_B = {"facility_id", "distance_to_facility_m", "recurrence_count_90d", "z_score_frp", "is_anomalous"}


def main() -> None:
    source = pd.read_csv(DEFAULT_A1_INPUT, keep_default_na=False)
    output = pd.read_csv(DEFAULT_OUTPUT, keep_default_na=False)
    report = json.loads(DEFAULT_REPORT.read_text(encoding="utf-8"))
    assert len(source) == len(output) == report["input_rows"] == report["output_rows"]
    assert set(source.columns).issubset(output.columns), "A2 did not preserve all A1 features."
    assert set(output["primary_class"]).issubset({"industrial", "natural"})
    natural_subclasses = output.loc[output["primary_class"] == "natural", "sub_class"]
    assert set(natural_subclasses).issubset({"forest_fire", "agricultural_burning", "other_natural"})
    assert output.loc[output["primary_class"] == "natural", "sub_class"].notna().all()
    assert (output.loc[output["primary_class"] == "industrial", "sub_class"] == "").all()
    assert pd.to_numeric(output["confidence_score"], errors="raise").between(0, 1).all()
    assert (output["model_version"] == "rule_based_v1.0").all()
    assert not (TRACK_B & set(output.columns)), "A2 added Track B fields."
    assert (output.loc[output["a1_land_cover_type"] == "cropland", "sub_class"] == "agricultural_burning").all()
    assert (output.loc[output["a1_land_cover_type"] == "forest", "sub_class"] == "forest_fire").all()
    dense_built_bare = output[output["a1_land_cover_type"].isin(["built_up", "bare"]) & (output["a2_density_level"] == "strong_cluster")]
    assert not dense_built_bare.empty, "Pilot no longer exercises the dense built/bare rule."
    assert (dense_built_bare["primary_class"] == "industrial").all()
    ambiguous = output[output["a2_rule_id"] == "A2_AMBIGUOUS_BUILT_OR_BARE_FALLBACK"]
    assert not ambiguous.empty and (pd.to_numeric(ambiguous["confidence_score"]) == 0.45).all()
    print(json.dumps({"status": "passed", **report}, indent=2))


if __name__ == "__main__":
    main()
