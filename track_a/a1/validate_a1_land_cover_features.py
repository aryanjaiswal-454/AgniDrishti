"""Validate the existing Phase A1 output without running other project phases."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from build_a1_land_cover_features import DEFAULT_FIRMS, DEFAULT_OUTPUT, DEFAULT_REPORT, VALID_LAND_COVER


FORBIDDEN = {"primary_class", "sub_class", "confidence_score", "facility_id", "distance_to_facility_m", "is_anomalous", "z_score_frp"}
REQUIRED_ADDITIONS = {
    "a1_coordinate_valid", "a1_acq_date_valid", "a1_worldcover_code", "a1_land_cover_type", "a1_worldcover_status",
    "a1_brightness_value", "a1_brightness_source", "a1_brightness_normalized", "a1_frp_value", "a1_frp_normalized",
    "a1_daynight", "a1_year", "a1_month", "a1_season",
}


def main() -> None:
    source = pd.read_csv(DEFAULT_FIRMS, dtype=str, keep_default_na=False)
    output = pd.read_csv(DEFAULT_OUTPUT, keep_default_na=False)
    report = json.loads(DEFAULT_REPORT.read_text(encoding="utf-8"))
    assert len(source) == len(output) == report["input_rows"] == report["output_rows"]
    assert set(source.columns).issubset(output.columns), "Original FIRMS fields were not all preserved."
    assert not (FORBIDDEN & set(output.columns)), "A1 created out-of-scope classifier or Track B fields."
    assert REQUIRED_ADDITIONS.issubset(output.columns), "A1 feature columns are incomplete."
    assert set(output["a1_land_cover_type"]).issubset(VALID_LAND_COVER)
    valid = output["a1_coordinate_valid"].astype(str).str.lower() == "true"
    assert (output.loc[valid, "a1_worldcover_status"] != "not_sampled_invalid_coordinate").all()
    assert (pd.to_numeric(output["a1_brightness_normalized"], errors="coerce").dropna().between(0, 1)).all()
    assert (pd.to_numeric(output["a1_frp_normalized"], errors="coerce").dropna().between(0, 1)).all()
    assert set(output["a1_daynight"]).issubset({"day", "night", "unknown"})
    assert set(output["a1_season"]).issubset({"winter", "summer", "southwest_monsoon", "northeast_monsoon", "unknown"})
    print(json.dumps({"status": "passed", **report}, indent=2))


if __name__ == "__main__":
    main()
