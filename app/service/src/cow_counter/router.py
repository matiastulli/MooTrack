"""
FastAPI router for cow detection endpoints.
"""
import json
from pathlib import Path
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.responses import JSONResponse

# Import schemas
from .schema import (
    DetectionResult, AnalysisResponse, HealthResponse, 
    ImageListResponse, DeleteResponse
)

# Import services
from .service import (
    detect_cows_simple, save_uploaded_file, list_image_files, 
    delete_image_file, load_model, model
)

# Import configuration
from ..config import IMAGES_DIR, OUTPUT_DIR

# Create router
router = APIRouter(prefix="/api/v1", tags=["cow-detection"])

# Health endpoints
@router.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="MooTrack API is running"
    )

@router.get("/health", response_model=HealthResponse)
async def health():
    """Detailed health check"""
    model_status = "loaded" if model else "not loaded"
    return HealthResponse(
        status="healthy",
        message=f"API is running, YOLO model: {model_status}"
    )

# Detection endpoints
@router.post("/detect", response_model=AnalysisResponse)
async def detect_cows(
    file: UploadFile = File(...),
    confidence: float = 0.3
):
    """
    Upload an image and detect cows in it.
    """
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Save uploaded file
    file_content = await file.read()
    file_path = save_uploaded_file(file_content, file.filename, IMAGES_DIR)
    
    try:
        # Run detection
        result = detect_cows_simple(file_path, confidence)
        
        # Save results to JSON file
        results_file = OUTPUT_DIR / "detection_results.json"
        with open(results_file, "w") as f:
            json.dump(result, f, indent=2)
        
        return AnalysisResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@router.get("/detect/file/{filename}", response_model=AnalysisResponse)
async def detect_cows_from_file(
    filename: str,
    confidence: float = 0.3
):
    """
    Detect cows in an existing image file.
    """
    file_path = IMAGES_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found")
    
    try:
        result = detect_cows_simple(file_path, confidence)
        
        # Save results to JSON file
        results_file = OUTPUT_DIR / "detection_results.json"
        with open(results_file, "w") as f:
            json.dump(result, f, indent=2)
        
        return AnalysisResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

# Results endpoint
@router.get("/results")
async def get_latest_results():
    """
    Get the latest detection results.
    """
    results_file = OUTPUT_DIR / "detection_results.json"
    
    if not results_file.exists():
        raise HTTPException(status_code=404, detail="No detection results found")
    
    try:
        with open(results_file, "r") as f:
            results = json.load(f)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading results: {str(e)}")

# Image management endpoints
@router.get("/images", response_model=ImageListResponse)
async def list_images():
    """
    List all available images.
    """
    try:
        images = list_image_files(IMAGES_DIR)
        return ImageListResponse(images=images)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing images: {str(e)}")

@router.delete("/images/{filename}", response_model=DeleteResponse)
async def delete_image(filename: str):
    """
    Delete an image file.
    """
    try:
        success = delete_image_file(filename, IMAGES_DIR)
        if success:
            return DeleteResponse(message=f"Image {filename} deleted successfully")
        else:
            raise HTTPException(status_code=404, detail="Image file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting image: {str(e)}")

# Configuration endpoint
@router.get("/config")
async def get_config():
    """Get current configuration"""
    from ..config import get_config_summary
    return get_config_summary()

# Initialize model on module load
def initialize_model():
    """Initialize the YOLO model"""
    load_model()

# Call initialization
initialize_model()
