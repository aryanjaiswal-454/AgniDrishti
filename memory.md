# memory.md — Project Status Tracker

## FireVigil — SIH26162 (AI-Based Detection and Classification of Industrial Fires and Persistent Thermal Sources)

> **How to use this file:** Update it after finishing **every phase, sub-task, or feature** — check the box, fill in the date/owner/notes. This is the single source of truth for "what's done" and "what's left" across all three team members. Keep entries short (1 line). Add new rows if a task splits into more than planned; don't delete completed rows — they're the history.

**Last updated:** 2026-08-30
**Updated by:** Merge Agent (Track A + Track B merge complete)


---

## Quick Status Snapshot

| Track | Current phase | % complete (rough) |
|---|---|---|
| Planning / Docs | Complete | 100% |
| Development (Person 1) | Not started | 0% |
| AI/ML Track A (Person 2) | A4 complete — awaiting Dev D7 integration | ~25% |
| AI/ML Track B (Person 3) | B4 complete — awaiting Dev D7 integration | ~50% |
| **MERGE STATUS** | **Track A + Track B merge COMPLETE** | **Integration ready** |

---


## 0. Planning & Documentation

- [x] Problem statement confirmed against official PS text (SIH26162, NTRO, Disaster Management theme) — 2026-08-27
- [x] PRD written (`PRD_SIH26162_FireVigil`) — 2026-08-27
- [x] Architecture document written (`Architecture_SIH26162_FireVigil`) — 2026-08-27
- [x] Data Specification document written (`DataSpecification_SIH26162_FireVigil`) — 2026-08-27
- [x] Phase Plan written (`Phase_Plan_SIH26162_FireVigil`) — 2026-08-27
- [x] Pilot demo region + time window set: Thoothukudi industrial corridor, Tamil Nadu; 2025-10-01 to 2025-12-31 (shared kickoff step) — 2026-08-28
- [x] Shared sample dataset assembled in `data/sample/input/`: FIRMS + OSM + clipped ESA WorldCover for the pilot region — 2026-08-28
- [x] Shared AIML output contract finalized as `shared/shared_output_contract.schema.json` — 2026-08-28

---

## 1. Development Track (Person 1 — Frontend + Backend + DB)

### Phase D0 — Project Setup & Scaffolding
- [ ] Monorepo structure created
- [ ] Express.js backend skeleton + health-check route
- [ ] React + Vite + Tailwind frontend skeleton
- [ ] `docker-compose.yml` (Postgres+PostGIS, Redis)
- [ ] GitHub repo, branching, `.env.example`, README
- [ ] Basic CI (lint + build)

### Phase D1 — Database & Schema
- [ ] PostGIS enabled
- [ ] All tables migrated: `users`, `facilities`, `hotspots`, `classified_events`, `facility_baselines`, `alerts`, `feedback`
- [ ] Spatial indexes added
- [ ] Seed script with demo data

### Phase D2 — Backend Core: Auth & CRUD APIs
- [ ] JWT auth (register/login) + RBAC
- [ ] CRUD/read endpoints (`/facilities`, `/hotspots`, `/events`, `/alerts`)
- [ ] Request validation
- [ ] Swagger/OpenAPI docs

### Phase D3 — Ingestion Pipeline (FIRMS + OSM)
- [ ] FIRMS polling cron job (dedup + insert)
- [ ] OSM Overpass sync job
- [ ] BullMQ + Redis queue wiring
- [ ] Ingestion logging

### Phase D4 — Frontend Foundation
- [ ] Auth screens + protected routing
- [ ] App shell + API client wiring
- [ ] Basic facility/event list views

### Phase D5 — Map Dashboard (Official Deliverable #2)
- [ ] React-Leaflet map with base tiles
- [ ] Facilities + classified events rendered as map overlay, color-coded
- [ ] Marker click → detail panel
- [ ] Filters (date/region/class)
- [ ] Facility time-series chart

### Phase D6 — Real-Time Alerts
- [ ] Socket.io server (emit on high-severity events)
- [ ] Socket.io client + toast/live updates
- [ ] Alert list + acknowledge/resolve/false-positive actions
- [ ] Email/webhook dispatch (optional)

