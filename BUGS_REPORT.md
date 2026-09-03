# AgniDrishti End-to-End Technical Audit & Bugs Report

**Date of Audit**: September 2, 2026
**Scope**: Full stack review covering API, Web, Classifier, and Ingestion pipelines (`Development/apps/*`).

As requested, below is an exhaustive list of bugs, misalignments, and data staleness issues successfully identified across the entire project pipeline without modifying any source files. The audit traced the lifecycle of a firing thermal anomaly from NASA FIRMS telemetry, through the BullMQ processing queues and the ML classification endpoints, all the way to real-time WebSockets and TanStack invalidations on the React GIS Map.

---

## 1. WebSockets & React Client Real-Time Staleness (Critical)
**Title**: Live Map Markers Fail to Auto-Update During WebSocket Broadcasts 
**Severity**: Critical  
**File**: `Development/apps/web/src/realtime/RealtimeContext.tsx`  

**Root Cause Analysis**: 
The frontend's Socket.io payload listener for `REALTIME_EVENTS.ALERT_CREATED` explicitly executes a premature return if the alert is not high severity (`if (alert.severity !== "high") return;`). 
Furthermore, even when a "high" severity alert occurs, the TanStack Query cache invalidation explicitly targets only `alerts.lists()` and `dashboard.summary()`. It fails to invalidate `queryKeys.events.lists()`, which drives the core GIS markers plotted by `useEvents()`.

**Failure Scenario / System Effect**:  
When standard thermal anomalies are continuously ingested by the backend, the Command Center Map points literally freeze. Users will not perceive the entry of new medium/low anomalies in real time without refreshing the browser. The map is completely decoupled from telemetry pacing.

**Concrete Solution**: 
Remove the early `if (alert.severity !== "high") return;` constraint from the overarching socket context in `RealtimeContext.tsx` so state caching applies fairly to all ingress limits. Target `queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() })` within the payload execution block to trigger instantaneous map re-renders globally.

---

## 2. API Worker Broadcast Bypass (High)
**Title**: Raw SQL Insert Bypasses WebSocket Socket.io Emitters
**Severity**: High  
**File**: `Development/apps/api/src/workers/classification.worker.ts`  

**Root Cause Analysis**: 
When the BullMQ classification worker successfully processes an anomalous event, it executes a raw SQL command (`INSERT INTO alerts (classified_event_id, severity, status) VALUES ...`). This direct database write bypasses `AlertService`, the application's single source of truth for propagating alerts to WebSocket namespaces `emitAlertCreated()`.

**Failure Scenario / System Effect**:  
Crucial downstream events disconnect. The background worker writes to Postgres perfectly, but the live users sitting on the dashboard receive zero broadcast notifications for critical industrial fires.

**Concrete Solution**: 
Delete the raw `client.query('INSERT INTO alerts...')` approach inside the BullMQ job consumer. Instead, inject and call `AlertService.createAlert(...)` to guarantee both ACID database persistence and Socket.io channel emission are synchronized. 

---

## 3. ML Handoff Bug: Track B Anomaly Cache Freeze (High)
**Title**: Track B Anomaly Engine Handoff Silently Fails on Live Streaming Data
**Severity**: High  
**File**: `Development/apps/classifier/track_b_integration.py`  

**Root Cause Analysis**: 
When the API hands off a new hotspot to the classification engine, Track B anomaly tracking attempts an ID lookup from a static in-memory dictionary `_track_b_cache`. This cache is loaded exactly once at application startup from a JSONL file (`TRACK_B_CONTRACT_PATH`). 

**Failure Scenario / System Effect**:  
Live NASA FIRMS data generates completely new UUID `hotspot_id`s that did not exist when the FastAPI server was booted. Live handoff lookups (`cache.get(hotspot_id)`) will permanently result in `None`. Therefore, Track B entirely fails on live streaming data, and the system silently downgrades to exclusively querying Track A predictions. Anomalies are ignored on the live server.

**Concrete Solution**: 
Bypass the static file cache for incoming live handoffs. Refactor `track_b_integration.py` to dynamically execute a rolling 90-day FRP Z-score computation by querying the live PostgreSQL database for the surrounding timeframe.

---

