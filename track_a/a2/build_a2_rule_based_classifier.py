"""Phase A2: transparent, standalone Track A rule-based baseline classifier.

Consumes the existing A1 CSV.  The only new supporting calculation is a
spatial neighborhood count for this pilot dataset; it is not facility matching
or Track B's time-window recurrence metric.
"""

from __future__ import annotations

import json
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
import pandas as pd


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
DEFAULT_A1_INPUT = ROOT / "data/sample/processed/firms_sample_a1_enriched.csv"
DEFAULT_OUTPUT = ROOT / "data/sample/processed/firms_sample_a2_rule_based.csv"
DEFAULT_REPORT = ROOT / "data/sample/validation/firms_sample_a2_validation.json"

VALID_PRIMARY = {"industrial", "natural"}


@dataclass(frozen=True)
class A2Config:
    """Auditable thresholds for the pilot's density-based baseline."""

    density_radius_m: float = 1_000.0
    strong_cluster_min_detections: int = 10
    low_density_max_detections: int = 2
    model_version: str = "rule_based_v1.0"


def load_a1(path: Path) -> pd.DataFrame:
    """Load the A1 result, failing clearly rather than attempting to rebuild A1."""
    if not path.exists():
        raise FileNotFoundError(f"A1 input not found: {path}. Run build_a1_land_cover_features.py first.")
    frame = pd.read_csv(path, keep_default_na=False)
    required = {"latitude", "longitude", "a1_land_cover_type", "a1_coordinate_valid", "a1_input_row"}
    missing = sorted(required - set(frame.columns))
    if missing:
        raise ValueError(f"A1 input is missing required A1 columns: {', '.join(missing)}")
    return frame


def neighborhood_detection_count(frame: pd.DataFrame, config: A2Config) -> pd.Series:
    """Count pilot hotspots within radius, including the hotspot itself.

    This is deliberately a location-only density signal over the static A1
    pilot set. It neither groups by facility nor computes a trailing time
    window, so it remains independent of Track B recurrence work.
    """
    latitude = pd.to_numeric(frame["latitude"], errors="coerce").to_numpy(dtype=float)
    longitude = pd.to_numeric(frame["longitude"], errors="coerce").to_numpy(dtype=float)
    valid_flag = frame["a1_coordinate_valid"].astype(str).str.lower().eq("true").to_numpy()
    valid = valid_flag & np.isfinite(latitude) & np.isfinite(longitude)
    counts = np.zeros(len(frame), dtype=int)
    valid_indexes = np.flatnonzero(valid)
    if not len(valid_indexes):
        return pd.Series(counts, index=frame.index, dtype="Int64")

    lat = np.radians(latitude[valid_indexes])
    lon = np.radians(longitude[valid_indexes])
    # Looping over the pilot points avoids materializing a full N x N matrix.
    for position, original_index in enumerate(valid_indexes):
        dlat = lat - lat[position]
        dlon = lon - lon[position]
        haversine = np.sin(dlat / 2) ** 2 + np.cos(lat[position]) * np.cos(lat) * np.sin(dlon / 2) ** 2
        distances_m = 6_371_000 * 2 * np.arcsin(np.sqrt(haversine))
        counts[original_index] = int((distances_m <= config.density_radius_m).sum())
    return pd.Series(counts, index=frame.index, dtype="Int64")


def density_level(count: int, coordinate_valid: bool, config: A2Config) -> str:
    if not coordinate_valid:
        return "unknown"
    if count >= config.strong_cluster_min_detections:
        return "strong_cluster"
    if count <= config.low_density_max_detections:
        return "low_density"
    return "moderate_density"


