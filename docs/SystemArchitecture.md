# System Architecture Document

## 1. Architecture Objective

The architecture must integrate:

* satellite thermal data
* industrial infrastructure data
* land-cover information
* satellite imagery
* geospatial processing
* machine learning
* temporal analysis
* GIS visualization

The architecture is designed as a modular system so that frontend, backend, data and ML components can be developed independently.

---

# 2. High-Level Architecture

```text
                    EXTERNAL DATA SOURCES
                           │
          ┌────────────────┼─────────────────┐
          │                │                 │
       NASA FIRMS         OSM          Land Cover/
          │                │            Satellite
          └────────────────┼─────────────────┘
                           ↓
                  DATA INGESTION LAYER
                           ↓
                  DATA PROCESSING LAYER
                           ↓
                PostgreSQL + PostGIS
                           │
             ┌─────────────┴──────────────┐
             │                            │
             ↓                            ↓
      Persistence Engine            Feature Engine
             │                            │
             └─────────────┬──────────────┘
                           ↓
                     ML SERVICE
                    Python/FastAPI
                           ↓
                 Classification Result
                           ↓
                    Node.js API
                     Express.js
                           ↓
                    React Frontend
                           ↓
                 GIS Dashboard / Map
```

---

# 3. Architecture Components

## 3.1 Data Sources

### NASA FIRMS

Provides thermal anomaly observations.

### OpenStreetMap

Provides industrial infrastructure and geographic information.

### Land-Cover Dataset

Provides environmental/geographic context.

### Satellite Imagery

Provides additional visual/spectral information.

---

# 4. Data Ingestion Layer

The ingestion layer retrieves data from external sources.

Responsibilities:

* API communication
* file downloading
* validation
* duplicate detection
* data normalization
* coordinate normalization
* timestamp normalization
* database insertion

Example:

```text
NASA FIRMS
     ↓
Fetcher
     ↓
Validator
     ↓
Normalizer
     ↓
PostGIS
```

---

# 5. Data Processing Layer

This layer converts raw data into analysis-ready information.

Operations:

* cleaning
* missing-value handling
* coordinate validation
* spatial joins
* distance calculation
* clustering
* temporal grouping
* persistence calculation

---

# 6. PostgreSQL + PostGIS

PostGIS is the central geospatial data store.

Main responsibilities:

* store geographic points
* store industrial polygons/points
* spatial queries
* distance calculations
* spatial indexing
* event history
* prediction storage

Example query concept:

```text
thermal_event
       ↓
find industrial facility
       ↓
within 5 km
       ↓
return nearest facility
```

---

# 7. Feature Engineering Engine

For every thermal event, the system generates features.

Example:

```text
FIRMS
 ├── FRP
 ├── brightness
 ├── confidence
 └── time

OSM
 ├── facility type
 ├── distance
 └── facility density

Land Cover
 └── surrounding land class

Temporal
 ├── detection count
 ├── duration
 └── recurrence

Spatial
 ├── cluster size
 ├── hotspot density
 └── spatial stability
```

These features are sent to the ML service.

---

# 8. Persistence Engine

The persistence engine analyzes historical observations.

For a location:

```text
Observation 1
Observation 2
Observation 3
...
Observation N
```

It calculates:

* total detections
* active days
* recurrence rate
* consecutive days
* duration
* spatial variance
* average FRP
* FRP variation

The result becomes a persistence profile.

---

# 9. ML Service

The ML service is implemented independently using:

**Python + FastAPI**

Why separate it?

Node.js is ideal for:

* REST APIs
* application logic
* frontend communication

Python is better suited for:

* ML
* geospatial processing
* scientific computing

Therefore:

```text
Node.js
   │
   │ HTTP
   ↓
FastAPI
   ↓
XGBoost / Random Forest
```

---

# 10. Backend API

The Node.js/Express backend acts as the main application gateway.

Responsibilities:

* frontend APIs
* database access
* authentication
* event queries
* GIS queries
* ML-service communication
* dashboard statistics