## 4. ML Handoff Bug: Track A Geospatial Context Loss (Medium)
**Title**: Spatial Feature Extraction Hardcodes Unimodal Neighborhoods during Handoff
**Severity**: Medium  
**File**: `Development/apps/classifier/track_a_integration.py`  

**Root Cause Analysis**: 
During the handoff from FastAPI to the Track A Random Forest model (`handoff.py`), the integration wrapper explicitly hardcodes a critical spatial feature input: `neighborhood_count = 1`.

**Failure Scenario / System Effect**:  
The Random Forest model was trained to distinguish between single agricultural stubble fires and clustered, pervasive industrial flares by utilizing spatial bounding density. Forcefully overriding `neighborhood_count` to 1 blinds the ML model to geospatial clusters during the handoff, heavily raising the false-positive rate (misjudging standard agricultural fires as heavy industrial flares).

**Concrete Solution**:  
Before the handoff payload is passed into the `.predict()` method, execute a PostGIS spatial bounding block query (e.g., `ST_DWithin(geometry, point_geometry, distance)`) to dynamically inject the correct historic neighborhood counts into the Live Track A vectors.

---

## 5. Stale / Hardcoded UI Telemetry Contexts (Medium)
**Title**: Operational Dashboard Misrepresents System Model Metadata
**Severity**: Medium  
**File**: `Development/apps/web/src/pages/command-center/AiIntelligencePanel.tsx` & `CommandCenterKpis.tsx`  

**Root Cause Analysis**: 
The React presentation views display strings as static HTML literals. The application statically declares the model pipeline as `"v1.0.0-rules-ml-hybrid"` functioning via `"Rules + PostGIS Spatial"`, utilizing `"+3.0σ FRP Exceedance"`. 

**Failure Scenario / System Effect**:  
The UI permanently lies to network administrators. If the actual pipeline backend is upgraded to a newer version or modifies the statistical deviation metrics, the Command Center will blindly showcase out-of-date static text indicating the usage of v1.0.0. 

**Concrete Solution**:  
Modify the `/api/v1/dashboard/summary` backend endpoint to bundle the active version, active ML strategy tags, and statistical deviation metrics explicitly from the FastAPI microservice configuration. Consume these object properties dynamically in `AiIntelligencePanel.tsx` in place of standard strings.
---

## 6. Z-Axis Ordering Failures on GIS Map Overlays (Medium)
**Title**: Map Component Overlaps Global Navigation Elements
**Severity**: Medium
**File**: `Development/apps/web/src/components/shell/TopBar.tsx`, `Sidebar.tsx`, `StatusStrip.tsx`

**Root Cause Analysis**:
The Leaflet map tile layer and clustering plugins establish their own stacking contexts (typically `z-index: 400` or `1000`). The global UI shell components (TopBar, Sidebar) were assigned insufficient z-index values or omitted stacking contexts entirely, causing map tooltips and vectors to render *above* dropdowns and navigation.

**Failure Scenario / System Effect**:
Users attempting to open the notification bell or profile dropdown discover that the content is visually hidden beneath the map. Critical navigation becomes unclickable when panning over certain regions.

**Concrete Solution**:
Elevated `TopBar` and `Sidebar` to `z-[2000]` and dropdown portals to `z-[2010]` across the application shell to guarantee precedence over all Leaflet tile panes.

---

## 7. Hardcoded Notification Strings Disconnected From State (High)
**Title**: TopBar Notification Bell Emits Stale Static Text
**Severity**: High
**File**: `Development/apps/web/src/components/shell/TopBar.tsx`

**Root Cause Analysis**:
The global `TopBar` notification dropdown contained completely mocked, hardcoded React nodes (e.g., "Industrial Fire Flare 12m ago Jamnagar Refinery"). It was entirely disconnected from the query engine's alert state.

**Failure Scenario / System Effect**:
Even as new alerts successfully trigger WebSocket events and arrive in the Recent Alerts panel, the global notification bell permanently reads "Threat Alerts (2)" with static content from Bokaro Steel and Jamnagar Refinery. Users are misled into believing historical incidents are live.

**Concrete Solution**:
Integrated the `useAlerts({ limit: 4, status: 'new' })` TanStack hook into `TopBar.tsx`. Mapped the resolved data array dynamically to the dropdown menu utilizing `date-fns` for time offsets, restoring real-time visibility to the shell.

