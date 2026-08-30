# AgniDrishti System Info

## Architecture Map
- **UI (Web)**: Vite/React/TS single-page app containing real-time dashboards mapping thermal anomaly data. 
- **Backend (API)**: Express/TS Node server connecting via BullMQ / Redis to coordinate background jobs, WebSocket server for UI pushes, and HTTP API endpoints.
- **Workers**: Spun off alongside the API image to exclusively drain BullMQ OSM/FIRMS ingest and classification queues.
- **Classifier (AI ML tier)**: FastAPI server evaluating incoming hotspots based on:
  - **Track A**: Random Forest predictive integration evaluating natural classification properties of thermal hotspots (taking temporal, radiometric, and geospatial data including ESA WorldCover). 
  - **Track B**: Distance analysis matching historical records and registered facilities/industrial anomalies.
- **Storage Tier**: PostgreSQL via PostGIS container for spatial records bounding real geospatial features natively alongside primary DB entities + Redis cache layer for queueing and runtime caching.

## Configurations
All services receive specific runtime/buildtime instructions via environment variables.

### Build 
- Production UI demands `VITE_API_URL` and `VITE_WS_URL`.

### Runtime
- Secret keys and APIs mapping (FIRMS key via `FIRMS_MAP_KEY`, JWT secrets string mapping `JWT_SECRET`, and internal connections linking classifier internal docker networks).