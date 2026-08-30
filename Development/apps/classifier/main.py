"""
AgniDrishti Classifier Service (D7 - AI/ML Integration)

FastAPI service that integrates Track A (natural vs. industrial classification)
and Track B (facility matching, industrial sub-classification, anomaly detection)
into a unified classification pipeline.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from pathlib import Path
import logging
import os

# Import integration modules
from track_a_integration import classify_with_track_a, TRACK_A_AVAILABLE
from track_b_integration import get_track_b_result
from merge_logic import merge_track_results

# Initialize FastAPI app
app = FastAPI(
    title="AgniDrishti Classifier Service",
    description="AI/ML classification service for thermal event detection",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  # Express backend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
_default_track_b = Path(__file__).parent / "data" / "sample" / "processed" / "track_b_b4_contract_ready.jsonl"
TRACK_B_CONTRACT_PATH = Path(os.getenv(
    "TRACK_B_CONTRACT_PATH",
    str(_default_track_b)
)).resolve()

logger.info(f"Track B contract path: {TRACK_B_CONTRACT_PATH}")


# =============================================================================
# Request/Response Models
# =============================================================================

class HotspotInput(BaseModel):
    """Input model for a single FIRMS hotspot requiring classification."""

    hotspot_id: str = Field(..., description="Unique hotspot identifier")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    brightness: float = Field(..., description="Brightness temperature (Kelvin)")
    frp: float = Field(..., description="Fire Radiative Power (MW)")
    acquisition_date: str = Field(..., description="ISO 8601 date")
    acquisition_time: str = Field(..., description="HH:MM format")
    instrument: str = Field(..., description="MODIS or VIIRS")
    daynight: str = Field(..., pattern="^[DN]$")
    confidence: Optional[str] = None


class ClassificationResult(BaseModel):
    """
    Output model conforming to shared_output_contract.schema.json

    This matches the 13-field contract that both Track A and Track B produce.
    """

    hotspot_id: str
    latitude: float
    longitude: float
    primary_class: Optional[str] = Field(None, pattern="^(industrial|natural)$")
    sub_class: Optional[str] = Field(
        None,
        pattern="^(industrial_fire|gas_flare|agricultural_burning|mining_activity|forest_fire|other_natural)$"
    )
    land_cover_type: Optional[str] = Field(
        None,
        pattern="^(forest|cropland|built_up|bare|grassland)$"
    )
    facility_id: Optional[str] = None
    distance_to_facility_m: Optional[float] = Field(None, ge=0)
    recurrence_count_90d: Optional[int] = Field(None, ge=0)
    z_score_frp: Optional[float] = None
    is_anomalous: Optional[bool] = None
    confidence_score: Optional[float] = Field(None, ge=0, le=1)
    model_version: str


class ClassifyBatchRequest(BaseModel):
    """Request model for batch classification."""
    hotspots: List[HotspotInput]


class ClassifyBatchResponse(BaseModel):
    """Response model for batch classification."""
    results: List[ClassificationResult]
    processed_count: int
    error_count: int
    errors: List[dict] = []


# =============================================================================
# Health Check
# =============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint for service monitoring."""
    return {
        "status": "healthy",
        "service": "agnidrishti-classifier",
        "version": "1.0.0",
        "track_b_available": TRACK_B_CONTRACT_PATH.exists()
    }


# =============================================================================
# Classification Endpoints
# =============================================================================

@app.post("/internal/classify", response_model=ClassifyBatchResponse)
async def classify_batch(request: ClassifyBatchRequest):
    """
    Classify a batch of FIRMS hotspots using Track A + Track B integration.

    This is the main D7 integration endpoint called by the Express backend
    after FIRMS ingestion.

    **Processing Pipeline:**
    1. For each hotspot, run Track A classification (natural vs. industrial)
    2. For each hotspot, lookup Track B results (facility matching & anomaly detection)
    3. Merge Track A + Track B results per priority rules
    4. Return unified classification results

    **Priority Rules:**
    - If Track B identifies a facility match (distance < 5km), use Track B sub_class
    - Otherwise, use Track A primary_class and sub_class
    - Always preserve Track A land_cover_type
    - Always preserve Track B facility/anomaly fields
    """

    logger.info(f"Received batch classification request for {len(request.hotspots)} hotspots")

    results = []
    errors = []

    for hotspot in request.hotspots:
        try:
            hotspot_dict = hotspot.model_dump()

            # Run Track A classification
            track_a_result = classify_with_track_a(hotspot_dict)

            # Lookup Track B result
            track_b_result = get_track_b_result(
                hotspot.hotspot_id,
                TRACK_B_CONTRACT_PATH
            )

            # Merge results
            merged = merge_track_results(
                hotspot_id=hotspot.hotspot_id,
                latitude=hotspot.latitude,
                longitude=hotspot.longitude,
                track_a_result=track_a_result,
                track_b_result=track_b_result
            )

            # Convert to Pydantic model
            result = ClassificationResult(**merged)
            results.append(result)

        except Exception as e:
            logger.error(f"Error classifying hotspot {hotspot.hotspot_id}: {e}", exc_info=True)
            errors.append({
                "hotspot_id": hotspot.hotspot_id,
                "error": str(e)
            })

    logger.info(f"Processed {len(results)} hotspots successfully, {len(errors)} errors")

    return ClassifyBatchResponse(
        results=results,
        processed_count=len(results),
        error_count=len(errors),
        errors=errors
    )


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": "AgniDrishti Classifier Service",
        "version": "1.0.0",
        "status": "active",
        "endpoints": {
            "health": "/health",
            "classify_batch": "/internal/classify"
        },
        "integration_status": {
            "track_a": "active" if TRACK_A_AVAILABLE else "unavailable",
            "track_b": "active" if TRACK_B_CONTRACT_PATH.exists() else "unavailable"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