## 8. WebSocket Disconnection Due to Asymmetric Token Algorithm (Critical)
**Title**: Socket.io Rejects Firebase ID Tokens Due to Algorithm Confusion Prevention
**Severity**: Critical
**File**: `Development/apps/api/src/realtime/socket.ts` and `Development/apps/api/src/utils/jwt.ts`

**Root Cause Analysis**:
The Socket.io handshake authentication logic uses local `jsonwebtoken.verify(token, config.jwt.secret)` expecting a token signed with the `HS256` symmetric algorithm. However, standard user authentication on the frontend utilizes Firebase Auth, which generates ID Tokens signed asymmetrically by Google using the `RS256` algorithm. When `jwt.verify` encounters a valid Firebase token, it immediately aborts to prevent algorithm-confusion attacks, throwing the `invalid algorithm` error observed in production logs.

**Failure Scenario / System Effect**:
This directly causes the real-time data failure on the live URL. When clients in production connect, their Socket.io connections are forcefully rejected. The backend successfully fetches data and creates alerts in the database, but since no sockets are authenticated or connected, the `emitAlertCreated()` broadcast drops into the void. Therefore, the UI remains perfectly static on production, whereas your localhost (if using mock tokens or bypassing Firebase) appeared to work.

**Concrete Solution**:
Refactored `socket.ts` to utilize `firebaseAuth.verifyIdToken(token)` exactly like the HTTP Express routes (`auth.ts`), resolving the asymmetric cryptography conflict. Integrated local PostgreSQL user fetching/auto-creation immediately after Firebase token verification to strictly build the correct `JWTPayload` for Socket state.

---

## 9. Third-Party Worker Starvation: Overpass API Timeout (High)
**Title**: Massive National Bounding Box Starves OSM Worker Queue
**Severity**: High
**File**: `Development/apps/api/src/ingestion/osm/client.ts`

**Root Cause Analysis**:
The OpenStreetMap Overpass client performs a query requesting nearly every industrial structure across the entire Indian subcontinent (`6.5,68.0,37.5,97.5`) simultaneously (`[out:json][timeout:60]`). The public `overpass-api.de` limits immense spatial queries, resulting in 504 Gateway Timeouts and `ECONNREFUSED` connection blocks.

**Failure Scenario / System Effect**:
Because the `OsmOverpassClient` forcefully threw fatal exceptions when all mirrors failed, the BullMQ `osm-sync-queue` job crashed and automatically retried infinitely. This endless cycle starved the backend resources and filled production server logs with Overpass connectivity errors, preventing smooth worker operation.

**Concrete Solution**:
Modified `fetchIndustrialFacilities()` to catch the final fatal error explicitly and return an empty array gracefully `return []`. This permits the ingestion worker to successfully finish its queue cycle smoothly without destroying the server loop, avoiding massive log spam and worker starvation.

---

## 10. Synthetic Data Limitation: Only 8 Facilities Available in UI (Medium)
**Title**: Overpass API Blockage Limits Facilities to Static Seed Data
**Severity**: Medium
**File**: `Development/apps/api/src/db/seed.ts` & `Development/apps/api/src/ingestion/osm/client.ts`

**Root Cause Analysis**:
Due to the Overpass API throttling and blocking large requests from Docker containers (as partially described in Bug 9), the system is failing to dynamically ingest live maps of industrial sites across India. Consequently, the database relies entirely on the hardcoded `facilitiesData` array located in `seed.ts`, which contains exactly 8 handpicked representative facilities.

**Failure Scenario / System Effect**:
Even though India houses thousands of heavy industrial sites, the user interface will only display exactly 8 facilities (Jamnagar, Mathura, Bokaro, etc.). The system fails to scale nationally because live OpenStreetMap ingestion is actively failing or being throttled by public mirrors.

**Concrete Solution**:
To support full national scaling, remove reliance on the public Overpass API for bulk initial ingestion. Instead, pre-populate the Postgres database with a complete static geospatial dataset of Indian industrial facilities (via a `.sql` dump or a robust initial bulk ingestion script), or transition to a commercial/dedicated OSM API mirror that permits massive continent-scale bounding box queries.

