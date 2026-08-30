# Product Requirements Document (PRD)

## 1. Project Information

**Project:** AI-Based Detection and Classification of Industrial Fires and Persistent Thermal Sources Using NASA FIRMS, OSM & Satellite Data

**SIH Problem Statement ID:** 26162

**Organization:** National Technical Research Organisation (NTRO)

**Category:** Software

**Theme:** Disaster Management

---

# 2. Problem Statement

Industrial facilities such as oil refineries, petrochemical complexes, thermal power plants, steel industries, mining areas and LNG terminals can generate significant thermal signatures that are detectable by satellites.

NASA FIRMS provides satellite-derived active fire and thermal anomaly detections. However, a thermal anomaly by itself does not indicate whether the event is:

* an industrial fire,
* a normal industrial thermal source,
* a gas flare,
* agricultural burning,
* a forest/wildfire,
* mining-related activity,
* or another thermal event.

The proposed system will integrate NASA FIRMS thermal detections with OpenStreetMap (OSM), land-cover information, satellite imagery and temporal information to automatically classify thermal anomalies and identify persistent thermal sources.

The final output will be presented through an interactive GIS-based web application.

---

# 3. Proposed Solution

The system will continuously ingest thermal anomaly data and contextual geospatial data.

For every detected thermal anomaly, the system will:

1. Receive the FIRMS detection.
2. Store its geographic and temporal information.
3. Identify nearby industrial facilities using OSM.
4. Determine surrounding land-cover characteristics.
5. Analyze historical detections at the same location.
6. Calculate persistence and spatial characteristics.
7. Optionally extract satellite-image features around the event.
8. Pass the combined features to an ML classifier.
9. Classify the thermal event.
10. Generate a confidence score.
11. Store the prediction.
12. Display the result on an interactive GIS map.
13. Allow users to inspect historical activity and persistence.

---

# 4. Main Objectives

## 4.1 Primary Objectives

* Detect thermal anomalies using NASA FIRMS.
* Identify thermal anomalies associated with industrial infrastructure.
* Distinguish industrial fires from natural and agricultural fires.
* Identify persistent thermal sources.
* Classify thermal events using machine learning.
* Provide confidence scores for predictions.
* Visualize results using GIS.
* Provide historical and temporal analysis.
* Provide a scalable architecture for future monitoring.

## 4.2 Secondary Objectives

* Reduce false interpretation of satellite fire detections.
* Provide contextual information around each hotspot.
* Identify potentially abnormal industrial thermal activity.
* Enable filtering by event type, location and time.
* Support future alert-generation functionality.

---

# 5. Target Users

### Primary Users

* Disaster-management authorities
* Government monitoring agencies
* Environmental monitoring authorities
* Industrial safety teams
* Geospatial analysts

### Secondary Users

* Researchers
* Emergency-response teams
* Infrastructure monitoring organizations

---

# 6. Core Features

## Feature 1 — FIRMS Thermal Anomaly Ingestion

The system will ingest NASA FIRMS thermal anomaly data.

Important attributes include:

* latitude
* longitude
* acquisition date
* acquisition time
* confidence
* brightness temperature
* Fire Radiative Power (FRP)
* satellite/platform
* day/night information

---

## Feature 2 — Industrial Facility Mapping

The system will use OpenStreetMap data to identify nearby infrastructure such as:

* industrial plants
* refineries
* power plants
* mines
* factories
* fuel facilities
* LNG-related infrastructure
* storage facilities
* other industrial locations

The distance between each thermal event and nearby industrial facilities will be calculated.

---

## Feature 3 — Thermal Event Clustering

Multiple FIRMS detections close to one another will be grouped into an event/cluster.

Example:

```text
Hotspot A
Hotspot B
Hotspot C
Hotspot D
       ↓
Spatial clustering
       ↓
Industrial Thermal Event
```

This avoids treating every individual FIRMS point as a completely independent event.

---

## Feature 4 — Persistence Analysis

The system will determine whether thermal activity repeatedly occurs at approximately the same location.

Example:

```text
Day 1  ✓
Day 2  ✓
Day 3  ✓
Day 4  ✗
Day 5  ✓
Day 6  ✓
Day 7  ✓
```

A persistence score will be calculated using factors such as:

* detection frequency
* duration
* consecutive detections
* spatial stability
* FRP consistency

This helps identify persistent thermal sources such as industrial flaring.

---

# 7. Thermal Event Classification

The ML system will classify events into categories such as:

