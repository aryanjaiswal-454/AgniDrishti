"""
Classification Merge Logic

Implements the priority rules for combining Track A and Track B results
into the final unified classification.
"""

from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


def merge_track_results(
    hotspot_id: str,
    latitude: float,
    longitude: float,
    track_a_result: Optional[Dict[str, Any]],
    track_b_result: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Merge Track A and Track B results per priority rules.

    **Priority Rules:**
    1. Always use Track A for: primary_class, land_cover_type, natural sub_class
    2. Always use Track B for: facility_id, distance_to_facility_m, recurrence_count_90d,
       z_score_frp, is_anomalous, industrial sub_class
    3. If Track B identifies facility match (distance < 5km), prefer Track B sub_class
    4. Confidence score: use Track B if available and facility matched, else Track A
    5. Model version: combine both versions

    **Field Ownership:**
    - Track A: primary_class, land_cover_type, natural sub_class, confidence_score, model_version
    - Track B: facility_id, distance_to_facility_m, industrial sub_class,
               recurrence_count_90d, z_score_frp, is_anomalous, confidence_score, model_version

    Returns a dict conforming to the shared output contract schema.
    """

    # Initialize result with required base fields
    result = {
        "hotspot_id": hotspot_id,
        "latitude": latitude,
        "longitude": longitude,
    }

    # Track A fields (if available)
    if track_a_result:
        result["primary_class"] = track_a_result.get("primary_class")
        result["land_cover_type"] = track_a_result.get("land_cover_type")

        # Track A sub_class (only for natural events)
        track_a_subclass = track_a_result.get("sub_class")
        if track_a_subclass in ["forest_fire", "agricultural_burning", "other_natural"]:
            result["sub_class"] = track_a_subclass
        else:
            result["sub_class"] = None

        result["confidence_score"] = track_a_result.get("confidence_score")
        track_a_version = track_a_result.get("model_version", "unknown")
    else:
        result["primary_class"] = None
        result["land_cover_type"] = None
        result["sub_class"] = None
        result["confidence_score"] = None
        track_a_version = "unavailable"

    # Track B fields (if available)
    if track_b_result:
        result["facility_id"] = track_b_result.get("facility_id")
        result["distance_to_facility_m"] = track_b_result.get("distance_to_facility_m")
        result["recurrence_count_90d"] = track_b_result.get("recurrence_count_90d")
        result["z_score_frp"] = track_b_result.get("z_score_frp")
        result["is_anomalous"] = track_b_result.get("is_anomalous", False)

        # Track B sub_class (only for industrial events)
        track_b_subclass = track_b_result.get("sub_class")
        if track_b_subclass in ["gas_flare", "industrial_fire", "mining_activity"]:
            result["sub_class"] = track_b_subclass

            # If Track B has facility match, prefer Track B confidence
            if track_b_result.get("facility_id"):
                result["confidence_score"] = track_b_result.get("confidence_score")

        track_b_version = track_b_result.get("model_version", "unknown")
    else:
        result["facility_id"] = None
        result["distance_to_facility_m"] = None
        result["recurrence_count_90d"] = None
        result["z_score_frp"] = None
        result["is_anomalous"] = False
        track_b_version = "unavailable"

    # Combined model version
    result["model_version"] = f"track_a:{track_a_version}+track_b:{track_b_version}"

    # Ensure all 13 required fields are present
    result.setdefault("primary_class", None)
    result.setdefault("sub_class", None)
    result.setdefault("land_cover_type", None)
    result.setdefault("facility_id", None)
    result.setdefault("distance_to_facility_m", None)
    result.setdefault("recurrence_count_90d", None)
    result.setdefault("z_score_frp", None)
    result.setdefault("is_anomalous", False)
    result.setdefault("confidence_score", None)

    logger.debug(f"Merged result for {hotspot_id}: primary={result['primary_class']}, sub={result['sub_class']}")

    return result