---

## Verification Status — September 3, 2026

This section records the post-fix verification pass. “Fixed in code; E2E blocked” means source, targeted tests, or builds verify the implementation, but a full browser flow could not be asserted without an authenticated Firebase session or a rebuilt runtime container. Existing environment port values were not changed.

| Bug | Status | Evidence and remaining limitation |
| --- | --- | --- |
| 1. WebSocket map staleness | **Fixed and verified** | `RealtimeContext.tsx` invalidates event queries for every received alert while reserving toasts for high severity. It also invalidates facility queries on `agni:facilities:synced`. `apps/web/test/d64_realtime.test.tsx` passed (12 tests). |
| 2. Worker broadcast bypass | **Fixed in code; E2E blocked** | `classification.worker.ts` calls `AlertService.createAlert()` rather than inserting alerts directly. Live worker/classifier flow requires an authenticated ingestion run to verify end to end. |
| 3. Track B cache freeze | **Fixed in code; E2E blocked** | `track_b_integration.py` now queries live `hotspots` and `facilities` records, calculates the rolling 90-day FRP score, and closes database resources. Classifier health endpoint returned 200, but the running container must be rebuilt/restarted to exercise this changed source. |
| 4. Track A spatial context loss | **Fixed in code; E2E blocked** | `classification.worker.ts` calculates `neighborhood_count` with `ST_DWithin` and includes it in the classifier payload. The PostGIS column reference was corrected to `geometry`. Requires a live classified hotspot to assert the complete handoff. |
| 5. Hardcoded dashboard telemetry | **Fixed in code; source verified** | `DashboardService.getSummary()` exposes configurable `pipeline_metadata`; `AiIntelligencePanel.tsx` consumes those values from the summary response. |
| 6. GIS z-index overlap | **Fixed in code; source verified** | `TopBar`, `Sidebar`, `StatusStrip`, and dropdown/drawer layers use z-index values at or above 2000, above Leaflet panes. Browser visual regression testing remains advisable. |
| 7. Static notification bell | **Fixed in code; source verified** | `TopBar.tsx` obtains new alerts through `useAlerts({ limit: 4, status: 'new' })` and renders the returned alert list rather than fixed incident strings. |
| 8. Firebase Socket.io token mismatch | **Fixed in code; E2E blocked** | Socket middleware uses `firebaseAuth.verifyIdToken()` and synchronizes the corresponding application user. A real Firebase-authenticated browser session is required to verify the production handshake. Older API unit tests that generate local HS256 JWTs are no longer compatible with Firebase-only authentication and need test-specific Firebase mocks. |
| 9. Overpass worker starvation | **Fixed and verified** | The OSM client validates and splits the bbox, queries chunks sequentially across mirrors, returns partial/empty results without throwing on mirror failure, and deduplicates by element type plus ID. `apps/api/test/osm_client.test.ts` and `apps/api/test/ingestion_queue.test.ts` passed (4 tests). |
| 10. Eight-facility limitation | **Fixed in code; E2E blocked** | `seed.ts` now provides 24 labelled bootstrap facilities with non-OSM identifiers; the OSM path remains idempotent for live data. The protected facilities API and direct production-named container database were not queried without explicit authorization, so the persisted count was not asserted here. |

### Commands and service checks

- Passed: `npm run test -w apps/web -- --run test/d64_realtime.test.tsx` (12 tests).
- Passed: focused API OSM/queue tests (4 tests).
- Passed: API and web TypeScript lint, shared/API/web production builds.
- Runtime health checks passed: API health at the existing local/proxied endpoints reported PostgreSQL/PostGIS and Socket.io healthy; classifier health reported `track_b_available: true`; PostgreSQL and Redis Docker services reported healthy.
- Full API and web suites still have pre-existing authentication test-harness failures: their tests construct legacy local JWTs or expect a removed password-login route, while runtime authentication intentionally verifies Firebase ID tokens. These failures do not invalidate the targeted fixes above, but the test harness must be migrated to mock Firebase Admin before a completely green suite can be claimed.

## Final Verification Status — September 3, 2026

This is the final post-fix test pass. No environment or Docker port setting was changed.

