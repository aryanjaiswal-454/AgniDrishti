# AgniDrishti 

## SIH Problem Statement 26162 — AI-Based Detection and Classification of Industrial Fires and Persistent Thermal Sources

**Organization:** NTRO  
**Theme:** Disaster Management  
**Pilot Region:** Thoothukudi industrial corridor, Tamil Nadu (77.85°E–78.45°E, 8.35°N–8.95°N)  
**Status:** Track A + Track B Complete | Development Track Pending

---

## Project Overview

AgniDrishti is an AI/ML system for detecting, classifying, and monitoring industrial fires and persistent thermal sources using NASA FIRMS thermal hotspot data, ESA WorldCover land-cover data, and OpenStreetMap facility data.

The system provides two official deliverables:
1. **Industrial vs. natural fire classification & segregation** (Track A + Track B)
2. **GIS-based storage + map-overlay visualization** (Development Track - pending)

---

## Architecture

The project is divided into **three independent tracks** executed by a 3-person team:

### Track A (Person 2) — Natural vs. Industrial Fire Classification ✅ COMPLETE
- **Phases:** A0 → A1 → A2 → A3 → A4
- **Responsibility:** Primary classification (industrial/natural) and natural sub-classification (forest fire/agricultural burning/other)
- **Data Sources:** NASA FIRMS + ESA WorldCover land-cover raster
- **Approach:** Land-cover feature engineering → Rule-based baseline → Random Forest ML model
- **Outputs:** 
  - `primary_class` (industrial/natural)
  - `sub_class` (forest_fire, agricultural_burning, other_natural)
  - `land_cover_type` (forest, cropland, built_up, bare, grassland)
  - `confidence_score`
  - `model_version`

### Track B (Person 3) — Industrial Sub-Classification & Anomaly Detection ✅ COMPLETE
- **Phases:** B0 → B1 → B2 → B3 → B4
- **Responsibility:** Industrial sub-classification, facility matching, persistent-source detection, anomaly detection
- **Data Sources:** NASA FIRMS + OpenStreetMap facilities + Sentinel-2 imagery (optional)
- **Approach:** Geospatial facility matching → Recurrence modeling → FRP baseline analysis → Anomaly detection
- **Outputs:**
  - `sub_class` (industrial_fire, gas_flare, mining_activity)
  - `facility_id`, `distance_to_facility_m`
  - `recurrence_count_90d`
  - `z_score_frp`
  - `is_anomalous`
  - `confidence_score`

### Development Track (Person 1) — Full-Stack Integration ⏳ NOT STARTED
- **Phases:** D0 → D1 → D2 → D3 → D4 → D5 → D6 → D7 → D8
- **Responsibility:** Frontend (React), Backend (Node.js/Express), Database (PostgreSQL+PostGIS), Real-time alerts, AI/ML integration (D7)
- **Status:** **NOT IMPLEMENTED YET — DO NOT START D7**
- **Note:** Development folder will be provided separately after Track A + Track B verification

---

## Current Implementation Status

### ✅ Completed (2026-08-30)

**Track A (A0–A4):**
- ✅ Environment setup & data prep
- ✅ Land-cover feature engineering (WorldCover raster sampling)
- ✅ Rule-based baseline classifier
- ✅ Random Forest ML model trained (300 trees, 100% held-out agreement with baseline)
- ✅ Output contract handoff (`track_a/a4/handoff.py`)

**Track B (B0–B4):**
- ✅ Environment setup & OSM facility data extraction
- ✅ Geospatial facility matching (764/1,046 hotspots matched within 5km)
- ✅ 90-day recurrence + FRP baseline calculation
- ✅ Industrial sub-classification rules (gas flare/industrial fire/mining)
- ✅ Anomaly detection (z-score based)
- ✅ Optional Sentinel-2 imagery retrieval (5 industrial-fire candidates)
- ✅ Output contract handoff (`track_b/b4/build_b4_shared_output.py`)

