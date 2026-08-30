"""Track B Phase B3: deterministic industrial sub-classification and anomalies."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
B2_INPUT = ROOT / "data/sample/processed/track_b_b2_recurrence_baselines.csv"
OUTPUT = ROOT / "data/sample/processed/track_b_b3_classified_anomalies.csv"
VALIDATION_OUTPUT = ROOT / "data/sample/validation/track_b_b3_validation.json"

RULE_VERSION = "track_b_b3_rules_v1"
MATCH_RADIUS_M = 5_000.0
PERSISTENT_RECURRENCE_MIN = 8  # B2 matched-row 75th percentile.
LOW_RECURRENCE_MAX = 3  # B2 matched-row median.
LOW_DEVIATION_Z_MAX = 1.0
ANOMALY_Z_MIN = 3.0
MIN_BASELINE_OBSERVATIONS = 2
INSUFFICIENT_HISTORY_CONFIDENCE_CAP = 0.55


def proximity_strength(distance_m: float) -> float:
    """Map the configured B1 5 km radius to a transparent 0-1 proximity weight."""
    return max(0.0, min(1.0, 1.0 - (distance_m / MATCH_RADIUS_M)))


def validate_input(frame: pd.DataFrame) -> None:
    required = {
        "hotspot_id", "facility_id", "facility_type", "distance_to_facility_m", "frp",
        "recurrence_count_90d", "facility_frp_mean_90d", "facility_frp_std_90d",
        "facility_frp_observation_count_90d", "insufficient_history",
    }
    missing = required - set(frame.columns)
    if missing:
        raise RuntimeError(f"B2 input is missing required columns: {sorted(missing)}")
    if not frame["hotspot_id"].is_unique:
        raise RuntimeError("B2 input must contain exactly one row per hotspot_id.")


def run(
    persistent_recurrence_min: int = PERSISTENT_RECURRENCE_MIN,
    low_recurrence_max: int = LOW_RECURRENCE_MAX,
    anomaly_z_min: float = ANOMALY_Z_MIN,
) -> dict:
    if persistent_recurrence_min < 1 or low_recurrence_max < 0 or anomaly_z_min <= 0:
        raise ValueError("B3 thresholds must be positive and internally valid.")
    input_frame = pd.read_csv(B2_INPUT)
    validate_input(input_frame)
    frame = input_frame.copy()
    frame["_input_order"] = np.arange(len(frame))
    frame["_frp_numeric"] = pd.to_numeric(frame["frp"], errors="coerce")
    frame["_distance_numeric"] = pd.to_numeric(frame["distance_to_facility_m"], errors="coerce")
    frame["_mean_numeric"] = pd.to_numeric(frame["facility_frp_mean_90d"], errors="coerce")
    frame["_std_numeric"] = pd.to_numeric(frame["facility_frp_std_90d"], errors="coerce")
    frame["_baseline_count_numeric"] = pd.to_numeric(frame["facility_frp_observation_count_90d"], errors="coerce")
    frame["_recurrence_numeric"] = pd.to_numeric(frame["recurrence_count_90d"], errors="coerce")
    frame["_insufficient_history"] = frame["insufficient_history"].astype("boolean")

    matched = frame["facility_id"].notna()
    valid_baseline = (
        matched
        & ~frame["_insufficient_history"].fillna(True)
        & frame["_baseline_count_numeric"].ge(MIN_BASELINE_OBSERVATIONS)
        & frame["_std_numeric"].gt(0)
        & frame["_frp_numeric"].notna()
    )
    frame["z_score_frp"] = np.nan
    frame.loc[valid_baseline, "z_score_frp"] = (
        (frame.loc[valid_baseline, "_frp_numeric"] - frame.loc[valid_baseline, "_mean_numeric"])
        / frame.loc[valid_baseline, "_std_numeric"]
    )

    frame["sub_class"] = pd.NA
    frame["is_anomalous"] = pd.Series(False, index=frame.index, dtype="boolean")
    frame["confidence_score"] = np.nan

    classified_mining = 0
    gas_flare = 0
    industrial_fire = 0
    history_suppressed = 0
    for index, row in frame.iterrows():
        if not matched.at[index]:
            # Unmatched rows have no facility-specific industrial evidence.
            continue
        distance = row["_distance_numeric"]
        if pd.isna(distance) or distance < 0 or distance > MATCH_RADIUS_M:
            raise RuntimeError("Matched B2 rows must retain a valid B1 facility distance.")
        proximity = proximity_strength(float(distance))
        insufficient = bool(row["_insufficient_history"])
        facility_type = row["facility_type"]

        # A direct mining tag is sufficient for mining_activity, but history
        # uncertainty caps the confidence and never produces an anomaly flag.
        if facility_type == "mining":
            score = 0.65 + (0.25 * proximity)
            if insufficient:
                score = min(score, INSUFFICIENT_HISTORY_CONFIDENCE_CAP)
                history_suppressed += 1
            frame.at[index, "sub_class"] = "mining_activity"
            frame.at[index, "confidence_score"] = round(score, 3)
            classified_mining += 1
            continue

        if insufficient:
            # Do not turn low observed recurrence or incomplete baselines into
            # a high-confidence gas-flare or industrial-fire decision.
            frame.at[index, "confidence_score"] = round(min(0.20 * proximity, INSUFFICIENT_HISTORY_CONFIDENCE_CAP), 3)
            history_suppressed += 1
            continue

        recurrence = row["_recurrence_numeric"]
        z_score = row["z_score_frp"]
        if pd.notna(recurrence) and pd.notna(z_score):
            if recurrence >= persistent_recurrence_min and abs(z_score) <= LOW_DEVIATION_Z_MAX:
                recurrence_strength = min(float(recurrence) / persistent_recurrence_min, 1.0)
                deviation_strength = 1.0 - (abs(float(z_score)) / LOW_DEVIATION_Z_MAX)
                score = min(0.95, 0.55 + 0.15 * recurrence_strength + 0.15 * deviation_strength + 0.15 * proximity)
                frame.at[index, "sub_class"] = "gas_flare"
                frame.at[index, "confidence_score"] = round(score, 3)
                gas_flare += 1
                continue
            if recurrence <= low_recurrence_max and z_score >= anomaly_z_min:
                recurrence_strength = 1.0 - (float(recurrence) / max(low_recurrence_max, 1))
                anomaly_strength = min((float(z_score) - anomaly_z_min) / anomaly_z_min, 1.0)
                score = min(0.95, 0.55 + 0.15 * recurrence_strength + 0.15 * anomaly_strength + 0.15 * proximity)
                frame.at[index, "sub_class"] = "industrial_fire"
                frame.at[index, "is_anomalous"] = True
                frame.at[index, "confidence_score"] = round(score, 3)
                industrial_fire += 1
                continue

        # Matched but inconclusive rows retain a small proximity-only evidence
        # score; it is not a probability or a classification decision.
        frame.at[index, "confidence_score"] = round(0.20 * proximity, 3)

    output_frame = frame.sort_values("_input_order", kind="stable").drop(
        columns=[
            "_input_order", "_frp_numeric", "_distance_numeric", "_mean_numeric",
            "_std_numeric", "_baseline_count_numeric", "_recurrence_numeric", "_insufficient_history",
        ]
    )

    if len(output_frame) != len(input_frame) or not output_frame["hotspot_id"].is_unique:
        raise RuntimeError("B3 output must preserve every B2 hotspot exactly once.")
    if not output_frame["hotspot_id"].equals(input_frame["hotspot_id"]):
        raise RuntimeError("B3 output must preserve B2 hotspot order and identity.")
    if not output_frame[input_frame.columns].equals(input_frame):
        raise RuntimeError("B3 must not alter B2 source columns.")
    if output_frame.loc[~matched, ["sub_class", "z_score_frp", "confidence_score"]].notna().any().any():
        raise RuntimeError("Unmatched B2 rows must retain null B3 class, z-score, and confidence.")
    if output_frame.loc[~matched, "is_anomalous"].astype(bool).any():
        raise RuntimeError("Unmatched B2 rows cannot be anomalous.")
    if output_frame.loc[frame["_insufficient_history"].fillna(True), "is_anomalous"].astype(bool).any():
        raise RuntimeError("Insufficient-history rows cannot be anomalous.")
    if (output_frame["confidence_score"].dropna().lt(0) | output_frame["confidence_score"].dropna().gt(1)).any():
        raise RuntimeError("B3 confidence scores must be in [0, 1].")
    eligible_output = valid_baseline
    if output_frame.loc[~eligible_output, "z_score_frp"].notna().any():
        raise RuntimeError("z_score_frp must be null without an eligible baseline.")
    expected_z = (frame.loc[eligible_output, "_frp_numeric"] - frame.loc[eligible_output, "_mean_numeric"]) / frame.loc[eligible_output, "_std_numeric"]
    if not np.allclose(output_frame.loc[eligible_output, "z_score_frp"], expected_z, rtol=1e-12, atol=1e-12):
        raise RuntimeError("z_score_frp does not match the B2 sensor-specific baseline.")
    if not set(output_frame["sub_class"].dropna()).issubset({"mining_activity", "gas_flare", "industrial_fire"}):
        raise RuntimeError("B3 emitted an unsupported industrial subclass.")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    VALIDATION_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    output_frame.to_csv(OUTPUT, index=False)
    subclass_counts = Counter(output_frame["sub_class"].dropna())
    validation = {
        "status": "passed",
        "input_path": str(B2_INPUT.relative_to(ROOT)),
        "output_path": str(OUTPUT.relative_to(ROOT)),
        "input_hotspots": int(len(input_frame)),
        "output_hotspots": int(len(output_frame)),
        "unique_hotspot_ids": int(output_frame["hotspot_id"].nunique()),
        "matched_hotspots": int(matched.sum()),
        "unmatched_hotspots": int((~matched).sum()),
        "subclass_counts": dict(sorted(subclass_counts.items())),
        "unclassified_hotspots": int(output_frame["sub_class"].isna().sum()),
        "anomalous_hotspots": int(output_frame["is_anomalous"].sum()),
        "valid_z_scores": int(output_frame["z_score_frp"].notna().sum()),
        "insufficient_history_rows": int(frame["_insufficient_history"].fillna(True).sum()),
        "rows_suppressed_or_capped_for_insufficient_history": history_suppressed,
        "rule_version": RULE_VERSION,
        "thresholds": {
            "match_radius_m": MATCH_RADIUS_M,
            "persistent_recurrence_min": persistent_recurrence_min,
            "low_recurrence_max": low_recurrence_max,
            "low_deviation_abs_z_max": LOW_DEVIATION_Z_MAX,
            "anomaly_z_min": anomaly_z_min,
            "min_baseline_observations": MIN_BASELINE_OBSERVATIONS,
            "insufficient_history_confidence_cap": INSUFFICIENT_HISTORY_CONFIDENCE_CAP,
        },
        "rules": {
            "mining_activity": "matched facility_type=mining; never anomalous; confidence is capped when history is insufficient",
            "gas_flare": "non-mining, sufficient history, recurrence >= 8, and |z_score_frp| <= 1",
            "industrial_fire": "non-mining, sufficient history, recurrence <= 3, and z_score_frp >= 3; is_anomalous=true",
            "history_guardrail": "insufficient-history rows cannot be industrial_fire or anomalous; only direct mining tags may receive a capped-confidence subclass",
        },
        "confidence_policy": "Rule-evidence score, not a calibrated probability. Mining: 0.65 + 0.25*proximity; gas flare/fire: 0.55 + 0.15*recurrence evidence + 0.15*FRP evidence + 0.15*proximity; inconclusive matched rows: 0.20*proximity; unmatched: null.",
        "schema_fields_added": ["sub_class", "z_score_frp", "is_anomalous", "confidence_score"],
        "validation": "B2 columns and hotspot order preserved; z-score eligibility, confidence range, subclass vocabulary, and insufficient-history anomaly guardrail passed.",
    }
    VALIDATION_OUTPUT.write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")
    return validation


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--persistent-recurrence-min", type=int, default=PERSISTENT_RECURRENCE_MIN)
    parser.add_argument("--low-recurrence-max", type=int, default=LOW_RECURRENCE_MAX)
    parser.add_argument("--anomaly-z-min", type=float, default=ANOMALY_Z_MIN)
    args = parser.parse_args()
    print(json.dumps(run(args.persistent_recurrence_min, args.low_recurrence_max, args.anomaly_z_min), indent=2))