1. Industrial Fire
2. Persistent Industrial Thermal Source
3. Gas Flare
4. Wildfire / Forest Fire
5. Agricultural Fire
6. Mining/Industrial Activity
7. Other / Unknown

The exact class structure will be finalized after examining the available training data.

---

# 8. ML Prediction Output

Each prediction should contain:

```text
Event ID
Predicted Class
Confidence Score
Risk/Severity Score
Prediction Timestamp
Model Version
Supporting Features
```

Example:

```text
Event ID: EVT-10425
Class: Industrial Fire
Confidence: 91.7%
Persistence: Low
FRP: High
Nearest Facility: Oil Refinery
Distance: 0.42 km
Model Version: v1.0
```

---

# 9. GIS Dashboard

The web application will provide an interactive map.

The map will contain layers for:

* FIRMS thermal anomalies
* industrial facilities
* classified events
* persistent thermal sources
* fire clusters
* satellite imagery
* land-cover information

Users should be able to:

* zoom/pan
* search locations
* filter events
* click hotspots
* view event details
* view historical detections
* inspect persistence
* filter by date
* filter by event class

---

# 10. Event Details Page

Clicking a thermal event should display:

### Basic Information

* Event ID
* Latitude
* Longitude
* Date/time
* Satellite
* Confidence
* FRP
* Brightness temperature

### Geographic Context

* nearest industrial facility
* facility type
* distance
* surrounding land cover
* nearby roads/water/forest/etc.

### ML Information

* predicted class
* confidence
* important features
* model version

### Temporal Information

* first detection
* latest detection
* number of detections
* persistence score
* historical graph

---

# 11. Technology Stack

## Frontend

**React.js**

Recommended supporting libraries:

* React Router
* Axios
* Leaflet / React-Leaflet
* Recharts
* Tailwind CSS

### Why React?

The dashboard requires:

* dynamic maps
* filters
* real-time UI updates
* event details
* charts
* API integration

React is well suited for this.

---

# 12. Mapping Technology

### Primary Choice

**Leaflet + OpenStreetMap**

Advantages:

* open source
* lightweight
* easy React integration
* suitable for hotspot visualization
* supports markers, polygons, layers and clustering

For larger-scale geospatial visualization, MapLibre GL JS can also be considered.

---

# 13. Backend

**Node.js + Express.js**

Responsibilities:

* API endpoints
* authentication if required
* data retrieval
* event management
* GIS queries
* communication with ML service
* external API integration
* dashboard statistics

---

# 14. ML Service

**Python + FastAPI**

Python will be used only for the ML/geospatial-processing components.

Recommended libraries:

* Pandas
* NumPy
* Scikit-learn
* XGBoost
* GeoPandas
* Shapely
* Rasterio where required
* Joblib

Node.js will communicate with the Python ML service through REST APIs.

Example:

```text
React
  ↓
Node.js / Express
  ↓
Python / FastAPI
  ↓
ML Model
```

---

# 15. Database

### Recommended

**PostgreSQL + PostGIS**

This is preferable to a normal database because the project is fundamentally geospatial.

PostGIS allows:

* geographic coordinates
* spatial indexing
* distance queries
* intersection queries
* buffer operations
* spatial clustering
* geographic filtering

Example:

```text
Find all industrial facilities
within 5 km of a thermal anomaly.
```

This can be handled efficiently using PostGIS.

---

# 16. Data Storage

Use:

### PostgreSQL/PostGIS

For:

* thermal events
* industrial facilities
* predictions
* spatial relationships
* persistence records

### Object Storage

For:

* satellite imagery
* large raster files
* model files
* processed datasets

For the prototype, local storage can be used initially.

---

# 17. External Data Sources

## NASA FIRMS

Primary thermal anomaly source.

Used for:

* active fire detections
* thermal anomalies
* temporal observations
* FRP
* confidence

## OpenStreetMap

Used for:

* industrial facilities
* infrastructure
* geographic context

## Land-Cover Data

Used to determine whether the surrounding region is:

* forest
* agriculture
* urban
* industrial
* barren
* water
* etc.

## Satellite Imagery

Used for additional visual/spectral context.

Potential sources include Sentinel-2 and Landsat.

---

# 18. Overall Technology Stack

