# FIRMS Dataset Information

This directory contains TWO valid FIRMS datasets from the independent Track A and Track B implementations:

## Track A Dataset: firms_sample_track_a.csv
- Records: 1,020 (plus 1 header row = 1,021 lines)
- Date range: 2024-01-01 to 2025-12-31
- Sensors: 479 VIIRS S-NPP, 480 VIIRS NOAA-20, 61 MODIS
- Purpose: Used by Track A for land-cover feature engineering and natural vs. industrial classification
- Source: Track A person/data/sample/input/firms_sample.csv

## Track B Dataset: firms_sample_track_b.csv
- Records: 1,046 (plus 1 header row = 1,047 lines)
- Date range: 2023-10-01 to 2025-12-31 (includes 26 Q4-2023 backfill records)
- Sensors: 491 VIIRS S-NPP, 494 VIIRS NOAA-20, 61 MODIS
- Purpose: Used by Track B for facility matching, recurrence modeling, and anomaly detection
- Reason for backfill: Better 90-day historical baseline calculation for early 2024 events
- Source: Track B person/My friend/data/sample/input/firms_sample.csv

## Default Symlink: firms_sample.csv
Currently points to: firms_sample_track_a.csv
This maintains backward compatibility with existing Track A scripts.

## Important Notes:
- BOTH datasets are valid and necessary for their respective tracks
- Track A scripts should use firms_sample_track_a.csv (or the default firms_sample.csv symlink)
- Track B scripts should use firms_sample_track_b.csv
- The 26-record difference is documented in memory.md as intentional
- Both datasets cover the same pilot region: Thoothukudi (77.85,8.35,78.45,8.95)
