# AIML shared kickoff sample

- **Pilot region:** Thoothukudi industrial corridor, Tamil Nadu, India (WGS84 bounding box `77.85,8.35,78.45,8.95`).
- **Time window:** 2024-01-01 through 2025-12-31 (the trailing two complete calendar years at kickoff).
- **FIRMS input:** `data/sample/input/firms_sample.csv`, a deduplicated 1,020-record multi-sensor sample: 479 S-NPP baseline records, 480 NOAA-20 SP records, and 61 MODIS SP records. The original 17-record Q4 2025 subset remains preserved as `data/sample/input/firms_thoothukudi_2025q4.csv`; the original 479-record baseline is preserved as `data/sample/input/firms_sample_snpp_baseline.csv`.
- **FIRMS source availability:** `data/sample/input/firms_source_coverage.json` records which requested standard-processing sources are included or unavailable. It must be updated if an authenticated FIRMS archive export is added.
- **FIRMS credentials:** `scripts/download_firms_archives.py` reads `MAP_KEY` from the project-root `.env` file. Do not commit or share that file.
- **OSM input:** `data/sample/input/osm_facilities_thoothukudi_2025q4.json`, one-time Overpass export using industrial, works, power, industrial land-use, and petroleum-well tags within the pilot bounding box. It is shared pilot context and the future Track B input, not a Track A output.
- **Land cover:** `data/sample/input/worldcover_thoothukudi_2025q4.tif`, an EPSG:4326 clip from ESA WorldCover 2021 tiles N06E075 and N06E078; `0` is NoData.
- **Shared output:** `shared/shared_output_contract.schema.json`. Both tracks emit every field; fields outside a standalone track's scope are `null`.

`shared/build_shared_sample.py` reproduces the FIRMS filter and land-cover clip from the repository's raw data. `scripts/merge_firms_archives.py` merges authenticated MODIS/NOAA-20 sources while retaining the S-NPP baseline and preserving source-specific thermal fields. `verification/validate_firms_sample.py` verifies the time/bounding-box/required-field/contract-key constraints and writes the instrument, yearly, source, and OSM-facility-proximity summary to `data/sample/validation/firms_sample_validation.json`.

**Track A A1:** `track_a/a1/build_a1_land_cover_features.py` produces the A1-only enriched pilot dataset `data/sample/processed/firms_sample_a1_enriched.csv` plus `data/sample/validation/firms_sample_a1_validation.json`; `track_a/a1/validate_a1_land_cover_features.py` validates it. See `track_a/a1/README.md` for the WorldCover aggregation, per-instrument radiometric normalization, CRS/missing-data handling, and how to run it. These scripts do not classify fire types or implement any Track B work.

**Track A A2:** `track_a/a2/build_a2_rule_based_classifier.py` consumes `data/sample/processed/firms_sample_a1_enriched.csv` and writes `data/sample/processed/firms_sample_a2_rule_based.csv` plus `data/sample/validation/firms_sample_a2_validation.json`; `track_a/a2/validate_a2_rule_based_classifier.py` validates the deterministic baseline. See `track_a/a2/README.md` for its configurable spatial-density thresholds and rules. It does not implement Track B facility/recurrence/anomaly work.
