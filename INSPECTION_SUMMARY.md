# Development Track Inspection Summary

**Date:** 2026-08-30  
**Inspector:** Claude (Kiro)  
**Purpose:** Pre-implementation audit of Development folder (D0-D8) before integration

---

## Executive Summary

### Key Findings

1. **Development Folder Status:** EXISTS at `Development/` with substantial implementation
2. **Implementation Progress:** D0-D6 are SUBSTANTIALLY COMPLETE (per memory.md)
3. **D7 Status:** NOT STARTED — placeholder only in `apps/classifier/README.md`
4. **D8 Status:** NOT STARTED
5. **Project Naming:** Uses stale "AagNazar" throughout — needs renaming to "AgniDrishti"
6. **Track A Integration:** Ready via `track_a/a4/handoff.py` - `classify_track_a()` function
7. **Track B Integration:** Ready via `data/sample/processed/track_b_b4_contract_ready.jsonl` (1,046 records)
8. **Database:** PostgreSQL + PostGIS schema fully implemented (001_initial_schema.sql)

---

## Development Folder Structure

```
Development/
├── .env.example          # Uses "aagnazar" naming
├── .gitignore
├── docker-compose.yml    # Uses "aagnazar-postgres", "aagnazar-redis" containers
├── memory.md            # Dev track progress tracker (shows D0-D6 complete)
├── package.json         # Root workspace, name: "aagnazar"
├── README.md
├── tsconfig.base.json
├── apps/
│   ├── api/             # Express.js backend (61 TypeScript files)
│   │   ├── package.json  # name: "@aagnazar/api"
│   │   └── src/
│   │       ├── config/
│   │       ├── controllers/
│   │       ├── db/
│   │       │   └── migrations/
│   │       │       └── 001_initial_schema.sql
│   │       ├── ingestion/
│   │       ├── routes/
│   │       ├── services/
│   │       └── workers/
│   ├── classifier/      # PLACEHOLDER ONLY (D7 not started)
│   │   └── README.md    # States "not implemented yet"
│   └── web/             # React + Vite frontend (149 TypeScript files)
│       ├── package.json  # name: "@aagnazar/web"
│       └── src/
│           ├── api/
│           ├── components/
│           ├── context/
│           ├── design-system/
│           ├── hooks/
│           ├── pages/
│           ├── query/
│           └── realtime/
└── packages/
    └── shared-types/    # Shared TypeScript definitions
        └── package.json  # name: "@aagnazar/shared-types"
```

---

## Phase Status (Per Development/memory.md)

### ✅ D0 — Project Setup & Scaffolding (COMPLETE)
- Monorepo structure created
- Express.js backend + health-check route
- React + Vite + Tailwind frontend
- docker-compose.yml with PostgreSQL+PostGIS and Redis
- Git repo, .env.example, README
- Basic CI (.github/workflows/ci.yml)

### ✅ D1 — Database & Schema (COMPLETE)
- PostGIS enabled
- All tables migrated: users, facilities, hotspots, classified_events, facility_baselines, alerts, feedback
- Spatial indexes (GiST on facilities.geometry and hotspots.geometry)
- Seed script with demo data (verified on live DB)

### ✅ D2 — Backend Core: Auth & CRUD APIs (COMPLETE)
- JWT auth (register/login/me/logout) + RBAC (admin/analyst/viewer)
- CRUD endpoints: /facilities, /hotspots, /events, /alerts, /feedback
- Request validation (Zod)
- Swagger/OpenAPI docs at /api/v1/docs

### ✅ D3 — Ingestion Pipeline (COMPLETE)
- FIRMS polling cron job (dedup + insert)
- OSM Overpass sync job
- BullMQ + Redis queue wiring
- Ingestion logging + /api/v1/ingestion/status endpoint

### ✅ D4 — Frontend Foundation (COMPLETE)
- D4.1: Design system & UI component library
- D4.2: Application shell & layout
- D4.3: Auth screens & session context
- D4.4: API client & TanStack Query
- D4.5A: Facility Intelligence Registry
- D4.5B: Thermal Event Intelligence / Anomaly Explorer
- D4.5C: Alert Triage Board
- D4.5D: Command Center Dashboard

### ✅ D5 — Map Dashboard (COMPLETE)
- D5.1: GIS Intelligence Foundation (React-Leaflet)
- D5.2: Facilities & Classified Events GIS Overlay
- D5.3: GIS Temporal & Multi-Criteria Filters
- D5.4: Facility Timeseries GIS Integration

