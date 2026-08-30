# Phase Plan

## AagNazar — SIH26162 (AI-Based Detection and Classification of Industrial Fires and Persistent Thermal Sources)

| | |
|---|---|
| **Team size** | 3 |
| **Role split** | 1× Development (Frontend + Backend + DB) · 2× AI/ML (two independent parallel tracks) |
| **Companion docs** | PRD_SIH26162_AagNazar, Architecture_SIH26162_FireVigil, DataSpecification_SIH26162_AagNazar |
| **Document version** | 1.0 |

---

## How to use this document

- **Part 1** is the Development track — sequential, one phase depends on the previous one, owned by the Dev person end-to-end.
- **Part 2** is the AI/ML track, split into **Track A** and **Track B** — designed so the two AI/ML people can work **fully independently** until the final integration phase. Each track has its own data, its own features, and its own output contract; neither blocks the other.
- Every phase ends with a **fixed output contract** (files/API shape) so downstream phases — including the Dev integration phase — can consume the work without needing to know implementation details.
- Update `memory.md` after completing **every phase** (or any significant task inside a phase) — see the companion `memory.md` file.

---

# PART 1 — Development Track (Frontend + Backend + DB)
### Owner: Person 1 (solo, sequential)

These phases are ordered so each one unblocks the next. Do not skip ahead — later phases assume earlier ones are functional.

## Phase D0 — Project Setup & Scaffolding
**Goal:** A running skeleton, ready for feature work.
- Initialize monorepo structure (`apps/web`, `apps/api`, `apps/classifier` placeholder, `packages/shared-types`).
- Set up Node.js 20 + Express.js project (`apps/api`) with basic health-check route.
- Set up React + Vite project (`apps/web`) with Tailwind CSS.
- Set up `docker-compose.yml` with PostgreSQL(+PostGIS) and Redis containers.
- Set up GitHub repo, branch strategy, `.env.example`, README.
- Set up basic CI (lint + build) via GitHub Actions.
**Output contract:** Both apps run locally (`docker-compose up`), health-check endpoint returns 200, empty React app renders.

## Phase D1 — Database & Schema
**Goal:** Full data model live and migratable.
- Provision PostgreSQL with PostGIS extension enabled.
- Implement all tables from the Data Specification doc: `users`, `facilities`, `hotspots`, `classified_events`, `facility_baselines`, `alerts`, `feedback` (via Prisma/Sequelize migrations).
- Add GiST spatial indexes on `facilities.geometry` and `hotspots.geometry`.
- Seed script with a handful of sample facilities + hotspots for local dev.
**Output contract:** `npm run migrate` builds the full schema from empty DB; seed script populates demo data; schema matches DataSpecification doc exactly (field names/types are the shared contract with AI/ML tracks).

## Phase D2 — Backend Core: Auth & CRUD APIs
**Goal:** Secure, working REST API over the data model (without live ingestion yet).
- JWT auth (register/login), bcrypt password hashing, RBAC middleware (`admin`/`analyst`/`viewer`).
- CRUD/read endpoints: `/facilities`, `/facilities/:id`, `/hotspots`, `/events`, `/events/:id`, `/alerts`.
- Request validation (Zod/Joi) on all routes.
- Swagger/OpenAPI docs auto-generated.
**Output contract:** Fully documented, auth-protected REST API working against seeded data; Postman/Swagger collection shareable with AI/ML team for later reference.

## Phase D3 — Ingestion Pipeline (FIRMS + OSM)
**Goal:** Real external data flowing into the DB.
- `node-cron` job: poll NASA FIRMS Area API on schedule, parse CSV, deduplicate, insert into `hotspots`.
- Overpass API sync job: pull industrial facility tags weekly, upsert into `facilities`.
- BullMQ + Redis queue wiring for retry/backoff resilience on both jobs.
- Logging (Winston/Pino) for every ingestion run (records fetched/inserted/skipped).
**Output contract:** `hotspots` and `facilities` tables populate automatically from live external sources on schedule; ingestion logs are queryable/inspectable.

## Phase D4 — Frontend Foundation
**Goal:** Authenticated shell app, ready for the map.
- Auth screens (login), protected routing, role-aware UI gating.
- App shell/navigation, API client (React Query) wired to Phase D2 endpoints.
- Basic facility list view and event list view (tables, no map yet) to validate data flow end-to-end.
**Output contract:** Analyst can log in and see live facilities/events pulled from the real API in simple list form.

## Phase D5 — Map Dashboard (Official Deliverable #2)
**Goal:** GIS-based visualization — the second official PS deliverable.
- React-Leaflet map with OSM base tiles.
- Render `facilities` and `classified_events` as an overlay on the map, color-coded by `primary_class`/`sub_class`.
- Marker click → side panel with event/facility detail.
- Filters: date range, region (state/district), classification type.
- Facility detail view with historical time-series chart (Recharts) of thermal activity.
**Output contract:** Interactive map overlay fulfilling the PS's explicit "GIS based solution for data storage, visualization of the output as an overlay over maps" requirement — demoable even with placeholder/rule-based classifications from Phase D3 data.