| Bug | Final status | Verification |
| --- | --- | --- |
| 1. WebSocket map staleness | **Fixed** | The server broadcasts every alert severity; the client invalidates alert, dashboard, and event-list queries for every alert while displaying toasts only for high severity. Real-time tests passed. |
| 2. Worker broadcast bypass | **Fixed in code; deployment pending** | The classification worker commits the classified event before calling `AlertService.createAlert`, preventing a cross-connection foreign-key block. Focused worker and socket/service tests pass, but the current container set has no running production worker. |
| 3. Track B live cache freeze | **Fixed in code; deployment pending** | Live lookup/statistical computation is implemented and classifier health reports `track_b_available: true`. A real classified hotspot run is still required, and the worker must be started first. |
| 4. Track A spatial context loss | **Fixed in code; deployment pending** | The worker calculates and sends `neighborhood_count` using PostGIS. A real classified hotspot run is still required, and the worker must be started first. |
| 5. Hardcoded dashboard telemetry | **Fixed** | Dashboard metadata is supplied by the API and consumed by the web build. |
| 6. GIS z-index overlap | **Fixed in code** | Shell and overlay z-index values exceed Leaflet layers; map/UI tests and the web production build pass. A manual browser visual check remains advisable. |
| 7. Static notification bell | **Fixed** | The TopBar uses live alert query data rather than hardcoded incidents. |
| 8. Firebase Socket.io mismatch | **Fixed** | Socket authentication uses Firebase verification; API socket tests now mock Firebase at the test boundary and pass. A real Firebase browser token is required for final production-handshake confirmation. |
| 9. Overpass worker starvation | **Fixed** | API OSM client and ingestion-queue tests pass, including graceful failure behavior. |
| 10. Eight-facility limitation | **Fixed in code** | The bootstrap seed contains 24 labelled facilities and OSM remains additive/idempotent. The live persisted count was not changed or queried in this pass. |

### Final test evidence

- `npm.cmd run test -w apps/api`: **50/50 tests passed**.
- `npm.cmd run test -w apps/web`: **165/165 tests passed**.
- `npm.cmd run lint`: passed for shared types, API, and web.
- `npm.cmd run build`: passed for shared types, API, and web.
- Live health checks on the existing ports: API returned HTTP 200 with PostgreSQL/PostGIS and Socket.io healthy; classifier returned HTTP 200 with Track B available; PostgreSQL and Redis containers were healthy.

### Additional corrections made during this pass

- Updated outdated API and web test harnesses to model the Firebase-only authentication flow instead of legacy local JWT/password-login behavior.
- Added an accessible password label and show/hide-password button name to the login page.
- Updated stale UI assertions for the current Firebase login screen and cinematic intro.
- Corrected the classified-event/alert transaction boundary and restored the conservative weekly default for OSM sync; no environment values were changed.

### E2E boundary

The running API, classifier, database, and Redis containers are healthy, but the production worker container defined in `docker-compose.prod.yml` is not currently running. A complete authenticated browser journey and a live NASA FIRMS-to-classifier worker job therefore require a real Firebase account/token plus a deliberate deployment that starts the worker and rebuilds changed source. No ports, containers, or deployment configuration were altered during this verification.

## Deployment Readiness Update — September 3, 2026

The following update records the final source changes made after the preceding verification. No environment variable or port value was changed. A commit alone does **not** start a worker: the deployment must run the worker as a separate background process from the same release.

| Bug | Current status | Deployment requirement / evidence |
| --- | --- | --- |
| 1. WebSocket map staleness | **Fixed** | Server emits every alert severity and the client invalidates live queries. |
| 2. Worker broadcast bypass | **Fixed in source; not yet live-verified** | Start/redeploy the `worker` service alongside API and classifier; it commits the classified event before creating its alert. |
| 3. Track B cache freeze | **Fixed in source; not yet live-verified** | The classifier now receives `DATABASE_URL` in Docker Compose so its rolling 90-day FRP query uses the production PostGIS data. In Render, the classifier service must also be given its production database connection string; this is essential and is not a port change. |
| 4. Track A spatial context loss | **Fixed in source; not yet live-verified** | Redeploy the worker so the classifier receives the calculated `neighborhood_count`. |
| 5. Hardcoded dashboard telemetry | **Fixed** | Dashboard metadata is API-backed. |
| 6. GIS z-index overlap | **Fixed in source** | Overlay z-index values sit above Leaflet panes. |
| 7. Static notification bell | **Fixed** | The notification UI reads live alert-query data. |
| 8. Firebase Socket.io mismatch | **Fixed** | Socket authentication uses Firebase token verification. |
| 9. Overpass worker starvation | **Fixed** | The OSM client handles chunk/mirror failures without failing the worker loop. |
| 10. Eight-facility limitation | **Fixed in source** | Bootstrap facilities are expanded and OSM ingestion remains additive. |