### Phase D7 — AI/ML Integration
- [ ] FastAPI classifier service scaffolded (`apps/classifier`)
- [ ] Track A module integrated
- [ ] Track B module integrated
- [ ] Merge logic (Track A + Track B → final `classified_events` record) implemented
- [ ] Analyst feedback wired to storage

### Phase D8 — Polish, Testing & Deployment
- [ ] Responsive/error/loading states checked
- [ ] Basic automated tests (API + 1 E2E smoke test)
- [ ] Deployed: frontend, backend, classifier, DB
- [ ] Production DB seeded with demo region/window
- [ ] Demo script + fallback prepared

**Blockers / notes (Dev):**
- Track A and Track B are both complete and ready for D7 integration
- Track A inference: `track_a/a4/handoff.py` (`classify_track_a` function)
- Track B inference: Track B outputs are pre-computed in `data/sample/processed/track_b_b4_contract_ready.jsonl`
- Both tracks emit to shared contract schema: `shared/shared_output_contract.schema.json`

---

## 2. AI/ML Track A (Person 2 — Natural vs. Industrial Classification)

### Phase A0 — Environment & Data Prep
- [x] FIRMS `MAP_KEY` registered, sample data pulled — 2026-08-28 (authenticated FIRMS downloader confirmed via download_firms_archives.py + .env)
- [x] Land-cover raster downloaded + clipped to pilot region — 2026-08-28 (worldcover_thoothukudi_2025q4.tif, ESA WorldCover 2021 tiles N06E075+N06E078, 2.23 MB, EPSG:4326 covering 77.85,8.35→78.45,8.95)
- [x] Python env set up (GeoPandas, Rasterio, scikit-learn, Pandas) — 2026-08-28 (`track_a/a0/verify_env.py` smoke-test script)


### Phase A1 — Land-Cover Feature Engineering
- [x] Point-in-raster lookup implemented (`a1_land_cover_type` per hotspot) — 2026-08-28 (`track_a/a1/build_a1_land_cover_features.py`; Rasterio point sampling with WGS84-to-raster CRS transformation)
- [x] Supporting features engineered (brightness/FRP normalization, day/night, date/season) — 2026-08-28 (`data/sample/processed/firms_sample_a1_enriched.csv`; MODIS/VIIRS normalization kept separate)

### Phase A2 — Rule-Based Baseline Classifier
- [x] Rule-based `primary_class` (industrial/natural) implemented — 2026-08-28 (`track_a/a2/build_a2_rule_based_classifier.py`; standalone spatial-density corroboration)
- [x] Natural `sub_class` split (forest_fire / agricultural_burning / other_natural) — 2026-08-28 (`data/sample/processed/firms_sample_a2_rule_based.csv`)
- [x] Baseline confidence scoring — 2026-08-28 (deterministic 0.35–0.86 range; `rule_based_v1.0`)

### Phase A3 — ML Model Refinement
- [x] Labeled training sample prepared — 2026-08-29 (existing A2 rule-based/self-generated labels; no independent ground-truth labels in repository)
- [x] Model trained (RandomForestClassifier) — 2026-08-29 (`track_a/a3/train_a3_model.py`; fixed random state 42)
- [x] Held-out evaluation report (precision/recall/confusion matrix) — 2026-08-29 (`data/sample/evaluation/track_a_ml_v1_0_evaluation.json`; reported only as agreement with A2 labels)
- [x] Model serialized with `model_version` — 2026-08-29 (`data/sample/models/track_a_ml_v1_0.joblib`; `track_a_ml_v1.0`)

### Phase A4 — Output Contract Finalization & Handoff
- [x] A3 inference wrapped to shared JSON contract — 2026-08-29 (`track_a/a4/handoff.py`; `classify_track_a`)
- [x] Track A handoff README written — 2026-08-29 (`track_a/a4/README.md`)
- [ ] Paired with Dev for D7 integration