## Phase D6 — Real-Time Alerts
**Goal:** Live push of high-priority events.
- Socket.io server on backend; emits on new high-severity `classified_events`.
- Socket.io client on frontend; toast/notification feed + live map marker updates.
- Alert list view with acknowledge/resolve/false-positive actions (`PATCH /alerts/:id`).
- Optional: email/webhook dispatch for high-severity alerts.
**Output contract:** New qualifying events appear on the dashboard within seconds without a page refresh.

## Phase D7 — AI/ML Integration
**Goal:** Replace placeholder/rule-based classification with real Track A + Track B model output.
- Stand up the Python FastAPI classification microservice (`apps/classifier`) using the finalized code from AI/ML Tracks A & B.
- Wire Node backend → classifier service via internal `/internal/classify` call (batch mode, per ingestion run).
- Persist `primary_class`, `sub_class`, `land_cover_type`, `confidence_score`, `is_anomalous`, `model_version` into `classified_events` per the Data Spec.
- Wire analyst feedback (`/events/:id/feedback`) to a stored table for future retraining.
**Output contract:** End-to-end pipeline: FIRMS/OSM data in → real AI classification → map + alerts reflect actual model output.

## Phase D8 — Polish, Testing & Deployment
**Goal:** Demo-ready, deployed system.
- Cross-browser/responsive check on the dashboard; loading/empty/error states.
- Basic automated tests (API route tests, at least one E2E smoke test).
- Deploy: frontend → Vercel/Netlify, backend + classifier → Render/Railway/AWS, DB → managed Postgres (Supabase/Neon) with PostGIS enabled.
- Seed production DB with a representative demo region/time window.
- Prepare demo script + fallback (recorded video / cached data) in case live APIs are flaky during judging.
**Output contract:** Publicly reachable demo URL, stable enough for live judging.

---

# PART 2 — AI/ML Track (Two Independent Parallel Sub-Tracks)
### Owners: Person 2 (Track A) and Person 3 (Track B)

**Why this split works independently:** Track A works entirely with **FIRMS hotspot data + land-cover rasters** to solve the primary official deliverable — *industrial vs. natural fire segregation*. Track B works entirely with **FIRMS hotspot data + OSM facility data** to solve *industrial sub-classification and persistent-source/anomaly detection*. They touch different auxiliary datasets, build different features, and produce **separate output fields** that only get merged at Dev Phase D7. Until then, each person:
1. Works against a **shared static sample dataset** (a CSV/GeoJSON pull of FIRMS + OSM + land-cover for one pilot region, generated once at kickoff and shared via the repo — not the live backend), so neither waits on Phase D3.
2. Delivers a **standalone Python module/script** with a fixed input → output JSON contract (defined below), so Phase D7 integration is a drop-in.

## Shared Kickoff Step (both tracks, do once together — ~half a day)
- Agree on the pilot demo region (state/district) and time window.
- One-time pull: FIRMS CSV for that region/window, OSM Overpass extract for that region, land-cover raster clipped to that region. Commit to `data/sample/` in the repo.
- Agree on the shared output JSON contract (below) so both tracks' outputs merge cleanly.

**Shared output contract (both tracks emit records in this shape; each track fills in its own fields, `null` for fields outside its scope during standalone development):**
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

---

## Track A — Fire Detection & Natural-vs-Industrial Classification
### Owner: Person 2 | Fulfills the core of official deliverable #1

### Phase A0 — Environment & Data Prep
- Register FIRMS `MAP_KEY`, pull historical + NRT sample data for the pilot region (or use shared kickoff data).
- Download and clip the chosen land-cover raster (ESA WorldCover / Bhuvan LULC) to the pilot region.
- Set up Python env (GeoPandas, Rasterio, scikit-learn, Pandas).
**Output:** Loadable FIRMS DataFrame + land-cover raster ready for point-in-raster lookups.

### Phase A1 — Land-Cover Feature Engineering
- Implement point-in-raster lookup: for each hotspot lat/long, extract `land_cover_type`.
- Engineer supporting features: `bright_ti4`/`frp` normalization, `daynight`, seasonal/date features (helps separate seasonal agricultural burning).
**Output:** DataFrame with `land_cover_type` + engineered features per hotspot.