**Shared Infrastructure:**
- ✅ Shared output contract schema (`shared/shared_output_contract.schema.json`)
- ✅ FIRMS download/merge scripts
- ✅ Validation infrastructure
- ✅ Documentation (PRD, Architecture, Phase Plan, Data Specification)

### ⏳ Pending

- ⏳ Development Track (D0–D8) — **Not started, will be provided separately**
- ⏳ D7 AI/ML integration — **Not started** (requires completed Development stack)
- ⏳ End-to-end system testing
- ⏳ Deployment

---

## Project Structure

```
AgniDrishti/
├── .env                    # API credentials (NOT committed)
├── .env.example            # Template for credentials
├── .gitignore              # Git ignore rules
├── memory.md               # Project status tracker
├── README.md               # This file
│
├── data/
│   ├── raw/
│   │   ├── firms/          # Raw FIRMS CSV archives
│   │   └── worldcover/     # ESA WorldCover tiles (4.6GB, Track A only)
│   └── sample/
│       ├── input/
│       │   ├── firms_sample_track_a.csv        # 1,020 records (2024-01-01 to 2025-12-31)
│       │   ├── firms_sample_track_b.csv        # 1,046 records (2023-10-01 to 2025-12-31)
│       │   ├── firms_sample.csv                # Default → track_a dataset
│       │   ├── osm_facilities_thoothukudi_2025q4.json
│       │   └── worldcover_thoothukudi_2025q4.tif
│       ├── processed/
│       │   ├── firms_sample_a1_enriched.csv    # Track A outputs
│       │   ├── firms_sample_a2_rule_based.csv
│       │   ├── track_b_b1_facility_matches.csv # Track B outputs
│       │   ├── track_b_b2_recurrence_baselines.csv
│       │   ├── track_b_b3_classified_anomalies.csv
│       │   ├── track_b_b4_contract_ready.jsonl # Track B final contract output
│       │   └── track_b_b4_imagery/             # Optional Sentinel-2 thumbnails
│       ├── validation/                         # Validation reports (JSON)
│       ├── evaluation/                         # Track A evaluation metrics
│       └── models/
│           ├── track_a_ml_v1_0.joblib         # Track A Random Forest model
│           └── track_a_ml_v1_0_metadata.json
│
├── docs/                   # Project documentation
│   ├── PRD.md
│   ├── SystemArchitecture.md
│   ├── MLAI_design_pipeline.md
│   ├── Phase_Plan_SIH26162_FireVigil.md
│   └── sample_data.md
│
├── scripts/                # Utility scripts
│   ├── download_firms_archives.py
│   └── merge_firms_archives.py
│
├── shared/                 # Shared components
│   ├── shared_output_contract.schema.json
│   └── build_shared_sample.py
│
├── track_a/                # Track A implementation
│   ├── a0/                 # Environment & data prep
│   ├── a1/                 # Land-cover feature engineering
│   ├── a2/                 # Rule-based baseline classifier
│   ├── a3/                 # ML model training & inference
│   └── a4/                 # Output contract handoff
│
├── track_b/                # Track B implementation
│   ├── b0/                 # Environment & OSM data prep
│   ├── b1/                 # Facility matching
│   ├── b2/                 # Recurrence & baseline modeling
│   ├── b3/                 # Industrial sub-classification & anomaly detection
│   └── b4/                 # Output contract & imagery
│
└── verification/           # Shared validation scripts
    └── validate_firms_sample.py
```

---

## Data Sources & Datasets

### FIRMS (Fire Information for Resource Management System)

**Two valid datasets are preserved:**

1. **Track A Dataset:** `firms_sample_track_a.csv`
   - Records: 1,020
   - Date range: 2024-01-01 to 2025-12-31
   - Sensors: 479 VIIRS S-NPP, 480 VIIRS NOAA-20, 61 MODIS
   - Purpose: Track A land-cover classification