**Blockers / notes (Track A):**
- **A0–A4 COMPLETE.** Track A uses `firms_sample_track_a.csv` (1,020 records, 2024-01-01 to 2025-12-31)
- Data contract conformant: `instrument` is restricted to VIIRS (959) and MODIS (61); SNPP/NOAA-20 remain satellite identifiers
- Class balance skews ~12%/88% (122 within 1 km of OSM facility / 898 outside)
- A3 evaluation measures agreement with A2 baseline labels, not independent ground truth
- **MERGE: Track A implementation preserved in `track_a/a0` through `track_a/a4`**
- **MERGE: Track A dataset preserved as `data/sample/input/firms_sample_track_a.csv`**

---


## 3. AI/ML Track B (Person 3 — Facility Matching, Industrial Sub-Classification & Anomaly Detection)

### Phase B0 — Environment & Data Prep
- [x] OSM Overpass extract pulled for pilot region (all PS-named facility types) — 2026-08-28 (osm_facilities_thoothukudi_2025q4.json, 942 lines)
- [x] Python env set up (GeoPandas, Shapely, scikit-learn, Pandas) — 2026-08-28 (`track_b/b0/verify_env_track_b.py` smoke-test script)


### Phase B1 — Geospatial Facility Matching
- [x] Nearest-facility spatial join implemented — 2026-08-28
- [x] `distance_to_facility_m` + `facility_type` attached — 2026-08-28

### Phase B2 — Persistent-Source & Recurrence Modeling
- [x] `recurrence_count_90d` computed — 2026-08-29
- [x] Per-facility rolling baseline stats (avg/std FRP) computed — 2026-08-29

### Phase B3 — Industrial Sub-Classification & Anomaly Detection
- [x] Rule logic for `sub_class` (gas_flare / industrial_fire / mining_activity) — 2026-08-29
- [x] `z_score_frp` anomaly computation — 2026-08-29
- [x] `is_anomalous` flag + `confidence_score` — 2026-08-29

### Phase B4 — Satellite Imagery Stretch & Output Contract Finalization
- [x] (Stretch) Sentinel-2 thumbnail fetch per event — 2026-08-29 (pre/post 1.5 km-buffer context acquired for 5 industrial-fire review candidates)
- [x] Output wrapped to shared JSON contract — 2026-08-29 (`data/sample/processed/track_b_b4_contract_ready.jsonl`; 1,046 schema-valid records)
- [x] `README_track_b.md` written — 2026-08-29 (`track_b/b4/README_track_b.md`)
- [ ] Paired with Dev for D7 integration

**Blockers / notes (Track B):**
- **B0–B4 COMPLETE.** Track B uses `firms_sample_track_b.csv` (1,046 records, 2023-10-01 to 2025-12-31, includes 26 Q4-2023 backfill records for better recurrence baselines)
- B3 is deterministic rule-based, not ML-calibrated
- 80-row evaluation queue prepared with AI-assisted "uncertain" dispositions pending human review
- Optional Sentinel-2 imagery retrieved for 5 industrial-fire candidates
- **MERGE: Track B implementation preserved in `track_b/b0` through `track_b/b4`**
- **MERGE: Track B dataset preserved as `data/sample/input/firms_sample_track_b.csv`**

---


## 4. Integration & Final Demo Checklist

- [ ] Track A + Track B outputs merged per the priority rule in the Phase Plan
- [ ] Joint end-to-end smoke test passed (raw FIRMS → classified event → visible on map → alert if anomalous)
- [ ] Both official deliverables demoable:
  - [ ] (1) Industrial vs. forest/natural fire classification & segregation
  - [ ] (2) GIS-based storage + map-overlay visualization
- [ ] Pitch deck / demo script finalized
- [ ] Live demo rehearsed at least once end-to-end

---

## 5. Merge Summary (2026-08-30)

### Merge Completion Status: ✅ COMPLETE

**What was merged:**
- Track A implementation (A0–A4) → `track_a/`
- Track B implementation (B0–B4) → `track_b/`
- Shared documentation → `docs/`
- Shared scripts → `scripts/`
- Shared schema → `shared/`
- Shared data → `data/`
- Configuration files (`.env`, `.gitignore`, `.env.example`)
- Validation infrastructure → `verification/`

