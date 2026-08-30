"""Phase A1: enrich FIRMS hotspots with WorldCover and temporal features.

This is feature engineering only.  It intentionally produces no fire labels,
facility matches, recurrence measures, anomaly flags, or classifier outputs.
"""

from __future__ import annotations

import json
import math
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd
import rasterio
from pyproj import Transformer


HERE = Path(__file__).parent
ROOT = HERE.parents[1]
DEFAULT_FIRMS = ROOT / "data/sample/input/firms_sample.csv"
DEFAULT_RASTER = ROOT / "data/sample/input/worldcover_thoothukudi_2025q4.tif"
DEFAULT_OUTPUT = ROOT / "data/sample/processed/firms_sample_a1_enriched.csv"
DEFAULT_REPORT = ROOT / "data/sample/validation/firms_sample_a1_validation.json"

# ESA WorldCover v200 codes collapsed to the Track A contract.  Water, snow,
# wetland, shrubland/moss/lichen distinctions, and unrecognised values cannot
# be expressed by that five-category contract and are retained as unknown.
WORLDCOVER_TO_TRACK_A = {
    10: "forest",       # Tree cover
    20: "grassland",    # Shrubland
    30: "grassland",    # Grassland
    40: "cropland",     # Cropland
    50: "built_up",     # Built-up
    60: "bare",         # Bare / sparse vegetation
    90: "grassland",    # Herbaceous wetland: closest available vegetation context
    95: "forest",       # Mangroves
    100: "grassland",   # Moss and lichen
}
VALID_LAND_COVER = {"forest", "cropland", "built_up", "bare", "grassland", "unknown"}
REQUIRED_COLUMNS = {"latitude", "longitude", "acq_date"}
OPTIONAL_FIRMS_COLUMNS = {
    "acq_time", "brightness", "bright_ti4", "frp", "confidence", "daynight", "instrument", "satellite"
}


def load_firms(path: Path) -> tuple[pd.DataFrame, dict[str, object]]:
    """Load source records unchanged and add non-destructive input validity flags."""
    if not path.exists():
        raise FileNotFoundError(f"FIRMS input not found: {path}")
    frame = pd.read_csv(path, dtype=str, keep_default_na=False)
    missing = sorted(REQUIRED_COLUMNS - set(frame.columns))
    if missing:
        raise ValueError(f"FIRMS input is missing required column(s): {', '.join(missing)}")

    numeric_lat = pd.to_numeric(frame["latitude"], errors="coerce")
    numeric_lon = pd.to_numeric(frame["longitude"], errors="coerce")
    finite = np.isfinite(numeric_lat) & np.isfinite(numeric_lon)
    coordinate_valid = finite & numeric_lat.between(-90, 90) & numeric_lon.between(-180, 180)
    parsed_dates = pd.to_datetime(frame["acq_date"], format="%Y-%m-%d", errors="coerce")

    # These columns are additive.  Original source columns are never renamed,
    # coerced, dropped, or overwritten.
    frame["a1_coordinate_valid"] = coordinate_valid.astype(bool)
    frame["a1_acq_date_valid"] = parsed_dates.notna().astype(bool)
    frame["a1_input_row"] = np.arange(len(frame), dtype=int)
    info = {
        "input_rows": len(frame),
        "valid_coordinates": int(coordinate_valid.sum()),
        "invalid_coordinates": int((~coordinate_valid).sum()),
        "valid_dates": int(parsed_dates.notna().sum()),
        "invalid_dates": int(parsed_dates.isna().sum()),
        "missing_optional_firms_columns": sorted(OPTIONAL_FIRMS_COLUMNS - set(frame.columns)),
    }
    return frame, info


def season_for_month(month: object) -> str:
    """India meteorological seasons for the Tamil Nadu pilot."""
    if pd.isna(month):
        return "unknown"
    month = int(month)
    if month in {1, 2}:
        return "winter"
    if month in {3, 4, 5}:
        return "summer"
    if month in {6, 7, 8, 9}:
        return "southwest_monsoon"
    return "northeast_monsoon"  # October--December