2. **Track B Dataset:** `firms_sample_track_b.csv`
   - Records: 1,046 (includes 26 Q4-2023 backfill records)
   - Date range: 2023-10-01 to 2025-12-31
   - Sensors: 491 VIIRS S-NPP, 494 VIIRS NOAA-20, 61 MODIS
   - Purpose: Track B recurrence/baseline calculation (requires historical data)

**Default:** `firms_sample.csv` points to Track A dataset for backward compatibility.

### ESA WorldCover (Track A Only)
- Resolution: 10m
- Year: 2021
- Tiles: 55 tiles covering India (N06E075, N06E078, etc.)
- Size: ~4.6GB
- Location: `data/raw/worldcover/tiles/`
- Clipped pilot region: `data/sample/input/worldcover_thoothukudi_2025q4.tif` (2.23 MB)

### OpenStreetMap Facilities (Track B Only)
- Extracted via Overpass API
- Facility types: power plants, industrial sites, quarries, mining, works
- Pilot region: 72 qualifying facilities
- File: `data/sample/input/osm_facilities_thoothukudi_2025q4.json`

### Sentinel-2 Imagery (Track B Optional)
- 10 RGB thumbnails (pre/post event, 1.5km buffer)
- 5 industrial-fire review candidates
- Location: `data/sample/processed/track_b_b4_imagery/`

---

## Setup & Configuration

### Prerequisites

- Python 3.10+
- GeoPandas, Rasterio, scikit-learn, Pandas (see environment verification scripts)

### Environment Setup

1. **Clone the repository** (or use the current merged directory)

