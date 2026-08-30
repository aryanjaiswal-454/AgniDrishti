"""Phase A0 — Track A environment & data verification (plumbing check only).

Run this script to confirm the Track A Python environment is ready.
It does NOT perform any feature engineering, classification, or model training.

Expected output on success:
    [OK] geopandas <version>
    [OK] rasterio <version>
    [OK] scikit-learn <version>
    [OK] pandas <version>
    [OK] firms_sample.csv loaded: 1020 records, 18 columns
    [OK] worldcover_thoothukudi_2025q4.tif opened: CRS=EPSG:4326, bands=1
    ENVIRONMENT READY — proceed to Phase A1.
"""

from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parents[1]
FIRMS = ROOT / "data/sample/input/firms_sample.csv"
RASTER = ROOT / "data/sample/input/worldcover_thoothukudi_2025q4.tif"


def check_import(package: str, import_name: str | None = None) -> str:
    """Import a package and return its version string."""
    import importlib

    mod = importlib.import_module(import_name or package)
    version = getattr(mod, "__version__", "unknown")
    print(f"  [OK] {package} {version}")
    return version


def main() -> None:
    print("=== Phase A0: Track A environment check ===\n")

    # -- 1. Required packages ------------------------------------------------
    print("1. Checking required packages ...")
    try:
        check_import("geopandas")
        check_import("rasterio")
        check_import("scikit-learn", "sklearn")
        check_import("pandas")
    except ImportError as exc:
        print(f"\n  [FAIL] Missing package: {exc}")
        print("\n  Install with:")
        print("    pip install geopandas rasterio scikit-learn pandas")
        sys.exit(1)

    # -- 2. firms_sample.csv — read and basic sanity -------------------------
    print("\n2. Loading firms_sample.csv ...")
    import pandas as pd

    assert FIRMS.exists(), f"Not found: {FIRMS}"
    df = pd.read_csv(FIRMS, dtype=str)
    n_rows, n_cols = df.shape
    print(f"  [OK] firms_sample.csv loaded: {n_rows} records, {n_cols} columns")

    required_fields = {
        "latitude", "longitude", "acq_date", "acq_time",
        "satellite", "instrument", "confidence", "frp", "daynight",
    }
    missing = required_fields - set(df.columns)
    assert not missing, f"Missing required fields: {missing}"
    print("  [OK] All required DataSpec §2.1 fields present")

    instruments = df["instrument"].value_counts().to_dict()
    print(f"  [OK] Instrument counts: {instruments}")

    year_counts = df["acq_date"].str[:4].value_counts().sort_index().to_dict()
    print(f"  [OK] Records by year: {year_counts}")

    # -- 3. WorldCover raster ------------------------------------------------
    print("\n3. Opening worldcover_thoothukudi_2025q4.tif ...")
    import rasterio

    assert RASTER.exists(), f"Not found: {RASTER}"
    with rasterio.open(RASTER) as src:
        crs = src.crs
        bounds = src.bounds
        n_bands = src.count
        dtype = src.dtypes[0]
    print("  [OK] worldcover_thoothukudi_2025q4.tif opened:")
    print(f"       CRS={crs},  bands={n_bands},  dtype={dtype}")
    print(
        f"       bounds (rounded)=(left={bounds.left:.4f}, bottom={bounds.bottom:.4f}, "
        f"right={bounds.right:.4f}, top={bounds.top:.4f})"
    )
    print(
        f"       bounds (exact)  =(left={bounds.left!r}, bottom={bounds.bottom!r}, "
        f"right={bounds.right!r}, top={bounds.top!r})"
    )

    # Confirm raster covers the pilot bounding box.
    # A small epsilon absorbs float/pixel-edge rounding introduced when the
    # raster was clipped (pixel-size * row/col count rarely lands on the
    # exact target float) without masking a genuine coverage gap.
    WEST, SOUTH, EAST, NORTH = 77.85, 8.35, 78.45, 8.95
    EPS = 1e-4  # ~11m at this latitude — generous for pixel rounding, tight enough to catch real gaps

    west_ok = bounds.left <= WEST + EPS
    south_ok = bounds.bottom <= SOUTH + EPS
    east_ok = bounds.right >= EAST - EPS
    north_ok = bounds.top >= NORTH - EPS

    if not (west_ok and south_ok and east_ok and north_ok):
        print("\n  [FAIL] Raster does not cover the full pilot bounding box:")
        if not west_ok:
            print(f"         left edge {bounds.left!r} > WEST {WEST} + eps")
        if not south_ok:
            print(f"         bottom edge {bounds.bottom!r} > SOUTH {SOUTH} + eps")
        if not east_ok:
            print(f"         right edge {bounds.right!r} < EAST {EAST} - eps")
        if not north_ok:
            print(f"         top edge {bounds.top!r} < NORTH {NORTH} - eps")
        sys.exit(1)

    print(
        f"  [OK] Raster covers pilot bounding box {WEST},{SOUTH} -> {EAST},{NORTH} "
        f"(within {EPS} deg tolerance)"
    )

    # -- 4. GeoPandas smoke-test with firms_sample ---------------------------
    print("\n4. GeoPandas smoke-test (point geometry from firms_sample) ...")
    import geopandas as gpd

    df["latitude"] = df["latitude"].astype(float)
    df["longitude"] = df["longitude"].astype(float)
    gdf = gpd.GeoDataFrame(
        df,
        geometry=gpd.points_from_xy(df["longitude"], df["latitude"]),
        crs="EPSG:4326",
    )
    print(f"  [OK] GeoDataFrame created: {len(gdf)} points, CRS={gdf.crs}")

    # -- 5. scikit-learn smoke-test ------------------------------------------
    print("\n5. scikit-learn smoke-test (RandomForestClassifier import) ...")
    from sklearn.ensemble import RandomForestClassifier

    clf = RandomForestClassifier(n_estimators=1, random_state=42)
    print(f"  [OK] {clf.__class__.__name__} instantiated successfully")

    print("\n" + "=" * 50)
    print("ENVIRONMENT READY — proceed to Phase A1.")
    print("=" * 50)


if __name__ == "__main__":
    main()