### Asset and FRP corrections

- `fix_service.js` and `fix_socket.js` are one-off local repair helpers, not runtime dependencies. They are explicitly ignored, along with `.claude/worktrees/`.
- The identical canonical logo is retained at `Development/apps/web/public/logo.png`. That path is now explicitly unignored so Vite copies it to `/logo.png` in every web build; all existing logo references already use that URL.
- A valid Track B FRP z-score of `0` is now preserved by the API instead of being serialized as `null` and disappearing from the event UI.

### Remaining live-deployment step

The local Compose change preserves all existing ports. A local rebuild/start of `api`, `classifier`, and `worker` was requested, but the execution environment rejected the Docker command before it ran. Render deployment also cannot be confirmed from this workspace because no Render service URL, Blueprint, or deployment access is configured here. Do not mark Bugs 2–4 live until the worker is visibly running and an actual newly ingested hotspot shows a Track B result.

### Historical FRP score backfill

Existing classified thermal events created before the Track B live calculation can contain a database `NULL`, rather than the valid numeric value `0`. Migration `004_backfill_frp_z_scores.sql` now calculates missing scores without overwriting any existing score: it prefers prior nearby 90-day hotspot statistics, then uses the stored facility FRP baseline when historical variation is insufficient. Future Track B classifications use the same facility-baseline fallback. Applying the migration is still required before already stored events can display the calculated score.

The local migration was applied on September 3, 2026. The current local dataset contains 140 existing events, but none is linked to or within 5 km of a facility (the nearest is approximately 119 km away). These are therefore not eligible for a facility-specific FRP baseline, and the UI now states `No nearby facility` rather than incorrectly implying a failed calculation.

## FIRMS India-Only and Multi-Source Verification — September 3, 2026

- **MODIS_NRT fixed:** startup and scheduled FIRMS jobs now request every configured source. The first live local run requested both `VIIRS_SNPP_NRT` and `MODIS_NRT`; it persisted 9 new MODIS hotspots and retained 48 VIIRS hotspots.
- **Sri Lanka/foreign points fixed:** a bundled Natural Earth 1:50m India boundary filters downloaded coordinates before persistence. It does not rely on a runtime external boundary service and excludes Sri Lanka plus other neighbouring countries that fall inside the broad NASA rectangle.
- **Historical cleanup applied safely:** migration `005_remove_non_india_hotspots.sql` reduced the prior local hotspot set from 231 to 48 India-boundary records. The following live ingestion produced 9 additional Indian records, for 57 total. A transaction re-check confirmed all 57 would remain; zero are in the former Sri Lanka rectangle. Related classified events and alerts were removed safely through existing foreign-key cascades.
- **Credential-log protection added:** FIRMS HTTP error logging now redacts the map-key portion of endpoint URLs. `.env` files are already ignored and the exposed key was not found in tracked repository files.
- **Validation:** API build passed; full API suite passed (53/53); local API health returned HTTP 200 with PostgreSQL/PostGIS connected; API, classifier, worker, Redis, and PostgreSQL are running. No port or non-secret environment value was changed.

### Render environment action

No Render port, source, bounding-box, or polling environment variable needs changing for this fix. Rotate the previously exposed NASA FIRMS map key in NASA FIRMS, then replace only `FIRMS_MAP_KEY` in both the Render **API** service (for direct/manual ingestion) and the Render **worker** service (for scheduled ingestion), followed by a normal redeploy. Do not commit a key to the repository.

## Facility Registry Population Correction — September 3, 2026

