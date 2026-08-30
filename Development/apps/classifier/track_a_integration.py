"""
Track A Integration Module

Wraps the Track A classification pipeline (track_a/a4/handoff.py) for use
in the FastAPI classifier service.
"""

import sys
import math
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime
import numpy as np

logger = logging.getLogger(__name__)

# Add Track A module to Python path
REPO_ROOT = Path(__file__).parent
TRACK_A_PATH = REPO_ROOT / "track_a" / "a4"
sys.path.insert(0, str(TRACK_A_PATH))

try:
    from handoff import classify_track_a
    TRACK_A_AVAILABLE = True
    logger.info("✅ Track A module loaded successfully")
except ImportError as e:
    TRACK_A_AVAILABLE = False
    logger.warning(f"⚠️ Track A module not available: {e}")
    classify_track_a = None

WORLDCOVER_DIR = REPO_ROOT / "data" / "raw" / "worldcover" / "tiles" / "tiles"

WORLDCOVER_TO_TRACK_A = {
    10: "forest",       # Tree cover
    20: "grassland",    # Shrubland
    30: "grassland",    # Grassland
    40: "cropland",     # Cropland
    50: "built_up",     # Built-up
    60: "bare",         # Bare / sparse vegetation
    90: "grassland",    # Herbaceous wetland
    95: "forest",       # Mangroves
    100: "grassland",   # Moss and lichen
}

def season_for_month(month: int) -> str:
    """India meteorological seasons."""
    if month in {1, 2}:
        return "winter"
    if month in {3, 4, 5}:
        return "summer"
    if month in {6, 7, 8, 9}:
        return "southwest_monsoon"
    return "northeast_monsoon"

def extract_land_cover(lat: float, lon: float) -> str:
    """Sample ESA WorldCover GeoTIFF for a given lat/lon."""
    if not WORLDCOVER_DIR.exists():
        return "unknown"

    # Worldcover v200 tiles are named like ESA_WorldCover_10m_2021_v200_N06E075_Map.tif
    # The coordinate is the lower-left corner (South-West) of a 3x3 degree tile.
    lat_band = (int(math.floor(lat)) // 3) * 3
    lon_band = (int(math.floor(lon)) // 3) * 3

    lat_dir = "N" if lat_band >= 0 else "S"
    lon_dir = "E" if lon_band >= 0 else "W"

    filename = f"ESA_WorldCover_10m_2021_v200_{lat_dir}{abs(lat_band):02d}{lon_dir}{abs(lon_band):03d}_Map.tif"
    filepath = WORLDCOVER_DIR / filename

    if not filepath.exists():
        return "unknown"

    try:
        import rasterio
        from pyproj import Transformer
        with rasterio.open(filepath) as src:
            if src.crs is None:
                return "unknown"
            transformer = Transformer.from_crs("EPSG:4326", src.crs, always_xy=True)
            x, y = transformer.transform(lon, lat)
            if src.bounds.left <= x < src.bounds.right and src.bounds.bottom < y <= src.bounds.top:
                generator = src.sample([(x, y)], indexes=1, masked=True)
                val = next(generator)[0]
                if not np.ma.is_masked(val) and val != src.nodata:
                    return WORLDCOVER_TO_TRACK_A.get(int(val), "unknown")
    except Exception as e:
        logger.error(f"Error reading worldcover tile {filepath}: {e}")

    return "unknown"

def normalize_value(val: float, val_min: float, val_max: float) -> float:
    """Safely min-max normalize a value between known historical bounds."""
    if val is None or not math.isfinite(val):
        return 0.5 # fallback safe value
    if val_max <= val_min:
        return 0.0
    norm = (val - val_min) / (val_max - val_min)
    return max(0.0, min(1.0, norm))

def prepare_track_a_features(hotspot: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare feature dictionary for Track A classification.
    """
    lat = float(hotspot["latitude"])
    lon = float(hotspot["longitude"])

    # 1. Temporal
    acq_date = hotspot.get("acquisition_date")
    month = 1
    if acq_date:
        try:
            dt = datetime.strptime(acq_date, "%Y-%m-%d")
            month = dt.month
        except ValueError:
            pass

    season = season_for_month(month)
    daynight = "day" if hotspot.get("daynight", "D") == "D" else "night"

    # 2. Instrument & Radiometric Normalization (Using historical global bounds for MODIS/VIIRS)
    instrument = str(hotspot.get("instrument", "")).strip().upper()
    instrument_group = "VIIRS" if "VIIRS" in instrument else "MODIS"

    brightness = float(hotspot.get("brightness", 0.0))
    frp = float(hotspot.get("frp", 0.0))

    if instrument_group == "VIIRS":
        # VIIRS typically maxes around 367K for brightness
        b_norm = normalize_value(brightness, 290.0, 367.0)
        f_norm = normalize_value(frp, 0.0, 500.0)
    else:
        # MODIS typically maxes around 500K for brightness
        b_norm = normalize_value(brightness, 290.0, 500.0)
        f_norm = normalize_value(frp, 0.0, 2000.0)

    # 3. Land Cover
    land_cover = extract_land_cover(lat, lon)

    # 4. Neighborhood Count (Fallback to 1 for live single inference,
    # since we don't have the historic batch to compare against easily
    # without a hit to Postgres which belongs to backend, not classifier)
    neighborhood_count = 1

    return {
        "hotspot_id": hotspot.get("hotspot_id"),
        "latitude": lat,
        "longitude": lon,
        "a1_brightness_normalized": b_norm,
        "a1_frp_normalized": f_norm,
        "a2_neighborhood_detection_count": neighborhood_count,
        "a1_month": month,
        "a1_land_cover_type": land_cover,
        "a1_daynight": daynight,
        "a1_season": season,
        "a1_instrument_group": instrument_group,
    }

def classify_with_track_a(hotspot: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Run Track A classification on a single hotspot.

    Returns a dict conforming to the shared output contract, or None if
    Track A is unavailable or classification fails.
    """

    if not TRACK_A_AVAILABLE or classify_track_a is None:
        logger.warning("Track A not available, skipping classification")
        return None

    try:
        features = prepare_track_a_features(hotspot)
        result = classify_track_a(features)
        logger.debug(f"Track A classified hotspot {hotspot.get('hotspot_id')}: {result.get('primary_class')}")
        return result
    except Exception as e:
        logger.error(f"Track A classification failed for {hotspot.get('hotspot_id')}: {e}")
        return None