2. **Configure credentials** (copy `.env.example` to `.env` and fill in):
   ```bash
   cp .env.example .env
   ```

   Required credentials:
   - `MAP_KEY`: NASA FIRMS API key (register at https://firms.modaps.eosdis.nasa.gov/api/area/)
   - `SENTINELHUB_CLIENT_ID` (optional, Track B imagery only)
   - `SENTINELHUB_CLIENT_SECRET` (optional, Track B imagery only)

3. **Verify Track A environment:**
   ```bash
   python track_a/a0/verify_env.py
   ```

4. **Verify Track B environment:**
   ```bash
   python track_b/b0/verify_env_track_b.py
   ```

---

## Running the Pipelines

### Track A Pipeline

**A1 — Land-cover feature engineering:**
```bash
python track_a/a1/build_a1_land_cover_features.py
python track_a/a1/validate_a1_land_cover_features.py
```

**A2 — Rule-based baseline classifier:**
```bash
python track_a/a2/build_a2_rule_based_classifier.py
python track_a/a2/validate_a2_rule_based_classifier.py
```

**A3 — ML model training:**
```bash
python track_a/a3/train_a3_model.py
python track_a/a3/validate_a3_model.py
```

**A4 — Inference (single hotspot):**
```python
from track_a.a4.handoff import classify_track_a
# See track_a/a4/README.md for usage
```

### Track B Pipeline

**B1 — Facility matching:**
```bash
python track_b/b1/track_b_b1_facility_matching.py
```

**B2 — Recurrence & baselines:**
```bash
python track_b/b2/build_b2_recurrence_baselines.py
```

**B3 — Industrial sub-classification & anomaly detection:**
```bash
python track_b/b3/build_b3_classified_anomalies.py
```

**B4 — Output contract:**
```bash
python track_b/b4/build_b4_shared_output.py
python track_b/b4/validate_b4_shared_output.py
```

**B4 — Optional Sentinel-2 imagery:**
```bash
python track_b/b4/fetch_b4_sentinel_thumbnail.py
```

---

## Shared Output Contract

Both Track A and Track B emit records conforming to `shared/shared_output_contract.schema.json`:

```json
{
  "hotspot_id": "string",
  "latitude": 0.0,
  "longitude": 0.0,
  "primary_class": "industrial | natural | null",
  "sub_class": "industrial_fire | gas_flare | agricultural_burning | mining_activity | forest_fire | other_natural | null",
  "land_cover_type": "forest | cropland | built_up | bare | grassland | null",
  "facility_id": "string | null",
  "distance_to_facility_m": 0.0,
  "recurrence_count_90d": 0,
  "z_score_frp": 0.0,
  "is_anomalous": false,
  "confidence_score": 0.0,
  "model_version": "string"
}
```

**Field Ownership:**
- Track A provides: `primary_class`, `land_cover_type`, natural `sub_class`, `confidence_score`, `model_version`
- Track B provides: `facility_id`, `distance_to_facility_m`, industrial `sub_class`, `recurrence_count_90d`, `z_score_frp`, `is_anomalous`, `confidence_score`
- Both tracks: `hotspot_id`, `latitude`, `longitude`
- D7 will merge outputs per priority rules (Track B facility match wins for ambiguous cases)

---

## Validation & Testing

**Validation reports** are located in `data/sample/validation/`:
- Track A: `firms_sample_a1_validation.json`, `firms_sample_a2_validation.json`
- Track B: `track_b_b1_validation.json`, `track_b_b2_validation.json`, `track_b_b3_validation.json`, `track_b_b4_validation.json`
- Shared: `firms_sample_validation.json`

**Verification script:**
```bash
python verification/validate_firms_sample.py
```

**Track A evaluation:**
- Held-out test set: 255 records (5 industrial, 250 natural)
- Accuracy: 100% agreement with A2 baseline labels
- **Note:** Evaluation uses self-generated A2 labels, not independent ground truth

**Track B evaluation:**
- 80-row review queue prepared
- AI-assisted "uncertain" dispositions pending human review
- No confirmed industrial-fire events yet (external review pending)

---

## Known Limitations

1. **Track A:**
   - WorldCover data is from 2021; land cover may have changed by 2024-2025
   - ML model trained on self-generated A2 labels (no independent ground truth)
   - Class imbalance: ~12% industrial, ~88% natural in pilot dataset

2. **Track B:**
   - B3 industrial sub-classification is rule-based, not ML-calibrated
   - 448/1,046 records have insufficient historical data for full recurrence analysis
   - Evaluation labels are AI-assisted "uncertain" pending human confirmation
   - OSM facility data may be incomplete for some facility types

3. **Integration:**
   - D7 integration layer NOT implemented yet
   - No end-to-end system testing performed
   - Development track (frontend/backend/database) pending

4. **Data:**
   - Pilot region limited to Thoothukudi, Tamil Nadu
   - Time window covers 2023-10-01 to 2025-12-31 only
   - Sentinel-2 imagery available for only 5 industrial-fire candidates

---

## Next Steps

1. ✅ **Track A + Track B merge** — COMPLETE (2026-08-30)
2. ⏳ **Development Track implementation** (D0–D6) — Pending separate delivery
3. ⏳ **D7 AI/ML Integration** — Integrate Track A + Track B modules into FastAPI classifier service
4. ⏳ **D8 Deployment** — Deploy full system and prepare demo
5. ⏳ **Human review** — Complete external review of Track B evaluation queue
6. ⏳ **Ground truth collection** — Collect independent labels for Track A model validation

---

## Team & Ownership

- **Person 1:** Development Track (D0–D8) — Pending
- **Person 2:** Track A (A0–A4) — Complete
- **Person 3:** Track B (B0–B4) — Complete

---

## Documentation

- **PRD:** `docs/PRD.md`
- **System Architecture:** `docs/SystemArchitecture.md`
- **ML/AI Design Pipeline:** `docs/MLAI_design_pipeline.md`
- **Phase Plan:** `docs/Phase_Plan_SIH26162_FireVigil.md`
- **Data Specification:** `docs/sample_data.md`
- **Memory/Status Tracker:** `memory.md`

---

## License

SIH 2026 Project — NTRO

---

## Contact

For questions about Track A, Track B, or the merge, refer to the project `memory.md` and phase-specific README files in `track_a/` and `track_b/` directories.

**Important:** D7/Development integration has NOT been started. The Development folder will be provided separately.
