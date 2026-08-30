"""Phase A4: adapt existing Track A A3 inference to the shared AIML contract."""

from __future__ import annotations

import math
import sys
from pathlib import Path
from typing import Mapping


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
A3_DIR = HERE.parent / "a3"
if str(A3_DIR) not in sys.path:
    sys.path.insert(0, str(A3_DIR))

from inference import classify_primary  # noqa: E402  (A3 is not a package yet)


VALID_LAND_COVER = {"forest", "cropland", "built_up", "bare", "grassland"}


def _finite_number(hotspot_features: Mapping[str, object], field: str) -> float:
    value = hotspot_features.get(field)
    try:
        number = float(value)  # accepts numeric CSV values while rejecting missing text below
    except (TypeError, ValueError) as error:
        raise ValueError(f"{field} is required as a finite number for the shared output contract.") from error
    if not math.isfinite(number):
        raise ValueError(f"{field} is required as a finite number for the shared output contract.")
    return number


def classify_track_a(hotspot_features: Mapping[str, object]) -> dict[str, object]:
    """Return one JSON-serializable Track A record matching the shared schema.

    `hotspot_id`, `latitude`, and `longitude` are required caller-owned identity
    fields. The A3 feature fields are passed unchanged to A3 inference. Track B
    fields are deliberately supplied as null placeholders; no facility, anomaly,
    or recurrence computation occurs here.
    """
    hotspot_id = hotspot_features.get("hotspot_id")
    if not isinstance(hotspot_id, str) or not hotspot_id.strip():
        raise ValueError("hotspot_id is required as a non-empty string for the shared output contract.")
    prediction = classify_primary(hotspot_features)
    land_cover = hotspot_features.get("a1_land_cover_type", hotspot_features.get("land_cover_type"))
    land_cover_type = str(land_cover) if land_cover in VALID_LAND_COVER else None
    return {
        "hotspot_id": hotspot_id,
        "latitude": _finite_number(hotspot_features, "latitude"),
        "longitude": _finite_number(hotspot_features, "longitude"),
        "primary_class": prediction["primary_class"],
        "sub_class": prediction["sub_class"],
        "land_cover_type": land_cover_type,
        "facility_id": None,
        "distance_to_facility_m": None,
        "recurrence_count_90d": None,
        "z_score_frp": None,
        "is_anomalous": None,
        "confidence_score": float(prediction["confidence_score"]),
        "model_version": prediction["model_version"],
    }