Example endpoints:

```text
GET  /api/events
GET  /api/events/:id
GET  /api/events/:id/history
GET  /api/facilities
GET  /api/facilities/:id
GET  /api/map/events
GET  /api/statistics
POST /api/predict
GET  /api/persistence/:id
```

---

# 11. ML API

Python service endpoints:

```text
POST /predict
POST /batch-predict
GET  /model-info
GET  /health
```

Example prediction request:

```text
{
    FRP,
    brightness,
    confidence,
    industrial_distance,
    facility_type,
    persistence_score,
    land_cover,
    cluster_size
}
```

Example response:

```text
{
    "class": "Industrial Fire",
    "confidence": 0.917,
    "model_version": "v1.0"
}
```

---

# 12. Frontend Architecture

React application:

```text
React
│
├── Dashboard
├── Map
├── Event Details
├── Analytics
├── Persistence
├── Filters
└── Settings
```

The frontend communicates only with the Node.js API.

It should not directly access the database.

---

# 13. GIS Architecture

Map layers:

```text
Base Map
   +
Industrial Facilities
   +
FIRMS Thermal Points
   +
Fire Clusters
   +
Classification Layer
   +
Persistent Sources
   +
Satellite Imagery
```

The frontend requests spatial data from the backend.

---

# 14. Caching

Caching can be introduced for:

* frequently requested map regions
* dashboard statistics
* static facility information
* repeated spatial queries

Redis can be added later if required.

It is **not necessary for the initial MVP**.

---

# 15. Background Jobs

Data ingestion should not depend on a user opening the dashboard.

A background process should periodically:

```text
Fetch FIRMS
   ↓
Validate
   ↓
Store
   ↓
Cluster
   ↓
Calculate persistence
   ↓
Generate features
   ↓
Run ML
   ↓
Store prediction
```

For the initial implementation, this can be a Node.js scheduled job.

Later it can be moved to a dedicated worker system.

---

# 16. Deployment Architecture

Recommended initial deployment:

```text
             Internet
                │
                ↓
         React Frontend
                │
                ↓
        Node.js / Express
                │
       ┌────────┴─────────┐
       ↓                  ↓
PostgreSQL/PostGIS    FastAPI ML
                           │
                           ↓
                       ML Model
```

Docker should be used so all services can run consistently.

---

# 17. Docker Services

Recommended containers:

```text
frontend
backend
ml-service
postgres-postgis
```

Optional later:

```text
redis
worker
nginx
```

---

# 18. Repository Structure

Recommended monorepo:

```text
industrial-fire-monitor/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── services/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   └── utils/
│   └── package.json
│
├── ml-service/
│   ├── app/
│   ├── models/
│   ├── preprocessing/
│   └── requirements.txt
│
├── data-pipeline/
│
├── database/
│   ├── schema/
│   └── migrations/
│
├── docker/
│
├── docs/
│
└── README.md
```

---

# 19. Data Flow

## Normal Event Flow

```text
FIRMS
 ↓
Ingestion
 ↓
Validation
 ↓
PostGIS
 ↓
Spatial Association
 ↓
Persistence Analysis
 ↓
Feature Engineering
 ↓
ML Classification
 ↓
Prediction Database
 ↓
Express API
 ↓
React
 ↓
GIS Map
```

---

# 20. Failure Handling

External data sources may fail.

The system should:

* retry failed requests
* log failures
* prevent duplicate records
* validate malformed data
* continue serving previously stored data

The dashboard should not become unavailable merely because FIRMS is temporarily unavailable.

---

# 21. Security Architecture

Secrets:

```text
.env
```

should contain:

```text
DATABASE_URL
FIRMS_API_KEY
JWT_SECRET
```

Never hard-code secrets in GitHub.

Frontend should never receive private API keys.

---

# 22. Architecture Principles

The system should follow:

* modularity
* separation of concerns
* API-first development
* spatial indexing
* independent ML service
* reproducible ML pipeline
* Dockerized services
* version-controlled schemas
* centralized logging