### ✅ D6 — Real-Time Alerts (MOSTLY COMPLETE)
- D6.1: Global UI/UX Refinement ✅
- D6.2: Command Center + GIS Interaction Polish ✅
- D6.3: Socket.io server ✅
- D6.4: Socket.io client + toast/live updates ✅
- D6.5: Email/webhook dispatch ⏸️ (optional, not started)

### ❌ D7 — AI/ML Integration (NOT STARTED)
- FastAPI classifier service — NOT IMPLEMENTED
- Track A module integration — NOT DONE
- Track B module integration — NOT DONE
- Merge logic (Track A + Track B → classified_events) — NOT DONE
- Analyst feedback wiring — NOT DONE

### ❌ D8 — Polish, Testing & Deployment (NOT STARTED)
- Responsive/error/loading states check
- Basic automated tests
- Deployment
- Production DB seeding
- Demo script + fallback

---

## Track A Integration Interface

**Status:** ✅ READY FOR INTEGRATION

**Module:** `track_a/a4/handoff.py`

**Function:** `classify_track_a(hotspot_features: Mapping[str, object]) -> dict`

**Required Input Fields:**
- `hotspot_id` (string, non-empty)
- `latitude` (float)
- `longitude` (float)
- `a1_brightness_normalized` (float)
- `a1_frp_normalized` (float)
- `a2_neighborhood_detection_count` (int)
- `a1_month` (int)
- `a1_land_cover_type` or `land_cover_type` (string: forest/cropland/built_up/bare/grassland)
- `a1_daynight` (string: D/N)
- `a1_season` (string)
- `a1_instrument_group` (string)

**Output Fields (Track A Owned):**
- `hotspot_id`, `latitude`, `longitude`
- `primary_class` (industrial/natural)
- `sub_class` (forest_fire/agricultural_burning/other_natural/null)
- `land_cover_type`
- `confidence_score`
- `model_version` ("track_a_ml_v1.0")

**Output Fields (Track A Nulls - Track B Owned):**
- `facility_id`: null
- `distance_to_facility_m`: null
- `recurrence_count_90d`: null
- `z_score_frp`: null
- `is_anomalous`: null

**Model Location:** `data/sample/models/track_a_ml_v1_0.joblib` (1.7 MB)

**Dependencies:** 
- scikit-learn
- joblib
- Python 3.10+

---

## Track B Integration Interface

**Status:** ✅ READY FOR INTEGRATION

**Output File:** `data/sample/processed/track_b_b4_contract_ready.jsonl`

**Format:** JSONL (one JSON object per line)

**Record Count:** 1,046 records

**Sample Record:**
```json
{
  "hotspot_id": "firms_00563644a150ae38",
  "latitude": 8.86576,
  "longitude": 78.15621,
  "primary_class": null,
  "sub_class": "gas_flare",
  "land_cover_type": null,
  "facility_id": "osm_way_906827217",
  "distance_to_facility_m": 2213.943,
  "recurrence_count_90d": 20,
  "z_score_frp": -0.1442634783470137,
  "is_anomalous": false,
  "confidence_score": 0.912,
  "model_version": "track_b_b3_rules_v1_rule_based"
}
```

**Output Fields (Track B Owned):**
- `facility_id` (string or null)
- `distance_to_facility_m` (float or null)
- `recurrence_count_90d` (int or null)
- `z_score_frp` (float or null)
- `is_anomalous` (boolean)
- `sub_class` (gas_flare/industrial_fire/mining_activity or null)
- `confidence_score` (float or null)
- `model_version` ("track_b_b3_rules_v1_rule_based")

**Output Fields (Track B Nulls - Track A Owned):**
- `primary_class`: null
- `land_cover_type`: null

**Note:** Track B is pre-computed batch output; no real-time inference function available

---

## Shared Output Contract

**Schema:** `shared/shared_output_contract.schema.json`

**Required Fields (13 total):**
1. `hotspot_id` (string)
2. `latitude` (number)
3. `longitude` (number)
4. `primary_class` (string: "industrial"/"natural" or null)
5. `sub_class` (string: enum or null)
6. `land_cover_type` (string: enum or null)
7. `facility_id` (string or null)
8. `distance_to_facility_m` (number ≥ 0 or null)
9. `recurrence_count_90d` (integer ≥ 0 or null)
10. `z_score_frp` (number or null)
11. `is_anomalous` (boolean or null)
12. `confidence_score` (number 0-1 or null)
13. `model_version` (string)