def classify_row(row: pd.Series, config: A2Config) -> tuple[str, str, float, str]:
    """Apply conservative, explainable A2 rules.

    Industrial is assigned only when built-up/bare context and strong spatial
    clustering agree. All other contexts use a natural-side fallback, because
    Track A has no facility evidence; Track B may refine industrial candidates
    later. `industrial_candidate` is intentionally not used as a sub_class:
    industrial sub-classification belongs to Track B.
    """
    land_cover = str(row.get("a1_land_cover_type", "unknown"))
    level = str(row["a2_density_level"])

    if land_cover == "cropland":
        return "natural", "agricultural_burning", 0.82 if level == "strong_cluster" else 0.78, "A2_CROPLAND_NATURAL"
    if land_cover == "forest":
        return "natural", "forest_fire", 0.80 if level == "low_density" else 0.62, "A2_FOREST_NATURAL"
    if land_cover == "grassland":
        return "natural", "other_natural", 0.76 if level == "low_density" else 0.60, "A2_GRASSLAND_NATURAL"
    if land_cover in {"built_up", "bare"} and level == "strong_cluster":
        confidence = 0.86 if land_cover == "built_up" else 0.78
        # Track A does not assign industrial sub-classes; that is Track B work.
        return "industrial", None, confidence, "A2_DENSE_BUILT_OR_BARE_INDUSTRIAL"
    if land_cover in {"built_up", "bare"}:
        return "natural", "other_natural", 0.45, "A2_AMBIGUOUS_BUILT_OR_BARE_FALLBACK"
    return "natural", "other_natural", 0.35, "A2_UNKNOWN_LAND_COVER_FALLBACK"


def build_a2_classifier(a1_input: Path = DEFAULT_A1_INPUT, output_path: Path = DEFAULT_OUTPUT,
                        report_path: Path = DEFAULT_REPORT, config: A2Config = A2Config()) -> dict[str, object]:
    frame = load_a1(a1_input)
    frame["a2_neighborhood_detection_count"] = neighborhood_detection_count(frame, config)
    valid = frame["a1_coordinate_valid"].astype(str).str.lower().eq("true")
    frame["a2_density_level"] = [
        density_level(int(count), bool(is_valid), config)
        for count, is_valid in zip(frame["a2_neighborhood_detection_count"], valid)
    ]
    classifications = frame.apply(classify_row, axis=1, result_type="expand", args=(config,))
    frame[["primary_class", "sub_class", "confidence_score", "a2_rule_id"]] = classifications
    frame["confidence_score"] = pd.to_numeric(frame["confidence_score"], errors="raise")
    frame["model_version"] = config.model_version

    if not set(frame["primary_class"]).issubset(VALID_PRIMARY):
        raise AssertionError("A2 produced an invalid primary class.")
    if not set(frame["sub_class"].dropna()).issubset({"forest_fire", "agricultural_burning", "other_natural"}):
        raise AssertionError("A2 produced a sub-class outside Track A's A2 contract.")
    if frame.loc[frame["primary_class"] == "industrial", "sub_class"].notna().any():
        raise AssertionError("A2 must leave industrial sub-classification to Track B.")
    if not frame["confidence_score"].between(0, 1).all():
        raise AssertionError("A2 confidence scores must stay in [0, 1].")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(output_path, index=False)
    report = {
        "phase": "A2_rule_based_baseline_classifier",
        "a1_input": str(a1_input),
        "a2_output": str(output_path),
        "input_rows": len(frame),
        "output_rows": len(frame),
        "all_input_rows_preserved": True,
        "config": asdict(config),
        "classification_counts": dict(sorted(Counter(frame["primary_class"]).items())),
        "sub_class_counts": dict(sorted(Counter(frame["sub_class"].fillna("null")).items())),
        "rule_counts": dict(sorted(Counter(frame["a2_rule_id"]).items())),
        "density_level_counts": dict(sorted(Counter(frame["a2_density_level"]).items())),
        "strong_cluster_built_or_bare_industrial": int(((frame["a1_land_cover_type"].isin(["built_up", "bare"])) & (frame["a2_density_level"] == "strong_cluster") & (frame["primary_class"] == "industrial")).sum()),
        "confidence_range": [float(frame["confidence_score"].min()), float(frame["confidence_score"].max())],
        "track_b_columns_present": sorted({"facility_id", "distance_to_facility_m", "recurrence_count_90d", "z_score_frp", "is_anomalous"} & set(frame.columns)),
    }
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    print(json.dumps(build_a2_classifier(), indent=2))
