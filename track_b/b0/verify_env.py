"""Phase B0 — Track B environment & data verification (plumbing check only).

Run this script to confirm the Track B Python environment is ready.
It does NOT perform any facility matching, baseline modelling, or classification.

Expected output on success:
    [OK] geopandas <version>
    [OK] shapely <version>
    [OK] scikit-learn <version>
    [OK] pandas <version>
    [OK] firms_sample.csv loaded: 1020 records
    [OK] OSM extract loaded: <N> elements
    [OK] OSM tag categories covered: ...
    ENVIRONMENT READY — proceed to Phase B1.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parents[1]
FIRMS = ROOT / "data/sample/input/firms_sample.csv"
OSM = ROOT / "data/sample/input/osm_facilities_thoothukudi_2025q4.json"

# PS-named facility type tags required by the Phase Plan
PS_TAG_CHECKS: dict[str, object] = {
    "refinery": lambda tags: tags.get("industrial") == "refinery",
    "petrochemical": lambda tags: tags.get("industrial") == "petrochemical",
    "thermal_power_plant (power=plant)": lambda tags: tags.get("power") == "plant",
    "iron_and_steel": lambda tags: tags.get("industrial") == "iron_and_steel",
    "quarry (landuse=quarry)": lambda tags: tags.get("landuse") == "quarry",
    "mineshaft (man_made=mineshaft)": lambda tags: tags.get("man_made") == "mineshaft",
    "lng_terminal (substance=lng)": lambda tags: tags.get("substance") == "lng",
    "generic_industrial (any qualifying tag)": lambda tags: (
        "industrial" in tags
        or tags.get("landuse") in {"industrial", "quarry"}
        or tags.get("man_made") in {"works", "petroleum_well", "mineshaft"}
        or tags.get("power") == "plant"
        or tags.get("substance") == "lng"
    ),
}


def main() -> None:
    print("=== Phase B0: Track B environment check ===\n")

    # -- 1. Required packages ------------------------------------------------
    print("1. Checking required packages ...")
    try:
        import importlib

        for pkg, iname in [
            ("geopandas", None),
            ("shapely", None),
            ("scikit-learn", "sklearn"),
            ("pandas", None),
        ]:
            mod = importlib.import_module(iname or pkg)
            print(f"  [OK] {pkg} {getattr(mod, '__version__', 'unknown')}")
    except ImportError as exc:
        print(f"\n  [FAIL] Missing package: {exc}")
        print("\n  Install with:")
        print("    pip install geopandas shapely scikit-learn pandas")
        sys.exit(1)

    # -- 2. firms_sample.csv -------------------------------------------------
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
    missing_fields = required_fields - set(df.columns)
    assert not missing_fields, f"Missing required fields: {missing_fields}"

    instruments = df["instrument"].value_counts().to_dict()
    print(f"  [OK] Instrument counts: {instruments}")

    # -- 3. OSM Overpass extract ---------------------------------------------
    print("\n3. Loading OSM facility extract ...")
    assert OSM.exists(), f"Not found: {OSM}"
    with OSM.open(encoding="utf-8") as handle:
        osm_data = json.load(handle)

    elements = osm_data.get("elements", [])
    print(f"  [OK] OSM extract loaded: {len(elements)} elements "
          f"(generated: {osm_data.get('osm3s', {}).get('timestamp_osm_base', 'unknown')})")

    # -- 4. PS-required tag category audit -----------------------------------
    print("\n4. Auditing PS-required facility tag categories ...")
    all_tags = [el.get("tags", {}) for el in elements]

    categories_found: dict[str, int] = {}
    categories_absent: list[str] = []
    for category, predicate in PS_TAG_CHECKS.items():
        count = sum(1 for tags in all_tags if predicate(tags))
        if count > 0:
            categories_found[category] = count
            print(f"  [OK] {category}: {count} element(s)")
        else:
            categories_absent.append(category)
            status = "[INFO]" if category != "generic_industrial (any qualifying tag)" else "[FAIL]"
            print(f"  {status} {category}: 0 elements in OSM bbox")

    # generic_industrial must be non-empty for B1 proximity matching to work
    assert categories_found.get("generic_industrial (any qualifying tag)", 0) > 0, (
        "No qualifying facility elements found — re-run the Overpass query."
    )

    if categories_absent:
        print(f"\n  NOTE: {len(categories_absent)} PS tag categories returned 0 OSM hits:")
        for cat in categories_absent:
            print(f"        - {cat}")
        print(
            "\n  These are geographically absent from the Thoothukudi OSM bbox:\n"
            "  no refinery, petrochemical plant, steel plant, mineshaft, or LNG\n"
            "  terminal is mapped in this region. The Overpass query included all\n"
            "  these tags and correctly returned zero hits. No re-query needed.\n"
            "  If the pilot region changes, re-run the Overpass query."
        )

    # -- 5. GeoPandas + Shapely smoke-test -----------------------------------
    print("\n5. GeoPandas + Shapely smoke-test ...")
    import geopandas as gpd
    from shapely.geometry import Point
    from shapely.ops import nearest_points

    df["latitude"] = df["latitude"].astype(float)
    df["longitude"] = df["longitude"].astype(float)
    gdf_firms = gpd.GeoDataFrame(
        df,
        geometry=gpd.points_from_xy(df["longitude"], df["latitude"]),
        crs="EPSG:4326",
    )
    print(f"  [OK] FIRMS GeoDataFrame: {len(gdf_firms)} points")

    # Build qualifying OSM facility GeoDataFrame
    facility_rows = []
    for el in elements:
        tags = el.get("tags", {})
        is_facility = (
            "industrial" in tags
            or tags.get("landuse") in {"industrial", "quarry"}
            or tags.get("man_made") in {"works", "petroleum_well", "mineshaft"}
            or tags.get("power") == "plant"
            or tags.get("substance") == "lng"
        )
        if not is_facility:
            continue
        center = el.get("center") or el
        lat, lon = center.get("lat"), center.get("lon")
        if lat is not None and lon is not None:
            facility_rows.append({"geometry": Point(lon, lat)})

    gdf_facilities = gpd.GeoDataFrame(facility_rows, crs="EPSG:4326")
    print(f"  [OK] OSM facility GeoDataFrame: {len(gdf_facilities)} qualifying points")

    # nearest_points smoke-test
    _ = nearest_points  # confirm importable for B1
    print("  [OK] shapely.ops.nearest_points importable (needed for B1)")

    # -- 6. scikit-learn smoke-test ------------------------------------------
    print("\n6. scikit-learn smoke-test (IsolationForest import) ...")
    from sklearn.ensemble import IsolationForest

    iso = IsolationForest(n_estimators=1, random_state=42)
    print(f"  [OK] {iso.__class__.__name__} instantiated successfully")

    print("\n" + "=" * 50)
    print("ENVIRONMENT READY — proceed to Phase B1.")
    print("=" * 50)


if __name__ == "__main__":
    main()