**Dataset Resolution:**
- Track A dataset: `data/sample/input/firms_sample_track_a.csv` (1,020 records, 2024-01-01 to 2025-12-31)
- Track B dataset: `data/sample/input/firms_sample_track_b.csv` (1,046 records, 2023-10-01 to 2025-12-31)
- Default symlink `firms_sample.csv` → `firms_sample_track_a.csv` for backward compatibility
- Both datasets are valid and preserved; see `data/sample/input/FIRMS_DATASETS_README.txt`

**Key Merge Decisions:**
1. Preserved both FIRMS datasets (1,020 vs 1,046 records) - both are valid for their respective track requirements
2. Used Track B's `.gitignore` (more complete)
3. Used Track B's `.env` (includes Sentinel Hub credentials)
4. WorldCover tiles (4.6GB) remain in `Track A person/data/raw/worldcover/tiles/` with symlink at `data/raw/worldcover/tiles`
5. All Track A outputs preserved in `data/sample/processed/` and `data/sample/models/`
6. All Track B outputs preserved in `data/sample/processed/`
7. All validation files from both tracks preserved in `data/sample/validation/`

**Path Updates:**
- All Track A and Track B scripts use relative paths (`HERE.parents[1]`) that work correctly in merged structure
- No import path fixes required
- Scripts reference merged data locations correctly

**Final Structure:**
```
AgniDrishti/
├── .env
├── .gitignore
├── .env.example
├── memory.md (this file)
├── data/
│   ├── raw/
│   │   ├── firms/
│   │   └── worldcover/
│   └── sample/
│       ├── input/
│       ├── processed/
│       ├── validation/
│       ├── evaluation/
│       └── models/
├── docs/
├── scripts/
├── shared/
├── track_a/ (a0, a1, a2, a3, a4)
├── track_b/ (b0, b1, b2, b3, b4)
└── verification/
```

**Remaining Work:**
- Development Track (D0–D8) — NOT STARTED, MUST NOT BE TOUCHED
- D7 will integrate both Track A and Track B modules

---

## 6. Change Log
*(one line per update — newest on top)*

- 2026-08-30 — **TRACK A + TRACK B MERGE COMPLETE.** Merged both independent implementations into unified AgniDrishti/ structure. Preserved both FIRMS datasets (Track A: 1,020 records, Track B: 1,046 records with Q4-2023 backfill). All Track A phases (A0–A4) and Track B phases (B0–B4) implementations preserved. Configuration reconciled (used Track B's .gitignore, merged .env credentials). WorldCover tiles symlinked. All validation artifacts preserved. Path references verified. Ready for D7 integration.
- 2026-08-29 — **Track B B4 complete.** Contract handoff + optional Sentinel-2 imagery for 5 industrial-fire candidates.
- 2026-08-29 — **Track A A4 complete.** Shared-contract handoff wrapper with Track B fields as null placeholders.
- 2026-08-29 — **Track A A3 complete.** Random Forest trained, serialized, validated (100% agreement with A2 self-generated labels).
- 2026-08-29 — **Track B B3 complete.** Deterministic industrial sub-classification + anomaly detection rules implemented.
- 2026-08-29 — **Track B B2 complete.** Recurrence + FRP baselines computed per facility/sensor stratum.
- 2026-08-29 — **Track B history backfill.** Added 26 Q4-2023 FIRMS records for better baseline coverage.
- 2026-08-28 — **Track A A2 complete.** Rule-based baseline classifier for primary_class and natural sub_class.
- 2026-08-28 — **Track B B1 complete.** Facility matching with 5km radius, 764/1,020 matched.
- 2026-08-28 — **Track A A1 complete.** Land-cover feature engineering with WorldCover raster sampling.
- 2026-08-28 — **A0/B0 complete.** Both tracks verified environments and data prep.
- 2026-08-28 — Schema-conformance fix: normalized instrument values to VIIRS/MODIS.
- 2026-08-28 — Expanded shared FIRMS sample to 1,020 multi-sensor records.
- 2026-08-28 — Completed AIML shared kickoff: Thoothukudi pilot region + Q4 2025 window.
- 2026-08-27 — Initial creation alongside Phase Plan, PRD, Architecture, and Data Specification docs.
