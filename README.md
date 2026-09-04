# AgniDrishti

<p align="center">
  <strong>AI-Powered Thermal Intelligence for Industrial and Natural Fire Context</strong><br />
  Satellite observations · Spatial context · Historical analysis · Analyst triage
</p>

<p align="center">
  <a href="#the-problem">Problem</a> ·
  <a href="#solution-overview">Solution</a> ·
  <a href="#technology-stack">Technology</a> ·
  <a href="#deployment">Deployment</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#documentation">Documentation</a>
</p>

[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?logo=react&logoColor=white)](#technology-stack)
[![API](https://img.shields.io/badge/API-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)](#technology-stack)
[![Spatial](https://img.shields.io/badge/Spatial-PostgreSQL%20%2B%20PostGIS-336791?logo=postgresql&logoColor=white)](#technology-stack)
[![Maps](https://img.shields.io/badge/Maps-React%20Leaflet-199900?logo=openstreetmap&logoColor=white)](#operator-dashboard)
[![Runtime](https://img.shields.io/badge/Runtime-Docker%20Compose-2496ED?logo=docker&logoColor=white)](#getting-started)

AgniDrishti is an end-to-end thermal-intelligence and GIS command-center platform built for **SIH Problem Statement 26162 — AI-Based Detection and Classification of Industrial Fires and Persistent Thermal Sources**. It combines NASA FIRMS thermal observations with geographic, environmental, and historical context so that an operator can distinguish routine-looking activity from observations that deserve investigation.

The application converts a raw satellite heat point into a structured operational record: classification, confidence, land-cover context, nearest industrial reference point, FRP baseline, anomaly state, alert status, and investigation workflow.

> **Important:** AgniDrishti supports analyst prioritisation. A satellite detection, a nearby-facility association, or an anomaly score is not independent confirmation of an emergency, legal site containment, or incident cause. Field verification and approved response procedures remain essential.

---

## The problem

Satellite systems can identify thermal anomalies at scale, but they do not explain why heat was observed. A single point may represent:

- agricultural residue burning;
- forest or grassland fire;
- mining-related activity;
- routine gas flaring or industrial process heat;
- an unusual industrial thermal event requiring investigation.

When every detection is treated as an identical red marker, operators face alert fatigue. Routine signals can obscure meaningful changes, while a high-priority observation may receive insufficient attention. The core challenge is therefore not only detecting heat—it is adding enough spatial, environmental, temporal, and operational context for a person to make a better decision.

---

## Solution overview

AgniDrishti provides a complete operational path from external data to an authenticated dashboard:

```text
NASA FIRMS thermal observation
            │
            ▼
Scheduled ingestion, validation, India filter, duplicate protection
            │
            ▼
Land-cover context + facility proximity + 90-day FRP history
            │
            ▼
Contextual classification and anomaly policy
            │
            ▼
PostgreSQL/PostGIS event and alert records
            │
            ▼
REST API + Socket.io notifications
            │
            ▼
React GIS command center for analyst triage
```

### What the platform delivers

| Capability | What it provides |
| --- | --- |
| Thermal ingestion | Scheduled retrieval of configured VIIRS and MODIS FIRMS sources |
| Geographic control | India boundary filtering after the FIRMS rectangular source request |
| Contextual classification | Thermal, temporal, land-cover, location, and nearby-observation signals |
| Industrial proximity | Nearest imported industrial reference point and geodesic distance within 5 km |
| Historical analysis | Nearby 90-day FRP recurrence, baseline, and Z-score context |
| Alert triage | Persistent alerts with acknowledge, resolve, and false-positive actions |
| GIS operations | Live map, layer controls, full-screen mode, filters, event inspection, and facility views |
| Real-time refresh | Socket.io events that refresh relevant event, alert, map, facility, and dashboard data |
| Administration | Configurable anomaly/FRP policy and default map mode with recalculation |

---

## Technology stack

AgniDrishti uses a service-oriented architecture. Each technology has a defined responsibility rather than being included only for demonstration.

| Layer | Technology | Responsibility in AgniDrishti |
| --- | --- | --- |
| Web application | React 18, TypeScript, Vite | Responsive single-page command center, routing, filters, and investigation workflows |
| Styling | Tailwind CSS | Shared visual system, responsive layouts, dark and light presentation modes |
| Client data | TanStack Query | Server-state caching, query invalidation, retries, and refresh after real-time events |
| Mapping | React Leaflet + raster tile providers | Interactive GIS map, CircleMarkers, layer controls, full-screen view, and three basemap modes |
| API | Node.js, Express, TypeScript | Authenticated REST endpoints, validation, dashboard aggregation, exports, and business logic |
| Real-time delivery | Socket.io | Authenticated browser notifications for committed events, alerts, facility syncs, and settings changes |
| Background processing | BullMQ + Redis | Scheduled ingestion, queueing, retry policy, and decoupled work execution |
| Spatial database | PostgreSQL + PostGIS | Durable records, spatial geometry, geodesic distance, nearby-history queries, migrations, and indexes |
| Contextual service | Python, FastAPI, Pydantic, Rasterio | Request validation, local land-cover sampling, classification, facility proximity, and FRP baseline calculation |
| Identity | Firebase Authentication + Firebase Admin | Google/email sign-in, Firebase ID-token verification, and API role enforcement |
| Containers | Docker, Docker Compose | Reproducible local environment for web, API, worker, contextual service, PostGIS, and Redis |
| Managed deployment options | Render, Aiven, Upstash | Web/API/classifier compute, managed PostgreSQL/PostGIS, and managed Redis when configured by the owner |

---

## Architecture

```text
┌──────────────────────────────────────────────────────────────────────┐
│ External sources                                                     │
│ NASA FIRMS · OpenStreetMap/Overpass · ESA WorldCover tiles           │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Dedicated Node.js worker                                             │
│ schedules source jobs · validates records · queues classification     │
└───────────────┬───────────────────────────────┬──────────────────────┘
                │                               │
                ▼                               ▼
┌───────────────────────────┐      ┌───────────────────────────────────┐
│ Redis / BullMQ            │      │ Python contextual-inference API   │
│ queues + cross-process bus│      │ land cover · proximity · baseline │
└───────────────┬───────────┘      └───────────────┬───────────────────┘
                └────────────────┬────────────────┘
                                 ▼
                  ┌────────────────────────────────┐
                  │ PostgreSQL + PostGIS            │
                  │ hotspots · events · facilities  │
                  │ alerts · settings · users       │
                  └───────────────┬────────────────┘
                                  ▼
                  ┌────────────────────────────────┐
                  │ Node.js API + Socket.io         │
                  └───────────────┬────────────────┘
                                  ▼
                  ┌────────────────────────────────┐
                  │ React + React Leaflet dashboard │
                  └────────────────────────────────┘
```

### Service responsibilities

**Web application**

The browser application provides authentication, command-center KPIs, map controls, data tables, alert panels, facility intelligence, settings, and export flows. It never connects directly to PostgreSQL, Redis, NASA FIRMS, or Overpass.

**API service**

The Express API is the secure gateway between the browser and platform data. It verifies Firebase bearer tokens, applies role checks, validates route/query/body inputs, reads and writes PostgreSQL/PostGIS records, and hosts Socket.io.

**Worker service**

The worker runs independently from the API. It schedules FIRMS and OSM jobs, consumes BullMQ work, calls the contextual-inference service, and records failures/retries. It must be deployed as a long-lived process in any live environment. An API service by itself cannot keep the data current.

**Contextual-inference service**

The Python service accepts validated hotspot batches. It samples available local WorldCover data, obtains facility and historical FRP context through PostGIS, and returns a structured response for persistence by the worker.

**Data services**

PostgreSQL/PostGIS is the durable source of truth. Redis is used for BullMQ coordination and the real-time cross-process bus; it is not assumed to be an API-response cache or browser session store.

---

## Data sources and intelligence model

### NASA FIRMS: thermal trigger

FIRMS provides near-real-time thermal anomaly observations. The platform uses fields such as location, acquisition date/time, brightness, FRP, confidence, instrument, satellite, and day/night context.

The standard source list is:

```dotenv
FIRMS_SOURCE=VIIRS_SNPP_NRT,MODIS_NRT
```

Both configured sources are requested independently. A source failure is visible in worker logs and does not automatically prevent a later source from being attempted.

### India geographic filter

The standard FIRMS request value is `68,6,98,38`, using west/south/east/north order. A rectangle of that size can include non-Indian geography, therefore the application applies an India boundary test before storing each observation. This prevents an event from being shown as Indian simply because it is inside the broad FIRMS request box.

### OpenStreetMap: industrial reference locations

The OSM importer requests selected industrial, energy, mining, and related elements for the configured India-wide area. It stores a node coordinate or way/relation centre as a **facility reference point**.

This means the current facility association is intentionally limited:

- the system finds the nearest stored reference point within 5 km;
- it returns a geodesic distance in metres;
- it does **not** prove an event is inside a facility perimeter;
- it does **not** replace a surveyed or legal facility boundary dataset.

Public Overpass instances can rate-limit or fail. Existing imported facilities remain in the database, but an unsuccessful source sync cannot add missing records. A production deployment should monitor sync outcomes and maintain a reviewed facility-data fallback where needed.

### ESA WorldCover: local environmental context

WorldCover tiles provide land-cover information. The Python service finds a locally mounted GeoTIFF tile and samples the pixel at the event coordinate. It maps the result to a coarse context such as forest, cropland, built-up, grassland, bare, or unknown.

The live service currently samples one pixel, not a one-kilometre land-cover percentage. If the required local tile is absent, it returns unknown rather than making an unsupported assertion. Expanding geographical coverage requires the corresponding lawful tile coverage, storage planning, and deployment validation.

### Historical FRP baseline

For an event with nearby facility context, the service queries previous hotspots within 5 km over the preceding 90 days. It calculates:

- recurrence count of eligible observations;
- historical FRP mean;
- population standard deviation when available;
- current FRP Z-score;
- anomaly flag and industrial sub-classification context.

`recurrence_count_90d` is a count of eligible observations, not a count of unique days. Sparse history can use a stored facility baseline fallback. A resulting anomaly is a prioritisation signal, not a confirmed incident.

---

## Operator dashboard

### Command Center

The Command Center gives an at-a-glance operational view:

- total thermal detections;
- industrial-source count;
- anomalous activity;
- active threat alerts;
- recent events and alert cards;
- map layers for thermal events, facilities, and anomalies.

### Live Map

The map uses React Leaflet and renders individual CircleMarkers. Anomalous thermal events are styled in red; non-anomalous thermal events use orange/amber; facility reference points use cyan. Marker clustering is disabled by default so an analyst can inspect the individual records supplied by the current query.

Three basemap modes are available directly in the map toolbar and in Settings:

| Mode | Use case |
| --- | --- |
| Dark Canvas | Low-distraction operational view |
| Satellite Imagery | Terrain and visible infrastructure context |
| OpenStreetMap | Roads, locality labels, and place-name context |

The toolbar also provides layer toggles, optional clustering, selection clearing, reset behaviour, and a full-screen map control.

### Events, facilities, and alerts

The Events workspace supports classification, anomaly, confidence, date, state, district, facility, bounding-box, and pagination filters where available. The Facilities workspace presents imported reference locations and historical context. The Alerts workspace allows authorised analysts to acknowledge, resolve, or mark an alert as false positive while preserving an audit trail.

The command-center map requests up to 100 facilities. The facilities API supports paginated requests up to 200 records. If an inventory contains more records than the active request limit, a map view will show only the current page; this is a loading/pagination behaviour, not a clustering failure.

### Real-time behaviour

The API emits committed events through Socket.io:

- `agni:classified-event:created`
- `agni:alert:created`
- `agni:facilities:synced`
- `agni:system-settings:updated`

The React client invalidates affected TanStack Query entries and refetches API data. Connected users see refreshed dashboard, map, event, facility, alert, and settings state without manual reload. Disconnected users receive current data after a later reconnect or request. The architecture does not promise a fixed end-to-end latency.

---

## API and authentication

All operational routes are available beneath `/api/v1` and use Firebase bearer authentication unless an endpoint is explicitly public.

| Domain | Key endpoints |
| --- | --- |
| Identity | `GET /auth/me`, `POST /auth/logout` |
| Hotspots | `GET /hotspots`, `GET /hotspots/:id` |
| Classified events | `GET /events`, `GET /events/:id`, `POST /events/:id/feedback` |
| Facilities | `GET /facilities`, `GET /facilities/:id`, `GET /facilities/:id/timeseries` |
| Alerts | `GET /alerts`, `PATCH /alerts/:id` |
| Dashboard | `GET /dashboard/summary` |
| Settings | `GET /settings`, `PATCH /settings` |
| Ingestion | `GET /ingestion/status` and authorised manual triggers |
| Export | `GET /export` |

The API documentation is served at `/api/v1/docs` when the service is running.

### Authentication flow

1. A user signs in through Firebase using email/password or Google.
2. The browser obtains a Firebase ID token.
3. The frontend sends `Authorization: Bearer <Firebase-ID-token>` with API requests.
4. Firebase Admin verifies the token in the API.
5. The API finds the corresponding database user and applies the stored role.

Roles are viewer, analyst, and administrator. Viewer access is read-only; analyst access includes implemented event-feedback and alert-triage actions; administrator access also includes settings and manual-ingestion actions.

### Required security action before public deployment

The current initial database migration defaults a newly created user profile to `admin`, while the Firebase middleware can create a profile on first sign-in. This is unsafe for a public sign-in flow. Before public deployment, migrate the default role to the least-privileged value—normally `viewer`—and create a controlled process for assigning elevated roles. Verify with a new test account that administrative endpoints are denied by default.

---

## Getting started

### Prerequisites

- Docker Desktop with Docker Compose v2
- Node.js 20+ and npm 10+ for non-container development
- Python 3.12+ for local contextual-service testing
- NASA FIRMS map key for live satellite ingestion
- Internet connectivity for FIRMS, OSM, and map-tile providers

### Recommended: complete local stack with Docker

The production-oriented Compose file starts six coordinated services: web UI, API, worker, Python contextual service, PostgreSQL/PostGIS, and Redis.

#### 1. Configure local environment values

Create or update `Development/.env`. This file is ignored by Git and must never contain production credentials in source control.

```dotenv
POSTGRES_PASSWORD=replace-with-a-strong-local-password
JWT_SECRET=replace-with-a-long-random-local-value
FIRMS_MAP_KEY=your-nasa-firms-map-key
```

Useful optional values:

```dotenv
FIRMS_SOURCE=VIIRS_SNPP_NRT,MODIS_NRT
FIRMS_AREA_COORDINATES=68,6,98,38
FIRMS_POLL_INTERVAL=*/30 * * * *
OSM_AREA_BBOX=6.5,68.0,37.5,97.5
OSM_SYNC_INTERVAL=0 3 * * 0
CORS_ORIGIN=http://localhost
```

Keep existing port values unchanged unless a deployment design specifically requires a coordinated port change.

#### 2. Build and start

```powershell
cd Development
docker compose -f docker-compose.prod.yml up -d --build
```

The API image applies bundled migrations before it starts. The worker starts separately from the same API image and must remain healthy for continuous ingestion and classification.

#### 3. Verify

```powershell
Invoke-WebRequest http://localhost:3030/health
Invoke-WebRequest http://localhost:8000/health
docker compose -f docker-compose.prod.yml ps
```

| Service | Local address |
| --- | --- |
| Web dashboard | [http://localhost](http://localhost) |
| API health | [http://localhost:3030/health](http://localhost:3030/health) |
| API documentation | [http://localhost:3030/api/v1/docs](http://localhost:3030/api/v1/docs) |
| Contextual-service health | [http://localhost:8000/health](http://localhost:8000/health) |

#### 4. Stop without deleting data

```powershell
cd Development
docker compose -f docker-compose.prod.yml down
```

This keeps named local database and Redis volumes. Use `down --volumes` only when you explicitly intend to remove local data.

### Non-container development

Install the workspace dependencies:

```powershell
cd Development
npm ci
```

Start the API and web application in separate terminals after required services are available:

```powershell
cd Development
npm run dev:api
```

```powershell
cd Development
npm run dev:web
```

For a realistic development environment, keep PostgreSQL/PostGIS, Redis, and the Python contextual service reachable through the values in `Development/.env`.

---

## Deployment

A complete deployment has four compute responsibilities. Hosting only the frontend and API is not enough for new live data to appear.

```text
Browser UI
   │
   ▼
Web application ───────────────► API + Socket.io
                                      │       │
                                      │       └────► Redis / Upstash
                                      ▼
                             PostgreSQL/PostGIS / Aiven
                                      ▲
                                      │
Worker ─────► FIRMS / OSM ─────► Contextual service
```

### Recommended cloud topology

| Deployment responsibility | Typical platform | Requirement |
| --- | --- | --- |
| Web application | Render static site or web service | Build-time `VITE_API_URL` and `VITE_WS_URL` must target the deployed API |
| API + Socket.io | Render web service | Needs Firebase configuration, database access, Redis access, classifier URL, CORS origin, and health check |
| Python contextual service | Render web service or container service | Needs database access and access to required local data assets/volume strategy |
| Background worker | Render worker service or another always-on process | Runs `node apps/api/dist/workers/index.js` after the API workspace is built |
| PostgreSQL/PostGIS | Aiven or equivalent managed service | TLS, backups, migration procedure, and restore testing required |
| Redis | Upstash or equivalent managed Redis | API and worker must use the same `REDIS_URL` |

### Web deployment requirements

Vite variables are embedded when the frontend is built. Set these values in the web service **before** triggering its build:

```dotenv
VITE_API_URL=https://your-api-domain.example
VITE_WS_URL=wss://your-api-domain.example
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

After changing a `VITE_*` value, rebuild/redeploy the web application. Changing an API environment variable later does not alter an already-built browser bundle.

### API deployment requirements

Configure the API with service-specific secrets, not committed files:

```dotenv
NODE_ENV=production
DATABASE_URL=managed-postgres-connection-string
REDIS_URL=managed-redis-connection-string
CLASSIFIER_URL=https://your-classifier-domain.example
CORS_ORIGIN=https://your-web-domain.example
FIRMS_MAP_KEY=your-nasa-firms-key
FIRMS_SOURCE=VIIRS_SNPP_NRT,MODIS_NRT
FIRMS_AREA_COORDINATES=68,6,98,38
FIRMS_POLL_INTERVAL=*/30 * * * *
OSM_AREA_BBOX=6.5,68.0,37.5,97.5
OSM_SYNC_INTERVAL=0 3 * * 0
```

Use the provider-assigned `PORT` value for web services. Do not copy local Docker port values into a hosted service unless the provider specifically requires them.

### Worker deployment requirements

The worker needs the same operational data configuration as the API:

```text
DATABASE_URL
REDIS_URL
CLASSIFIER_URL
FIRMS_MAP_KEY
FIRMS_SOURCE
FIRMS_AREA_COORDINATES
FIRMS_DAY_RANGE
FIRMS_POLL_INTERVAL
OSM_AREA_BBOX
OSM_SYNC_INTERVAL
NODE_ENV=production
```

It must be a long-lived process, not a browser build, static site, or one-off command. If it is absent, dashboard data may look valid but will remain stale because scheduled polling and queued classification are not running.

### Deployment validation

After each deployment:

1. Check API and classifier health endpoints.
2. Confirm the worker process is running and connected to Redis.
3. Sign in with a least-privilege test user and confirm redirect, API access, and denied admin actions.
4. Confirm the web dashboard calls the intended API domain rather than localhost.
5. Confirm Socket.io connects over `wss://` from the deployed site.
6. Validate one manual FIRMS/OSM action with logs, then confirm events and facilities appear correctly.
7. Confirm maps switch Dark, Satellite, and OpenStreetMap modes.
8. Confirm alert triage and settings recalculation update persisted state and active dashboards.

---

## Configuration reference

| Variable | Purpose | Notes |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL/PostGIS connection | Required by the API, worker, and contextual service where applicable |
| `REDIS_URL` | Redis connection | Must point API and worker to the same instance |
| `CLASSIFIER_URL` | Python service base URL | API/worker invokes `/internal/classify` |
| `FIRMS_MAP_KEY` | NASA FIRMS credential | Required for live FIRMS ingestion |
| `FIRMS_SOURCE` | Source list | Default includes VIIRS SNPP NRT and MODIS NRT |
| `FIRMS_AREA_COORDINATES` | FIRMS rectangular request area | Order: west, south, east, north |
| `FIRMS_POLL_INTERVAL` | FIRMS schedule | Default: every 30 minutes |
| `OSM_AREA_BBOX` | OSM search area | Order: south, west, north, east |
| `OSM_SYNC_INTERVAL` | OSM schedule | Default: weekly |
| `CORS_ORIGIN` | Approved browser origin(s) | Must include the deployed web URL, never use an unrestricted production wildcard |
| `VITE_API_URL` | Browser API URL | Compiled into frontend during build |
| `VITE_WS_URL` | Browser Socket.io URL | Compiled into frontend during build |

---

## Testing and quality checks

Run the relevant checks from `Development` before merging or deploying:

```powershell
cd Development
npm run lint
npm run test -w @agnidrishti/web
npm run test -w @agnidrishti/api
npm run build
python apps/classifier/test_classifier.py
```

For a full-stack confidence check, rebuild Docker and validate live endpoints:

```powershell
cd Development
docker compose -f docker-compose.prod.yml up -d --build
Invoke-WebRequest http://localhost:3030/health
Invoke-WebRequest http://localhost:8000/health
```

The repository does not currently include an active checked-in GitHub Actions workflow. Add CI before claiming automatic pull-request gates or continuous deployment.

---

## Production readiness and limitations

### Readiness checklist

- [ ] Deploy the web application, API, contextual service, and a separate long-lived worker.
- [ ] Use platform secret management for all credentials and TLS material.
- [ ] Rotate any credential that has appeared in a shared chat, image, log, or repository history.
- [ ] Apply least-privilege default roles before allowing public sign-in.
- [ ] Configure Firebase authorised domains, Google OAuth redirect settings, CORS, and Socket.io origin behaviour.
- [ ] Confirm database TLS, backups, restore testing, PostGIS availability, and migrations.
- [ ] Monitor queue depth, worker failures, external provider errors, health endpoints, and alert volume.
- [ ] Review facility reference-point quality and WorldCover coverage for the intended operating geography.
- [ ] Validate thresholds and inference behaviour against an approved, versioned evaluation set.

### Known limitations

- Satellite thermal observations have spatial, temporal, cloud, and source-publication uncertainty.
- A nearest-facility association is proximity to an OSM reference point, not a property-boundary result.
- External FIRMS and Overpass services can be unavailable or rate-limited.
- Historical baselines depend on the records actually stored during the available 90-day window.
- The dashboard prioritises review; it does not replace field evidence, incident command, or emergency response.

---

## Repository structure

```text
AgniDrishti/
├── data/                        # Sample data, processed assets, local WorldCover tiles
├── shared/                      # Cross-service data-contract specifications
├── verification/                # Data and integration validation helpers
├── Development/
│   ├── apps/
│   │   ├── web/                 # React/Vite dashboard
│   │   ├── api/                 # Express API, database migrations, worker source
│   │   └── classifier/          # Python FastAPI contextual-inference service
│   ├── packages/shared-types/   # Shared TypeScript domain types
│   ├── docker-compose.prod.yml  # Complete local Docker stack
│   ├── docker-compose.local.yml
│   └── package.json             # Workspace scripts
├── PROJECT_GUIDE.md             # Concise technical and operations guide
└── XYZ.md                       # Extended internal implementation reference
```

---

## Documentation

- [Project Guide](PROJECT_GUIDE.md) — architecture, data flow, API, operations, configuration, and production checklist.
- [Extended Internal Reference](XYZ.md) — detailed implementation and research-context material.
- API reference — available at `/api/v1/docs` when the API is running.

---

## Contributing

Keep changes focused and reviewable. Before opening a pull request:

1. run the tests and type checks relevant to the modified service;
2. build the web application after frontend changes;
3. do not commit `.env` files, credentials, certificates, generated data, or unrelated workspace changes;
4. update this README and the Project Guide when architecture, runtime configuration, security posture, or operator-visible behaviour changes.

## License

No licence file is currently included. Obtain permission from the repository owner before redistribution or use outside the intended project context.