**Field Ownership:**
- **Track A:** primary_class, natural sub_class, land_cover_type
- **Track B:** facility_id, distance_to_facility_m, industrial sub_class, recurrence_count_90d, z_score_frp, is_anomalous
- **Both:** hotspot_id, latitude, longitude, confidence_score, model_version

---

## Database Schema

**File:** `Development/apps/api/src/db/migrations/001_initial_schema.sql`

**PostgreSQL Extensions:**
- uuid-ossp
- postgis

**Enumerations:**
- user_role: admin, analyst, viewer
- facility_type: refinery, petrochemical, power_plant, steel, mining, lng_terminal, other_industrial
- instrument_type: MODIS, VIIRS
- day_night: D, N
- primary_class: industrial, natural
- sub_class: industrial_fire, gas_flare, agricultural_burning, mining_activity, forest_fire, other_natural, unclassified
- land_cover_type: forest, cropland, built_up, bare, grassland
- alert_severity: high, medium, low
- alert_status: new, acknowledged, resolved, false_positive

**Tables:**
1. **users** — Authentication and RBAC
2. **facilities** — Industrial facilities from OSM (with PostGIS geometry)
3. **hotspots** — Raw FIRMS thermal detections (with PostGIS geometry)
4. **classified_events** — ML-classified thermal events (combines Track A + Track B)
5. **facility_baselines** — Per-facility thermal baselines
6. **alerts** — High-severity event alerts
7. **feedback** — Analyst ground-truth feedback

