"""Track B Phase B2: leakage-safe facility recurrence and FRP baselines.

This module enriches the immutable B1 facility-matching output.  Recurrence is
computed across all sensors per matched facility, while FRP baselines are kept
sensor-specific using facility_id + instrument + satellite strata.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
B1_INPUT = ROOT / "data/sample/processed/track_b_b1_facility_matches.csv"
OUTPUT = ROOT / "data/sample/processed/track_b_b2_recurrence_baselines.csv"
VALIDATION_OUTPUT = ROOT / "data/sample/validation/track_b_b2_validation.json"
WINDOW_DAYS = 90
BASELINE_GROUP_COLUMNS = ["facility_id", "instrument", "satellite"]


def parse_acquisition_timestamp(frame: pd.DataFrame) -> pd.Series:
    """Parse FIRMS date/time fields as UTC, returning NaT for invalid values."""
    numeric_time = pd.to_numeric(frame["acq_time"], errors="coerce")
    valid_time = (
        numeric_time.notna()
        & numeric_time.ge(0)
        & numeric_time.le(2359)
        & numeric_time.mod(100).lt(60)
    )
    time_text = numeric_time.where(valid_time).astype("Int64").astype("string").str.zfill(4)
    return pd.to_datetime(
        frame["acq_date"].astype("string") + time_text,
        format="%Y-%m-%d%H%M",
        errors="coerce",
        utc=True,
    )


def prior_recurrence(group: pd.DataFrame) -> pd.DataFrame:
    """Count earlier same-facility events in [timestamp - 90 days, timestamp)."""
    ordered = group.sort_values(["acquisition_timestamp_utc", "hotspot_id"], kind="stable").copy()
    timestamps = ordered["acquisition_timestamp_utc"].reset_index(drop=True)
    window = pd.Timedelta(days=WINDOW_DAYS)
    # side='left' excludes all detections at the current timestamp, preventing
    # same-time ordering from changing a leakage-safe result.
    counts = np.empty(len(ordered), dtype="int64")
    for index, timestamp in enumerate(timestamps):
        # Use pandas datetime search rather than raw integer epochs: recent
        # pandas versions may store datetime values at microsecond resolution.
        start = timestamps.searchsorted(timestamp - window, side="left")
        end = timestamps.searchsorted(timestamp, side="left")
        counts[index] = end - start
    ordered["recurrence_count_90d"] = pd.array(counts, dtype="Int64")
    return ordered


def prior_frp_baseline(group: pd.DataFrame) -> pd.DataFrame:
    """Calculate prior 90-day mean/sample-std from usable FRP observations."""
    ordered = group.sort_values(["acquisition_timestamp_utc", "hotspot_id"], kind="stable").copy()
    timestamps = ordered["acquisition_timestamp_utc"].reset_index(drop=True)
    frp_values = ordered["_frp_numeric"].to_numpy(dtype=float)
    window = pd.Timedelta(days=WINDOW_DAYS)
    counts: list[int] = []
    means: list[float] = []
    stds: list[float] = []
    for index, timestamp in enumerate(timestamps):
        start = timestamps.searchsorted(timestamp - window, side="left")
        end = timestamps.searchsorted(timestamp, side="left")
        previous = frp_values[start:end]
        previous = previous[~np.isnan(previous)]
        counts.append(len(previous))
        means.append(float(previous.mean()) if len(previous) else np.nan)
        # Sample standard deviation is undefined for fewer than two prior FRP values.
        stds.append(float(previous.std(ddof=1)) if len(previous) >= 2 else np.nan)
    ordered["facility_frp_observation_count_90d"] = pd.array(counts, dtype="Int64")
    ordered["facility_frp_mean_90d"] = means
    ordered["facility_frp_std_90d"] = stds
    return ordered


def history_coverage(group: pd.DataFrame) -> pd.DataFrame:
    """Add observable same-facility history, capped at the 90-day B2 window."""
    ordered = group.sort_values(["acquisition_timestamp_utc", "hotspot_id"], kind="stable").copy()
    first_timestamp = ordered["acquisition_timestamp_utc"].min()
    coverage = (ordered["acquisition_timestamp_utc"] - first_timestamp).dt.total_seconds() / 86_400
    ordered["history_coverage_days"] = pd.array(np.minimum(WINDOW_DAYS, np.floor(coverage)).astype("int64"), dtype="Int64")
    ordered["insufficient_history"] = ordered["history_coverage_days"].lt(WINDOW_DAYS).astype("boolean")
    return ordered


def summarise_numeric(series: pd.Series) -> dict[str, float | int | None]:
    populated = series.dropna()
    if populated.empty:
        return {"count": 0, "min": None, "max": None, "mean": None, "median": None}
    return {
        "count": int(len(populated)),
        "min": int(populated.min()),
        "max": int(populated.max()),
        "mean": round(float(populated.mean()), 6),
        "median": float(populated.median()),
    }


def run() -> dict:
    required = {"hotspot_id", "acq_date", "acq_time", "facility_id", "instrument", "satellite", "frp"}
    input_frame = pd.read_csv(B1_INPUT)
    missing = required - set(input_frame.columns)
    if missing:
        raise RuntimeError(f"B1 input is missing required columns: {sorted(missing)}")
    if not input_frame["hotspot_id"].is_unique:
        raise RuntimeError("B1 input must contain exactly one row per hotspot_id.")

    frame = input_frame.copy()
    frame["_input_order"] = np.arange(len(frame))
    frame["acquisition_timestamp_utc"] = parse_acquisition_timestamp(frame)
    frame["_frp_numeric"] = pd.to_numeric(frame["frp"], errors="coerce")
    valid_timestamp = frame["acquisition_timestamp_utc"].notna()
    matched = frame["facility_id"].notna()
    eligible = valid_timestamp & matched

    frame["recurrence_count_90d"] = pd.Series(pd.NA, index=frame.index, dtype="Int64")
    frame["facility_frp_observation_count_90d"] = pd.Series(pd.NA, index=frame.index, dtype="Int64")
    frame["facility_frp_mean_90d"] = np.nan
    frame["facility_frp_std_90d"] = np.nan
    frame["history_coverage_days"] = pd.Series(pd.NA, index=frame.index, dtype="Int64")
    # No facility history is available for unmatched/invalid-timestamp rows, so
    # they are conservatively flagged as insufficient for B3 decisions.
    frame["insufficient_history"] = pd.Series(True, index=frame.index, dtype="boolean")

    recurrence_parts = [
        prior_recurrence(group)
        for _, group in frame.loc[eligible].groupby("facility_id", sort=True, dropna=True)
    ]
    if recurrence_parts:
        recurrence = pd.concat(recurrence_parts).set_index("hotspot_id")
        frame_index = frame.set_index("hotspot_id", drop=False)
        frame_index.loc[recurrence.index, "recurrence_count_90d"] = recurrence["recurrence_count_90d"]
        frame = frame_index.reset_index(drop=True)

    coverage_parts = [
        history_coverage(group)
        for _, group in frame.loc[eligible].groupby("facility_id", sort=True, dropna=True)
    ]
    if coverage_parts:
        coverage = pd.concat(coverage_parts).set_index("hotspot_id")
        frame_index = frame.set_index("hotspot_id", drop=False)
        for column in ("history_coverage_days", "insufficient_history"):
            frame_index.loc[coverage.index, column] = coverage[column]
        frame = frame_index.reset_index(drop=True)

    baseline_parts = [
        prior_frp_baseline(group)
        for _, group in frame.loc[eligible].groupby(BASELINE_GROUP_COLUMNS, sort=True, dropna=True)
    ]
    if baseline_parts:
        baseline = pd.concat(baseline_parts).set_index("hotspot_id")
        frame_index = frame.set_index("hotspot_id", drop=False)
        for column in (
            "facility_frp_observation_count_90d",
            "facility_frp_mean_90d",
            "facility_frp_std_90d",
        ):
            frame_index.loc[baseline.index, column] = baseline[column]
        frame = frame_index.reset_index(drop=True)

    # Preserve B1's row order and keep unmatched or timestamp-invalid metrics null.
    frame["acquisition_timestamp_utc"] = frame["acquisition_timestamp_utc"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    output_frame = frame.sort_values("_input_order", kind="stable").drop(columns=["_input_order", "_frp_numeric"])

    if len(output_frame) != len(input_frame) or not output_frame["hotspot_id"].is_unique:
        raise RuntimeError("B2 output must preserve every B1 hotspot exactly once.")
    if set(output_frame["hotspot_id"]) != set(input_frame["hotspot_id"]):
        raise RuntimeError("B2 output hotspot IDs do not match the B1 input.")
    unmatched_output = output_frame["facility_id"].isna()
    metric_columns = [
        "recurrence_count_90d",
        "facility_frp_observation_count_90d",
        "facility_frp_mean_90d",
        "facility_frp_std_90d",
    ]
    if output_frame.loc[unmatched_output, metric_columns].notna().any().any():
        raise RuntimeError("Unmatched hotspots must have null recurrence and baseline metrics.")
    if output_frame.loc[unmatched_output, "history_coverage_days"].notna().any() or not output_frame.loc[unmatched_output, "insufficient_history"].all():
        raise RuntimeError("Unmatched hotspots must have null coverage and insufficient_history=true.")
    populated_recurrence = output_frame["recurrence_count_90d"].dropna()
    populated_counts = output_frame["facility_frp_observation_count_90d"].dropna()
    if (populated_recurrence < 0).any() or (populated_counts < 0).any():
        raise RuntimeError("Recurrence and baseline observation counts cannot be negative.")
    if not pd.api.types.is_integer_dtype(populated_recurrence.dtype) or not pd.api.types.is_integer_dtype(populated_counts.dtype):
        raise RuntimeError("Recurrence and baseline observation counts must be integer-valued.")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    output_frame.to_csv(OUTPUT, index=False)

    matched_rows = int(matched.sum())
    valid_matched_rows = int(eligible.sum())
    output_timestamps = pd.to_datetime(output_frame["acquisition_timestamp_utc"], utc=True)
    early_2024 = output_frame.loc[
        output_frame["facility_id"].notna()
        & output_timestamps.ge(pd.Timestamp("2024-01-01", tz="UTC"))
        & output_timestamps.lt(pd.Timestamp("2024-03-31", tz="UTC"))
    ]
    validation = {
        "status": "passed",
        "input_path": str(B1_INPUT.relative_to(ROOT)),
        "output_path": str(OUTPUT.relative_to(ROOT)),
        "input_hotspots": int(len(input_frame)),
        "output_hotspots": int(len(output_frame)),
        "unique_hotspot_ids": int(output_frame["hotspot_id"].nunique()),
        "matched_hotspots": matched_rows,
        "unmatched_hotspots": int((~matched).sum()),
        "invalid_or_missing_timestamps": int((~valid_timestamp).sum()),
        "invalid_or_missing_frp": int(frame.loc[eligible, "_frp_numeric"].isna().sum()),
        "timestamp_policy": "acq_date + zero-padded acq_time are interpreted as UTC and rendered as ISO 8601 UTC timestamps.",
        "recurrence_policy": "For matched, timestamp-valid rows, recurrence_count_90d counts same-facility detections in [timestamp - 90 days, timestamp); same-timestamp events are excluded.",
        "unmatched_policy": "Rows without facility_id are retained with null recurrence and baseline metrics.",
        "baseline_grouping": "facility_id + instrument + satellite; this prevents MODIS, VIIRS SNPP, and VIIRS NOAA-20 FRP values from being pooled.",
        "baseline_policy": "Prior numeric FRP values in the same 90-day leakage-safe window; mean needs >=1 value and sample std needs >=2 values.",
        "history_coverage_policy": "For matched timestamp-valid rows, history_coverage_days is min(90, floor(days since the earliest same-facility detection in the dataset)); unmatched or timestamp-invalid rows have null coverage and insufficient_history=true.",
        "valid_timestamp_matched_hotspots": valid_matched_rows,
        "rows_with_prior_facility_detection_90d": int((populated_recurrence > 0).sum()),
        "recurrence_count_90d_summary": summarise_numeric(output_frame["recurrence_count_90d"]),
        "rows_with_prior_frp_observation": int((populated_counts > 0).sum()),
        "rows_with_sufficient_prior_frp_for_std": int((populated_counts >= 2).sum()),
        "rows_with_full_history_coverage": int(output_frame["history_coverage_days"].eq(WINDOW_DAYS).sum()),
        "rows_with_insufficient_history": int(output_frame["insufficient_history"].sum()),
        "early_2024_matched_history_coverage": {
            "rows": int(len(early_2024)),
            "full_90_day_coverage": int(early_2024["history_coverage_days"].eq(WINDOW_DAYS).sum()),
            "insufficient_history": int(early_2024["insufficient_history"].sum()),
        },
        "baseline_strata_with_observations": int(frame.loc[eligible].groupby(BASELINE_GROUP_COLUMNS, dropna=True).ngroups),
        "schema_fields_added": [
            "acquisition_timestamp_utc",
            "recurrence_count_90d",
            "facility_frp_observation_count_90d",
            "facility_frp_mean_90d",
            "facility_frp_std_90d",
            "history_coverage_days",
            "insufficient_history",
        ],
        "leakage_check": "passed: all recurrence and baseline windows exclude the current timestamp and later events.",
    }
    VALIDATION_OUTPUT.write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")
    return validation


if __name__ == "__main__":
    print(json.dumps(run(), indent=2))