| Layer                 | Technology                    |
| --------------------- | ----------------------------- |
| Frontend              | React.js                      |
| Styling               | Tailwind CSS                  |
| Maps                  | Leaflet / React-Leaflet       |
| Charts                | Recharts                      |
| Backend               | Node.js                       |
| API                   | Express.js                    |
| ML API                | Python + FastAPI              |
| ML                    | Scikit-learn + XGBoost        |
| Geospatial Processing | GeoPandas + Shapely           |
| Database              | PostgreSQL                    |
| Spatial Database      | PostGIS                       |
| HTTP Client           | Axios                         |
| Containerization      | Docker                        |
| Version Control       | Git + GitHub                  |
| Deployment            | AWS / suitable cloud platform |
| Satellite Processing  | Python geospatial stack       |

---

# 19. Why AWS?

AWS can be used for deployment and scalable data processing.

Possible architecture:

```text
Frontend
   ↓
Cloud hosting
   ↓
Node.js API
   ↓
PostgreSQL + PostGIS
   ↓
Python ML Service
   ↓
Object Storage
```

For the SIH prototype, however, the team should avoid unnecessary AWS complexity. Build locally with Docker first and deploy after the system works.

---

# 20. Functional Requirements

### FR-01

System shall ingest FIRMS thermal anomaly data.

### FR-02

System shall store thermal anomaly observations.

### FR-03

System shall identify nearby industrial facilities.

### FR-04

System shall calculate geographic distances.

### FR-05

System shall cluster nearby thermal observations.

### FR-06

System shall calculate persistence metrics.

### FR-07

System shall generate ML predictions.

### FR-08

System shall provide classification confidence.

### FR-09

System shall display events on a GIS map.

### FR-10

System shall provide historical event information.

### FR-11

System shall allow filtering by date and class.

### FR-12

System shall provide event-level details.

---

# 21. Non-Functional Requirements

## Performance

* Map should load within a reasonable time.
* Spatial queries should use database indexes.
* ML prediction should return within seconds for an individual event.

## Scalability

The architecture should support increasing numbers of:

* thermal observations
* facilities
* satellite images
* users

## Reliability

Failed external-data requests should not crash the application.

## Security

* API keys must not be exposed to frontend users.
* Environment variables should store secrets.
* APIs should validate incoming requests.
* Database credentials must remain private.

## Maintainability

Frontend, backend and ML should remain independently deployable.

---

# 22. System Scope

## In Scope

* FIRMS integration
* industrial facility integration
* geospatial analysis
* thermal event clustering
* persistence analysis
* ML classification
* GIS visualization
* historical analysis
* API-based architecture

## Out of Scope for Initial Version

* physical fire prediction
* exact fire damage estimation
* automatic emergency dispatch
* direct control of industrial systems
* guaranteed real-time satellite imagery
* replacing government emergency systems

---

# 23. Success Criteria

The prototype should demonstrate:

1. Successful FIRMS data ingestion.
2. Successful industrial-facility mapping.
3. Correct spatial association.
4. Persistent-source detection.
5. ML-based classification.
6. GIS visualization.
7. Historical event analysis.
8. End-to-end functioning from data ingestion to dashboard.

ML performance should be evaluated using:

* Precision
* Recall
* F1-score
* Confusion Matrix
* Accuracy where appropriate

---

# 24. End-to-End User Workflow

```text
User opens dashboard
        ↓
Selects geographical region
        ↓
System loads thermal events
        ↓
User selects event
        ↓
System displays industrial/geographic context
        ↓
ML classification is displayed
        ↓
Persistence history is shown
        ↓
User can inspect satellite/context information
```

---

# 25. MVP

The first working version should contain:

* FIRMS ingestion
* PostgreSQL/PostGIS
* OSM facility data
* basic spatial association
* persistence calculation
* ML classifier
* Express API
* React GIS dashboard
* event details

Satellite-image deep learning should be considered **Phase 2**, not a blocker for the MVP.

---

# 26. Future Enhancements

* real-time/automated FIRMS ingestion
* satellite-image CNN/Transformer
* anomaly detection
* automated alerts
* email/SMS notifications
* advanced risk scoring
* historical trend analysis
* multi-satellite fusion
* explainable AI
* mobile application
* large-scale cloud deployment

---

# 27. Final Product

The final system will be a **web-based AI-powered geospatial monitoring platform** that converts raw satellite thermal detections into meaningful information:

```text
RAW THERMAL DETECTION
        ↓
GEOSPATIAL CONTEXT
        ↓
TEMPORAL/PERSISTENCE ANALYSIS
        ↓
AI CLASSIFICATION
        ↓
CONFIDENCE + SEVERITY
        ↓
GIS VISUALIZATION
        ↓
ACTIONABLE INFORMATION
```

The key value of the system is not simply detecting a hotspot. It is **understanding what the hotspot most likely represents and whether it is persistent or potentially abnormal.**