- **Root cause confirmed:** the local database contained eight legacy hard-coded facilities, incorrectly labelled `source = 'osm'`. The live Overpass job was reaching all configured public providers but received timeouts, HTTP 429, or HTTP 504; it had been returning an empty array as a false successful sync after roughly 21 minutes.
- **Bootstrap fixed:** `seedIfEmpty.ts` now provisions the same 24 nationally distributed curated facilities as the full seed path. Migration `006_reconcile_bootstrap_facilities.sql` safely reconciles existing databases: it relabels the legacy eight as `bootstrap` and inserts the missing 16. Local verification: **24 total bootstrap facilities** across refinery (7), petrochemical (2), power plant (4), steel (5), mining (3), and LNG terminal (3).
- **OSM failure handling fixed:** the preferred current Private.coffee endpoint is included; each provider request is capped at 15 seconds and an entire OSM sync at 90 seconds. If every provider fails, the worker records a real failed job and makes no database change instead of reporting a misleading zero-result success. OSM jobs use one attempt, so a temporary provider outage cannot occupy the worker through five long retries.
- **Operational limit:** 24 curated facilities provide dependable national baseline coverage, but they are not a substitute for hundreds of official or OSM facilities. For a comprehensive production registry, import a versioned government/authoritative facility dataset or provision a dedicated Overpass/data service. Public Overpass instances are explicitly intended for modest use and can be overloaded or rate-limited.

## Controlled Local OSM Facility Import - September 3, 2026

- **Imported into the existing local Docker PostgreSQL `facilities` table:** **496** OSM industrial records, alongside the 24 curated bootstrap records (**520 total**). The imported rows use `source = 'osm_bulk'`; no separate local file, temporary table, port, or environment setting was used.
- **Scope and quality controls:** the import accepts thermal coal/gas/oil facilities, refineries/oil and petrochemical sites, steel sites, mines/mineshafts, LNG/gas infrastructure, and quarries. Generic solar and wind plants are excluded. The importer now applies the bundled India land-boundary polygon after download, rejecting candidate points in Sri Lanka or other neighbouring countries that fall inside the broad query box.
- **Validation passed:** 0 solar/wind name matches, 0 invalid geometries, and an India-only coordinate extent of 8.13437-31.36818 N / 68.61691-95.76982 E. Imported category counts: power plants 104, mining/quarries 360, refineries 22, petrochemical 9, and steel 1.
- **Runtime verification:** targeted OSM tests passed (3/3), the API production build passed, the rebuilt local API health endpoint returned HTTP 200 with PostgreSQL/PostGIS connected, and the protected facilities endpoint correctly requires authentication.
- **Deployment note:** this batch exists only in the local Docker database. It will not appear on Render until the same controlled import is run against Render's database (or a versioned facility dataset is deployed there). No Render environment or port change is needed for that later database import.

## Render Production Readiness Check - September 3, 2026

- **Public service status:** the Render API health endpoint returned HTTP 200 with PostgreSQL/PostGIS connected; the Render web application returned HTTP 200. The protected production dashboard endpoint returned the expected HTTP 401 without a Firebase token, so it is not exposing operational data publicly.
- **Track B production blocker identified and corrected in source:** the deployed Render classifier reported `track_b_available: false` because its configured sample-contract path is not included in the classifier Docker image. Track B now uses live PostGIS data and no longer treats that optional sample file as a production dependency. Its health endpoint reports database-backed availability, and the local rebuilt classifier verified `track_b_available: true` with `track_b_mode: live_database`.
- **Required Render classifier setting:** set `DATABASE_URL` on the classifier service to the same production database connection used by the API, using a newly rotated credential. Without it, Track B cannot query live hotspots and facilities. `TRACK_B_CONTRACT_PATH` is not required for live Track B and can be removed.
- **Command Center map:** its source now requests 100 events and 100 facilities, which are within the API validation limits. It will show those 100 records after the web service redeploys; the dashboard aggregate can still show all records. Rendering all 520 facilities requires a separate paginated/clustering enhancement.
- **No port change:** the API's Render `PORT`, public API URL, classifier URL, CORS origin, and UI build URLs retain their existing ports/protocols. Values in Render must be plain strings, not Markdown link syntax or surrounding brackets.