### Phase A2 — Rule-Based Baseline Classifier (Primary Class)
- Implement the deterministic rule: forest/grassland land cover + far from any known dense-detection cluster → `natural`; built-up/bare + recurring/clustered → `industrial` (lean toward Track B's facility data once merged, but usable standalone via land cover + detection density alone).
- This baseline alone already satisfies a working version of official deliverable #1 and should be treated as the fallback/floor.
**Output:** `primary_class` + `sub_class` (`forest_fire` vs `agricultural_burning` vs `other_natural`) for all natural-side detections, with a rule-based confidence score.

### Phase A3 — ML Model Refinement
- Train a supervised classifier (Random Forest / XGBoost) using the engineered features to improve on the rule-based baseline, using labeled samples (self-labeled from land cover + manual spot-checks, or public wildfire-vs-industrial labeled datasets if available).
- Evaluate: precision/recall per class, confusion matrix, target ≥80% accuracy on held-out sample.
- Package as a serializable model (`joblib`/`pickle`) with a `model_version` tag.
**Output:** Trained model file + evaluation report + inference function `classify_primary(hotspot_features) -> {primary_class, sub_class, confidence_score, model_version}`.

### Phase A4 — Output Contract Finalization & Handoff
- Wrap Phase A3's inference function to emit records matching the shared JSON contract (leave Track B's fields `null`).
- Write a short `README_track_a.md`: how to run, retrain, and swap in the FastAPI service.
- Pair with Dev (Phase D7) to plug the module into `apps/classifier`.
**Output:** Drop-in Python module ready for the classification microservice.

---

## Track B — Facility Matching, Industrial Sub-Classification & Anomaly Detection
### Owner: Person 3 | Fulfills the industrial-side depth + persistent-source distinction explicitly required by the PS

### Phase B0 — Environment & Data Prep
- Pull OSM Overpass extract for the pilot region (or use shared kickoff data), covering all PS-named facility types (refineries, petrochemical, thermal power, steel, mining, LNG).
- Set up Python env (GeoPandas, Shapely, scikit-learn, Pandas).
**Output:** Cleaned `facilities` GeoDataFrame with `facility_type`, geometry, name.

### Phase B1 — Geospatial Facility Matching
- Implement nearest-facility spatial join (`GeoPandas.sjoin_nearest` or PostGIS-equivalent logic) between hotspots and facilities.
- Compute `distance_to_facility_m` and attach `facility_type` when within a configurable threshold radius.
**Output:** DataFrame with `facility_id`, `distance_to_facility_m`, `facility_type` per hotspot.

### Phase B2 — Persistent-Source & Recurrence Modeling
- Compute `recurrence_count_90d`: count of prior detections within ~500m of each point over a trailing window.
- Build `facility_baselines`-style rolling stats (avg FRP, std dev FRP) per facility from historical FIRMS data.
**Output:** Per-facility baseline stats + per-hotspot recurrence count.

### Phase B3 — Industrial Sub-Classification & Anomaly Detection
- Rule + lightweight ML logic:
  - High recurrence + low FRP deviation → `sub_class = gas_flare` (persistent, expected).
  - Low recurrence + high `z_score_frp` (anomalous spike) at/near a facility → `sub_class = industrial_fire`, `is_anomalous = true`.
  - Mining-tagged facility/proximity → `sub_class = mining_activity`.
- Compute `z_score_frp = (frp − avg_frp) / std_dev_frp` per facility baseline.
- Assign `confidence_score` based on match distance + rule strength.
**Output:** `sub_class`, `is_anomalous`, `z_score_frp`, `confidence_score` for all industrial-side detections.

### Phase B4 — Satellite Imagery Stretch & Output Contract Finalization
- (Stretch, time-permitting) Fetch a Sentinel-2 thumbnail at hotspot coordinates/date for visual confirmation, return as an image URL/path field.
- Wrap Phase B3 output to match the shared JSON contract (leave Track A's `land_cover_type`/natural `sub_class` values `null`).
- Write `README_track_b.md`: how to run, retrain, and swap in.
- Pair with Dev (Phase D7) to plug the module into `apps/classifier`.
**Output:** Drop-in Python module ready for the classification microservice.

---

## Integration Point (all three, after D6 + A4 + B4 are done)
- Merge Track A output (`primary_class`, `land_cover_type`, natural `sub_class`) with Track B output (`facility_id`, `distance_to_facility_m`, industrial `sub_class`, `is_anomalous`, `z_score_frp`) into a single record per hotspot — Track B's result wins when `primary_class` is ambiguous and a facility match exists within threshold; otherwise Track A's land-cover-driven call stands.
- Dev (Phase D7) wraps both modules behind one FastAPI service and persists merged output into `classified_events`.
- Run a joint end-to-end smoke test: raw FIRMS record → classified event → visible on map → alert fires if anomalous.

## Suggested Sequencing / Parallelism Summary

| Timeline | Person 1 (Dev) | Person 2 (Track A) | Person 3 (Track B) |
|---|---|---|---|
| Day 0 | Shared kickoff (all three): pilot region + sample data pull | | |
| Day 0–1 | D0 → D1 → D2 | A0 → A1 | B0 → B1 |
| Day 1–2 | D3 → D4 | A2 → A3 | B2 → B3 |
| Day 2–3 | D5 → D6 | A4 (handoff-ready) | B4 (handoff-ready) |
| Day 3+ | **D7 (integration, all three collaborate)** → D8 | support integration | support integration |

No phase in Track A blocks Track B or vice versa until the Integration Point — both can run at full speed in parallel.
