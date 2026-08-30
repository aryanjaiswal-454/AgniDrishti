# AgniDrishti

**AI-Powered Thermal Intelligence**
*Detect · Classify · Monitor*

---

> **Smart India Hackathon 2026 — SIH26162**
> AI-Based Detection and Classification of Industrial Fires and Persistent Thermal Sources Using NASA FIRMS, OSM & Satellite Data

---

## Overview

AgniDrishti is an intelligent geospatial platform that detects, classifies, and monitors industrial fires and persistent thermal sources using NASA FIRMS satellite data, OpenStreetMap facility data, and land-cover rasters. It provides real-time alerts, GIS-based visualization, and AI-driven classification to distinguish industrial thermal activity (gas flares, industrial fires, mining) from natural events (forest fires, agricultural burning).

### Key Capabilities

- **Thermal Detection** — Continuous ingestion of NASA FIRMS hotspot data
- **AI Classification** — Machine learning–driven segregation of industrial vs. natural fire events
- **Industrial Sub-Classification** — Identification of gas flares, industrial fires, and mining activity
- **Anomaly Detection** — Statistical detection of abnormal thermal events at monitored facilities
- **GIS Visualization** — Interactive map dashboard with classified event overlays
- **Real-Time Alerts** — Push notifications for high-severity and anomalous events
- **Analyst Feedback** — Human-in-the-loop feedback for model improvement

---

## Architecture

```text
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  React SPA  │◄───►│  Express API    │◄───►│  PostgreSQL      │
│  (Vite)     │     │  (Node.js)      │     │  + PostGIS       │
│  apps/web   │     │  apps/api       │     │                  │
└─────────────┘     └────────┬────────┘     └──────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
   ┌────────▼────────┐ ┌─────▼─────────┐ ┌────▼─────────────┐
   │  BullMQ Workers │ │  Redis        │ │ FastAPI          │
   │  (Background)   │ │ (Queue/Cache) │ │ Classifier       │
   │  apps/api       │ └───────────────┘ │ apps/classifier  │
   └─────────────────┘                   └──────────────────┘
```

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend API | Node.js, Express, TypeScript |
| Background Workers | Node.js, BullMQ |
| Database | PostgreSQL 16 + PostGIS 3.4 |
| Queue/Cache | Redis 7 |
| AI/ML Service | Python, FastAPI, scikit-learn |
| Maps | React-Leaflet, OpenStreetMap |

---

## Repository Structure

```text
AgniDrishti/
├── apps/
│   ├── api/              # Express.js backend & BullMQ workers (TypeScript)
│   ├── web/              # React + Vite frontend (TypeScript)
│   └── classifier/       # FastAPI AI/ML service (Python)
├── packages/
│   └── shared-types/     # Shared TypeScript type definitions
├── data/
│   ├── sample/           # Shared sample datasets for pilot region
│   └── raw/              # Raw data downloads (WorldCover tiles, OSM)
├── .github/
│   └── workflows/        # CI/CD pipeline
├── docker-compose.yml       # Dev DB/Redis dependencies
├── docker-compose.prod.yml  # Full production deployment
├── .env.example          # Environment variable template
├── package.json          # Root workspace configuration
└── tsconfig.base.json    # Shared TypeScript base config
```

---

## Prerequisites

- **Docker Desktop** — required for infrastructure and full production deployment
- **Node.js** ≥ 20.x (For local development)
- **npm** ≥ 10.x (For local development)
- **Git**

---

## Production Deployment (End-to-End)

To run the entire suite (Web, API, Background Workers, ML Classifier, Database, Redis) interconnected as containers:

### 1. Configure environment
```bash
cp .env.example .env
# Edit .env and supply: POSTGRES_PASSWORD, JWT_SECRET, FIRMS_MAP_KEY, CORS_ORIGIN, VITE_API_URL, VITE_WS_URL
```

### 2. Start full infrastructure
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### 3. Run Database Migrations
```bash
docker exec -it agnidrishti-api-prod npm run db:migrate -w @agnidrishti/api
```

### 4. Verify
- **Frontend UI:** `http://localhost:80`
- **Backend API:** `http://localhost:3001/health`
- **Classifier:** `http://localhost:8000/health`

---

## Local Development

For hacking on individual layers without spinning up all containers:

### 1. Clone and install
```bash
git clone <repository-url>
cd AgniDrishti
npm install
```

### 2. Start development dependencies (DB & Redis)
```bash
docker compose up -d
```

### 3. Start development servers
```bash
# Backend API (port 3001)
npm run dev:api

# Frontend (port 5173)
npm run dev:web
```

---

## AI/ML Integration Tracks

The AI/ML classification pipeline unifies two independent predictive tracks:

- **Track A** — Random Forest integration determining natural vs. industrial classification utilizing FIRMS properties and local ESA WorldCover geospatial rasters.
- **Track B** — Distance analysis and facility matching running industrial sub-classifications and statistical anomaly tracking utilizing FIRMS + OSM facilities.

Both logic streams merge inside the `apps/classifier` FastAPI service to evaluate properties simultaneously and provide the final unified confidence metric passed directly onto the Node.js API ingest pipeline.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev:api` | Start backend dev server with hot-reload |
| `npm run dev:web` | Start frontend Vite dev server |
| `npm run build` | Build all packages (shared-types → api → web) |
| `npm run lint` | Type-check all workspaces |

---

## License

This project is developed for Smart India Hackathon 2026.