def add_temporal_features(frame: pd.DataFrame) -> None:
    dates = pd.to_datetime(frame["acq_date"], format="%Y-%m-%d", errors="coerce")
    frame["a1_year"] = dates.dt.year.astype("Int64")
    frame["a1_month"] = dates.dt.month.astype("Int64")
    frame["a1_season"] = frame["a1_month"].map(season_for_month)
    if "daynight" in frame:
        values = frame["daynight"].astype(str).str.strip().str.upper()
        frame["a1_daynight"] = values.map({"D": "day", "N": "night"}).fillna("unknown")
    else:
        frame["a1_daynight"] = "unknown"


def _thermal_value(row: pd.Series) -> tuple[float, str]:
    """Choose the native brightness field; never use one sensor's scale as another's."""
    instrument = str(row.get("instrument", "")).strip().upper()
    candidates = ("bright_ti4", "brightness") if instrument == "VIIRS" else ("brightness", "bright_ti4")
    for name in candidates:
        value = pd.to_numeric(pd.Series([row.get(name, "")]), errors="coerce").iloc[0]
        if pd.notna(value) and math.isfinite(float(value)):
            return float(value), name
    return math.nan, "missing"


def _minmax_by_instrument(values: pd.Series, instruments: pd.Series) -> pd.Series:
    output = pd.Series(np.nan, index=values.index, dtype=float)
    for instrument, indexes in instruments.groupby(instruments, dropna=False).groups.items():
        subset = values.loc[indexes].replace([np.inf, -np.inf], np.nan).dropna()
        if subset.empty:
            continue
        low, high = subset.min(), subset.max()
        # A single finite source value contains no scale information.
        output.loc[subset.index] = 0.0 if low == high else (subset - low) / (high - low)
    return output


def add_radiometric_features(frame: pd.DataFrame) -> None:
    selected = frame.apply(_thermal_value, axis=1, result_type="expand")
    frame["a1_brightness_value"] = pd.to_numeric(selected[0], errors="coerce")
    frame["a1_brightness_source"] = selected[1]
    instruments = frame.get("instrument", pd.Series("unknown", index=frame.index)).astype(str).str.strip().str.upper()
    instruments = instruments.where(instruments.isin(["MODIS", "VIIRS"]), "unknown")
    frame["a1_instrument_group"] = instruments
    frp = pd.to_numeric(frame.get("frp", pd.Series(np.nan, index=frame.index)), errors="coerce")
    frame["a1_frp_value"] = frp.where(np.isfinite(frp))
    # Per-instrument min--max normalization is deliberately separate for
    # MODIS and VIIRS, preserving cross-sensor comparability limits.
    frame["a1_brightness_normalized"] = _minmax_by_instrument(frame["a1_brightness_value"], instruments)
    frame["a1_frp_normalized"] = _minmax_by_instrument(frame["a1_frp_value"], instruments)


