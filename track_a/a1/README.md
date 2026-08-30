# Track A — Phase A1 land-cover feature engineering

Run `python track_a/a1/build_a1_land_cover_features.py`, then `python track_a/a1/validate_a1_land_cover_features.py` from the repository root.

Inputs are `data/sample/input/firms_sample.csv` (the preserved 1,020-row pilot FIRMS source) and `data/sample/input/worldcover_thoothukudi_2025q4.tif` (ESA WorldCover 2021 clip, WGS84/EPSG:4326; code `0` is NoData). Output is `data/sample/processed/firms_sample_a1_enriched.csv`, with an accompanying reproducible summary in `data/sample/validation/firms_sample_a1_validation.json`. Rerunning replaces these two A1-specific generated files only.

The output retains every original FIRMS column and row, then adds `a1_` feature columns. Coordinates are validated before sampling; invalid coordinates, outside-raster locations, NoData, unmapped codes, and a missing raster remain represented with explicit `a1_worldcover_status` values and land cover `unknown`.

WorldCover aggregation: 10 and 95 → `forest`; 20, 30, 90, and 100 → `grassland`; 40 → `cropland`; 50 → `built_up`; 60 → `bare`; 0, water/snow, and unrecognised codes → `unknown`. This is environmental context only, not a fire label.

Sampling lazily reads only addressed pixels via Rasterio. Input coordinates start as WGS84; they are transformed with `pyproj.Transformer(..., always_xy=True)` to the raster CRS before extent checking and sampling, so a future non-WGS84 raster is handled correctly.

`a1_brightness_value` selects a native thermal brightness field: VIIRS prefers `bright_ti4` then falls back to `brightness`; MODIS prefers `brightness` then falls back to `bright_ti4`. Brightness and FRP min–max values are computed separately within each `instrument` group (`MODIS` and `VIIRS`), rather than treating their measurements as one calibrated scale. Missing values stay missing. `a1_daynight` maps FIRMS `D`/`N` to `day`/`night`. Valid dates add year, month, and India meteorological seasons: winter (Jan–Feb), summer (Mar–May), southwest monsoon (Jun–Sep), northeast monsoon (Oct–Dec); invalid/missing dates are `unknown`.

Limitations: a single WorldCover pixel is only local context (and is a 2021 product for 2024–25 detections); the category contract intentionally cannot represent water or snow separately; sensor-specific min–max normalization is dataset-relative and is not a physical cross-sensor calibration. No A2 classification, labels, facility processing, recurrence, or anomaly work is included.
