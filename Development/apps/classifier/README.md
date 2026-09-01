# AgniDrishti Classifier Service

**Status:** ✅ D7 Implementation Complete (Placeholder Integration)

## Overview

FastAPI-based microservice that integrates Track A and Track B ML pipelines to produce unified thermal event classifications.

## Architecture

```
FIRMS Hotspot
     ↓
Track A Classification (natural vs. industrial)
     ↓
Track B Classification (facility matching, anomaly detection)
     ↓
Merge Logic (priority rules)
     ↓
Unified Classification Result
```

## Endpoints

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "agnidrishti-classifier",
  "version": "1.0.0"
}
```

### `POST /internal/classify`
Batch classification endpoint (called by Express backend).

**Request:**
```json
{
  "hotspots": [
    {
      "hotspot_id": "firms_abc123",
      "latitude": 8.86576,
      "longitude": 78.15621,
      "brightness": 350.5,
      "frp": 12.3,
      "acquisition_date": "2025-12-15",
      "acquisition_time": "14:30",
      "instrument": "VIIRS",
      "daynight": "D",
      "confidence": "nominal"
    }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "hotspot_id": "firms_abc123",
      "latitude": 8.86576,
      "longitude": 78.15621,
      "primary_class": "industrial",
      "sub_class": "gas_flare",
      "land_cover_type": "built_up",
      "facility_id": "osm_way_906827217",
      "distance_to_facility_m": 2213.943,
      "recurrence_count_90d": 20,
      "z_score_frp": -0.144,
      "is_anomalous": false,
      "confidence_score": 0.912,
      "model_version": "track_a:track_a_ml_v1.0+track_b:track_b_b3_rules_v1_rule_based"
    }
  ],
  "processed_count": 1,
  "error_count": 0,
  "errors": []
}
```

## Installation

### Prerequisites
- Python 3.10+
- pip

### Setup

```bash
cd apps/classifier

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Configuration

Copy `.env.example` to `.env` and configure paths:

```bash
cp .env.example .env
```

Required environment variables:
- `TRACK_A_MODEL_PATH` - Path to Track A model file (joblib)
- `TRACK_B_CONTRACT_PATH` - Path to Track B JSONL output
- `CLASSIFIER_PORT` - Service port (default: 8000)

## Running the Service

### Development Mode

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Integration Status

### ✅ Completed
- FastAPI service skeleton
- Request/response models (Pydantic)
- Health check endpoint
- Batch classification endpoint structure
- Track A integration module (placeholder)
- Track B integration module (JSONL loader)
- Merge logic module (priority rules)

### ⚠️ Pending Implementation
- **Track A Feature Engineering** - Needs actual WorldCover sampling, brightness/FRP normalization
- **Track A Model Loading** - Load actual `track_a_ml_v1_0.joblib` model
- **Real-time Track A Inference** - Replace placeholder with actual classify_track_a() call
- **Backend Integration** - Wire Express API to call `/internal/classify`

## D7 Implementation Notes

This is a **functional placeholder** implementation. The service:

1. ✅ **Accepts** FIRMS hotspot data via POST /internal/classify
2. ✅ **Returns** valid classification results conforming to the shared schema
3. ⚠️ **Does NOT** yet perform actual Track A ML inference (placeholder values)
4. ✅ **Loads** Track B pre-computed results from JSONL
5. ✅ **Merges** Track A + Track B per documented priority rules
6. ⚠️ **Requires** Track A feature engineering implementation

### Why Placeholder?

Track A classification requires:
- WorldCover raster sampling (4.6GB tiles, geospatial operations)
- Brightness/FRP normalization per instrument
- Neighborhood detection counts (spatial queries)
- Model loading (1.7MB joblib file)

These are complex dependencies that require:
1. User confirmation of Python environment capabilities
2. Verification that Track A module can be imported
3. Testing of raster sampling with actual WorldCover data

### Next Steps for Full D7

1. Test Track A import: `python -c "from track_a.a4.handoff import classify_track_a"`
2. Implement feature engineering in `track_a_integration.py`
3. Load Track A model in service initialization
4. Replace placeholder in `/internal/classify` with actual Track A calls
5. Wire Express backend to call classifier service
6. Test end-to-end classification flow

## Testing

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test classification (placeholder)
curl -X POST http://localhost:8000/internal/classify \
  -H "Content-Type: application/json" \
  -d '{
    "hotspots": [{
      "hotspot_id": "test_001",
      "latitude": 8.86,
      "longitude": 78.15,
      "brightness": 350.0,
      "frp": 12.0,
      "acquisition_date": "2025-12-15",
      "acquisition_time": "14:30",
      "instrument": "VIIRS",
      "daynight": "D"
    }]
  }'
```

## Dependencies

See `requirements.txt` for full dependency list:
- fastapi - Web framework
- uvicorn - ASGI server
- pydantic - Data validation
- scikit-learn - ML (Track A)
- geopandas - Geospatial (Track B)
- rasterio - Raster processing (Track A)

## License

Part of AgniDrishti