def sample_worldcover(frame: pd.DataFrame, raster_path: Path) -> dict[str, object]:
    """Sample one band lazily. Invalid/outside/NoData rows stay in the output."""
    frame["a1_worldcover_code"] = pd.Series(pd.NA, index=frame.index, dtype="Int64")
    frame["a1_land_cover_type"] = "unknown"
    frame["a1_worldcover_status"] = "not_sampled_invalid_coordinate"
    valid = frame["a1_coordinate_valid"]
    summary: dict[str, object] = {"raster_path": str(raster_path), "raster_available": raster_path.exists()}
    if not raster_path.exists():
        frame.loc[valid, "a1_worldcover_status"] = "raster_missing"
        summary.update({"raster_crs": None, "sampled": 0, "outside_extent": 0, "nodata": 0, "raster_missing": int(valid.sum())})
        return summary

    with rasterio.open(raster_path) as src:
        if src.crs is None:
            frame.loc[valid, "a1_worldcover_status"] = "raster_crs_missing"
            summary.update({"raster_crs": None, "sampled": 0, "outside_extent": 0, "nodata": 0, "raster_crs_missing": int(valid.sum())})
            return summary
        transformer = Transformer.from_crs("EPSG:4326", src.crs, always_xy=True)
        indexes = frame.index[valid].tolist()
        coordinates = [(float(frame.at[i, "longitude"]), float(frame.at[i, "latitude"])) for i in indexes]
        transformed = [transformer.transform(x, y) for x, y in coordinates]
        inside = [src.bounds.left <= x < src.bounds.right and src.bounds.bottom < y <= src.bounds.top for x, y in transformed]
        for i, point_inside in zip(indexes, inside):
            if not point_inside:
                frame.at[i, "a1_worldcover_status"] = "outside_raster_extent"
        inside_indexes = [i for i, point_inside in zip(indexes, inside) if point_inside]
        inside_points = [point for point, point_inside in zip(transformed, inside) if point_inside]
        # rasterio.sample reads only the pixels addressed by these points.
        for i, pixel in zip(inside_indexes, src.sample(inside_points, indexes=1, masked=True)):
            value = pixel[0]
            if np.ma.is_masked(value) or (src.nodata is not None and value == src.nodata):
                frame.at[i, "a1_worldcover_status"] = "nodata"
                continue
            code = int(value)
            frame.at[i, "a1_worldcover_code"] = code
            frame.at[i, "a1_land_cover_type"] = WORLDCOVER_TO_TRACK_A.get(code, "unknown")
            frame.at[i, "a1_worldcover_status"] = "sampled" if code in WORLDCOVER_TO_TRACK_A else "unmapped_code"
        summary.update({
            "raster_crs": str(src.crs), "raster_bounds": [src.bounds.left, src.bounds.bottom, src.bounds.right, src.bounds.top],
            "raster_nodata": src.nodata, "sampled": int((frame["a1_worldcover_status"] == "sampled").sum()),
            "unmapped_code": int((frame["a1_worldcover_status"] == "unmapped_code").sum()),
            "outside_extent": int((frame["a1_worldcover_status"] == "outside_raster_extent").sum()),
            "nodata": int((frame["a1_worldcover_status"] == "nodata").sum()),
        })
    return summary


def build_a1_features(firms_path: Path = DEFAULT_FIRMS, raster_path: Path = DEFAULT_RASTER,
                      output_path: Path = DEFAULT_OUTPUT, report_path: Path = DEFAULT_REPORT) -> dict[str, object]:
    frame, report = load_firms(firms_path)
    add_temporal_features(frame)
    add_radiometric_features(frame)
    report["worldcover"] = sample_worldcover(frame, raster_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(output_path, index=False)
    forbidden = {"primary_class", "sub_class", "confidence_score", "facility_id", "distance_to_facility_m", "is_anomalous", "z_score_frp"}
    report.update({
        "phase": "A1_land_cover_feature_engineering",
        "output_rows": len(frame),
        "all_input_rows_preserved": len(frame) == report["input_rows"],
        "land_cover_counts": dict(sorted(Counter(frame["a1_land_cover_type"]).items())),
        "worldcover_status_counts": dict(sorted(Counter(frame["a1_worldcover_status"]).items())),
        "worldcover_code_counts": {str(key): int(value) for key, value in sorted(frame["a1_worldcover_code"].value_counts(dropna=True).items())},
        "brightness_valid": int(frame["a1_brightness_value"].notna().sum()),
        "frp_valid": int(frame["a1_frp_value"].notna().sum()),
        "brightness_normalized_valid": int(frame["a1_brightness_normalized"].notna().sum()),
        "frp_normalized_valid": int(frame["a1_frp_normalized"].notna().sum()),
        "instrument_counts": dict(sorted(Counter(frame["a1_instrument_group"]).items())),
        "daynight_counts": dict(sorted(Counter(frame["a1_daynight"]).items())),
        "season_counts": dict(sorted(Counter(frame["a1_season"]).items())),
        "forbidden_classifier_or_track_b_columns_present": sorted(forbidden & set(frame.columns)),
    })
    if not set(frame["a1_land_cover_type"]).issubset(VALID_LAND_COVER):
        raise AssertionError("A1 generated a land-cover category outside the Track A contract.")
    report_path.write_text(json.dumps(report, indent=2, default=str) + "\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    print(json.dumps(build_a1_features(), indent=2, default=str))
