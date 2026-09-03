"""
Track B Integration Module.

Looks up nearby facilities through PostGIS and computes a rolling 90-day FRP Z-score
for each live hotspot handoff.
"""

import logging
import math
import os
from typing import Any, Dict, Optional

import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)
# Track B is a live PostGIS computation. Do not fall back to a local development
# database in production: that would turn a configuration error into a silent
# loss of facility matching.
DB_URL = os.getenv("DATABASE_URL")


def get_track_b_result(hotspot_id: str, jsonl_path=None) -> Optional[Dict[str, Any]]:
    """Return a live Track B result for a hotspot, or None when no facility is nearby."""
    connection = None
    cursor = None

    if not DB_URL:
        logger.error("Track B is unavailable because DATABASE_URL is not configured")
        return None

    try:
        connection = psycopg2.connect(DB_URL)
        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute("SELECT frp, geometry FROM hotspots WHERE id = %s", (hotspot_id,))
        hotspot = cursor.fetchone()
        if not hotspot:
            return None

        frp = float(hotspot["frp"]) if hotspot["frp"] is not None else 0.0
        geometry = hotspot["geometry"]

        cursor.execute(
            """
            SELECT f.id, f.name, f.facility_type,
                   ST_Distance(f.geometry::geography, %s::geography) AS distance_m,
                   fb.avg_frp AS baseline_avg_frp,
                   fb.std_dev_frp AS baseline_std_dev_frp
            FROM facilities f
            LEFT JOIN facility_baselines fb ON fb.facility_id = f.id
            WHERE ST_DWithin(f.geometry::geography, %s::geography, 5000)
            ORDER BY distance_m ASC
            LIMIT 1
            """,
            (geometry, geometry),
        )
        facility = cursor.fetchone()
        if not facility:
            return None

        cursor.execute(
            """
            SELECT frp
            FROM hotspots
            WHERE ST_DWithin(geometry::geography, %s::geography, 5000)
              AND acq_date >= CURRENT_DATE - INTERVAL '90 days'
              AND id != %s
            """,
            (geometry, hotspot_id),
        )
        history = [float(row["frp"]) for row in cursor.fetchall() if row["frp"] is not None]
        recurrence_count = len(history)
        z_score = None
        is_anomalous = False

        if recurrence_count > 0:
            mean = sum(history) / recurrence_count
            variance = sum((value - mean) ** 2 for value in history) / recurrence_count
            standard_deviation = math.sqrt(variance)

            if standard_deviation > 0:
                z_score = (frp - mean) / standard_deviation
                is_anomalous = z_score > 3.0
            elif frp > mean * 1.5:
                z_score = 3.0
                is_anomalous = True

        # A facility baseline is retained for historical and low-volume areas
        # where the live 90-day window cannot yet provide a standard deviation.
        if z_score is None:
            baseline_mean = float(facility["baseline_avg_frp"]) if facility["baseline_avg_frp"] is not None else None
            baseline_std_dev = float(facility["baseline_std_dev_frp"]) if facility["baseline_std_dev_frp"] is not None else None

            if baseline_mean is not None and baseline_std_dev is not None and baseline_std_dev > 0:
                z_score = (frp - baseline_mean) / baseline_std_dev
                is_anomalous = z_score > 3.0
            elif baseline_mean is not None and frp > baseline_mean * 1.5:
                z_score = 3.0
                is_anomalous = True

        return {
            "hotspot_id": hotspot_id,
            "facility_id": facility["id"],
            "distance_to_facility_m": float(facility["distance_m"]),
            "sub_class": "industrial_fire" if is_anomalous else "gas_flare",
            "is_anomalous": is_anomalous,
            "z_score_frp": z_score,
            "recurrence_count_90d": recurrence_count,
            "confidence_score": 0.95,
            "model_version": "v1.0.0-trackB-live",
        }
    except Exception as error:
        logger.error("Track B live computation failed: %s", error, exc_info=True)
        return None
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