**Key Table: classified_events**
```sql
CREATE TABLE classified_events (
  id UUID PRIMARY KEY,
  hotspot_id TEXT UNIQUE NOT NULL,
  hotspot_link UUID REFERENCES hotspots(id),
  facility_link UUID REFERENCES facilities(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  detected_at TIMESTAMP NOT NULL,
  primary_class primary_class,
  sub_class sub_class,
  land_cover_type land_cover_type,
  facility_id TEXT,
  distance_to_facility_m DOUBLE PRECISION,
  recurrence_count_90d INTEGER,
  z_score_frp DOUBLE PRECISION,
  is_anomalous BOOLEAN,
  confidence_score DOUBLE PRECISION,
  model_version TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Stale Naming Issues

**Current Name:** "AagNazar" (old project name)  
**Target Name:** "AgniDrishti"  
**Status:** ⚠️ REQUIRES CLEANUP

**Files Requiring Rename:**

1. **Development/.env.example**
   - Header comment: "AagNazar — Environment Configuration"
   - POSTGRES_DB=aagnazar
   - POSTGRES_USER=aagnazar
   - DATABASE_URL contains "aagnazar"

2. **Development/docker-compose.yml**
   - container_name: aagnazar-postgres
   - container_name: aagnazar-redis
   - Default values: aagnazar

3. **Development/package.json**
   - name: "aagnazar"

4. **Development/apps/api/package.json**
   - name: "@aagnazar/api"
   - dependencies: "@aagnazar/shared-types"

5. **Development/apps/web/package.json**
   - name: "@aagnazar/web"
   - dependencies: "@aagnazar/shared-types"

6. **Development/packages/shared-types/package.json**
   - name: "@aagnazar/shared-types"

7. **Development/apps/api/src/db/migrations/001_initial_schema.sql**
   - Header comment: "AagNazar (SIH26162)"

8. **Development/docs/Realtime_Alerts_SIH26162_AagNazar.md**
   - Filename and content

**Strategy:**
- Replace "aagnazar" → "agnidrishti" (lowercase for technical identifiers)
- Replace "AagNazar" → "AgniDrishti" (title case for documentation)
- Update imports after package name changes
- Verify docker-compose and database connections still work

---

## PostgreSQL/PostGIS Requirements

**Required:** YES — for D7 integration

**Why Required:**
1. Spatial queries (facility proximity, geospatial joins)
2. Store classified_events with geospatial indexing
3. Historical event storage for recurrence analysis
4. GIS-based visualization queries
5. Spatial relationship calculations

**Installation Status:** User must provide/configure

**Docker Setup:** Already defined in docker-compose.yml

**User Actions Required:**
1. Install Docker Desktop (if not already installed)
2. Run `docker compose up -d` to start PostgreSQL+PostGIS and Redis
3. Run `npm run db:migrate` to create schema
4. Run `npm run db:seed` to populate demo data

**Connection Details:**
- Host: localhost
- Port: 5432
- Database: agnidrishti (after rename)
- User: agnidrishti (after rename)
- Password: [from .env]

---

## External API Requirements

**NASA FIRMS:**
- Purpose: Thermal hotspot data ingestion
- Required: YES (for live ingestion)
- Credential: MAP_KEY
- Status: Already configured in root .env (merged Track A/B)
- Action: Copy from root .env to Development/.env

**Sentinel Hub:**
- Purpose: Optional satellite imagery (Track B)
- Required: NO (Track B imagery already fetched)
- Credential: CLIENT_ID, CLIENT_SECRET
- Status: Already configured in root .env
- Action: Copy from root .env to Development/.env if imagery needed

**OpenStreetMap Overpass API:**
- Purpose: Industrial facility data
- Required: YES (for facility sync)
- Credential: None (public API)
- Status: Already implemented in D3

---

## Implementation Dependencies

**D7 Requires:**
1. ✅ Track A module (AVAILABLE: track_a/a4/handoff.py)
2. ✅ Track B data (AVAILABLE: track_b_b4_contract_ready.jsonl)
3. ✅ Shared schema (AVAILABLE: shared/shared_output_contract.schema.json)
4. ❌ FastAPI service skeleton (NOT CREATED)
5. ❌ Python environment setup (NOT VERIFIED)
6. ❌ Track A model loading code (NOT INTEGRATED)
7. ❌ Track B data loading code (NOT INTEGRATED)
8. ❌ Merge logic (NOT IMPLEMENTED)
9. ❌ Backend → classifier API integration (NOT IMPLEMENTED)

**D8 Requires:**
1. ✅ D7 complete
2. ❌ E2E tests (NOT WRITTEN)
3. ❌ Deployment configuration (NOT DEFINED)
4. ❌ Production seed data (NOT PREPARED)
5. ❌ Demo script (NOT WRITTEN)

---

## Testing Status

**Per Development/memory.md:**
- API tests: 51 passing
- Web tests: 165 passing
- Total: 216 tests passing

**Not Yet Tested:**
- D7 integration (not implemented)
- Track A → D7 data flow
- Track B → D7 data flow
- End-to-end ML classification pipeline
- Database spatial queries with real ML output

---

## Critical Blockers

**Before D7 Can Start:**
1. ✅ Read PRD/Architecture (DONE)
2. ✅ Understand Track A interface (DONE)
3. ✅ Understand Track B interface (DONE)
4. ❌ Rename AagNazar → AgniDrishti (PENDING)
5. ❌ Create FastAPI service structure (PENDING)
6. ❌ Set up Python environment for FastAPI (PENDING)
7. ❌ Test Track A handoff.py can be imported (PENDING)
8. ❌ Test Track B JSONL can be read (PENDING)

---

## Recommended Implementation Order

1. **Clean Project Naming** (Task #20)
   - Rename all "AagNazar" → "AgniDrishti"
   - Update package names, imports, docker containers
   - Verify build still works

2. **Implement D7 — FastAPI Classifier Service** (Task #21)
   - D7.1: Create FastAPI skeleton in apps/classifier/
   - D7.2: Set up Python environment (requirements.txt)
   - D7.3: Integrate Track A module (copy/import handoff.py)
   - D7.4: Integrate Track B data loading
   - D7.5: Implement merge logic (Track A + Track B → final output)
   - D7.6: Create /internal/classify endpoint
   - D7.7: Wire Express backend to classifier service
   - D7.8: Update classified_events insertion logic
   - D7.9: Test end-to-end classification flow

3. **Implement D8 — Polish & Deployment** (Task #22)
   - D8.1: Add E2E tests
   - D8.2: Verify responsive/error states
   - D8.3: Prepare deployment configuration
   - D8.4: Seed production data
   - D8.5: Create demo script

4. **Comprehensive Testing** (Task #23)
   - Static checks
   - Track A/B regression tests
   - Contract tests
   - Database tests
   - API tests
   - End-to-end tests

5. **Documentation** (Task #24)
   - Create DEVELOPMENT.md
   - Create root info.md
   - Document user actions required
   - Document testing results

---

## Next Steps

**Immediate Actions:**
1. Complete naming cleanup (AagNazar → AgniDrishti)
2. Verify Development stack builds and runs after rename
3. Copy credentials from root .env to Development/.env
4. Test database connectivity
5. Begin D7 implementation

**User Actions Required Before D7:**
1. Confirm Docker Desktop is installed
2. Confirm Python 3.10+ is available
3. Provide any missing credentials (FIRMS_MAP_KEY if not in root .env)

---

**Inspection Complete: 2026-08-30**  
**Ready for Implementation: YES (after naming cleanup)**
