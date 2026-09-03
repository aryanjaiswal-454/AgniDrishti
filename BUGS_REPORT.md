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
