"""
FastAPI router for cow detection endpoints.
"""
import json
from pathlib import Path
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from fastapi.responses import JSONResponse

# Import schemas
from .schema import (
    DetectionResult, AnalysisResponse, HealthResponse,
    ImageListResponse, DeleteResponse
)

# Import services
from .service import (
    detect_cows_simple, detect_cows_enhanced, detect_cows_ultra_aggressive,
    save_uploaded_file, list_image_files, delete_image_file, load_model, model
)

# Import configuration
from ..config import IMAGES_DIR, OUTPUT_DIR

router = APIRouter()

# Detection endpoints


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
        raise HTTPException(
            status_code=500, detail=f"Detection failed: {str(e)}")


@router.post("/detect/enhanced", response_model=AnalysisResponse)
async def detect_cows_enhanced_endpoint(
    file: UploadFile = File(...),
    confidence: float = 0.3
):
    """
    Upload an image and detect cows using enhanced detection methods.
    """
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Save uploaded file
    file_content = await file.read()
    file_path = save_uploaded_file(file_content, file.filename, IMAGES_DIR)

    # Create output directory for this image
    image_output_dir = OUTPUT_DIR / file.filename.replace('.', '_')
    image_output_dir.mkdir(exist_ok=True)

    try:
        # Run enhanced detection
        result = detect_cows_enhanced(file_path, image_output_dir)

        # Save results to JSON file
        results_file = image_output_dir / "detection_results.json"
        with open(results_file, "w") as f:
            json.dump(result, f, indent=2)

        return AnalysisResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Enhanced detection failed: {str(e)}")


@router.post("/detect/ultra", response_model=AnalysisResponse)
async def detect_cows_ultra_endpoint(
    file: UploadFile = File(...),
    confidence: float = 0.1
):
    """
    Upload an image and detect cows using ultra-aggressive detection.
    """
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Save uploaded file
    file_content = await file.read()
    file_path = save_uploaded_file(file_content, file.filename, IMAGES_DIR)

    # Create output directory for this image
    image_output_dir = OUTPUT_DIR / file.filename.replace('.', '_')
    image_output_dir.mkdir(exist_ok=True)

    try:
        # Run ultra-aggressive detection
        result = detect_cows_ultra_aggressive(file_path, image_output_dir)

        # Save results to JSON file
        results_file = image_output_dir / "detection_results.json"
        with open(results_file, "w") as f:
            json.dump(result, f, indent=2)

        return AnalysisResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Ultra detection failed: {str(e)}")


@router.get("/detect/enhanced/{filename}", response_model=AnalysisResponse)
async def detect_cows_enhanced_from_file(
    filename: str,
    confidence: float = 0.3
):
    """
    Detect cows in an existing image file using enhanced methods.
    """
    file_path = IMAGES_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found")

    # Create output directory for this image
    image_output_dir = OUTPUT_DIR / filename.replace('.', '_')
    image_output_dir.mkdir(exist_ok=True)

    try:
        result = detect_cows_enhanced(file_path, image_output_dir)

        # Save results to JSON file
        results_file = image_output_dir / "detection_results.json"
        with open(results_file, "w") as f:
            json.dump(result, f, indent=2)

        return AnalysisResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Enhanced detection failed: {str(e)}")


@router.get("/detect/ultra/{filename}", response_model=AnalysisResponse)
async def detect_cows_ultra_from_file(
    filename: str,
    confidence: float = 0.1
):
    """
    Detect cows in an existing image file using ultra-aggressive methods.
    """
    file_path = IMAGES_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found")

    # Create output directory for this image
    image_output_dir = OUTPUT_DIR / filename.replace('.', '_')
    image_output_dir.mkdir(exist_ok=True)

    try:
        result = detect_cows_ultra_aggressive(file_path, image_output_dir)

        # Save results to JSON file
        results_file = image_output_dir / "detection_results.json"
        with open(results_file, "w") as f:
            json.dump(result, f, indent=2)

        return AnalysisResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Ultra detection failed: {str(e)}")


@router.get("/detect/compare/{filename}")
async def compare_detection_methods(filename: str):
    """
    Compare all three detection methods on the same image.
    """
    file_path = IMAGES_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found")

    # Create output directory for this image
    image_output_dir = OUTPUT_DIR / filename.replace('.', '_')
    image_output_dir.mkdir(exist_ok=True)

    try:
        # Run all three methods
        simple_result = detect_cows_simple(file_path, 0.3)
        enhanced_result = detect_cows_enhanced(file_path, image_output_dir)
        ultra_result = detect_cows_ultra_aggressive(file_path, image_output_dir)

        comparison = {
            "image_path": str(file_path),
            "methods": {
                "simple": {
                    "count": simple_result["total_cows"],
                    "detections": simple_result["detections"],
                    "message": simple_result["message"]
                },
                "enhanced": {
                    "count": enhanced_result["total_cows"],
                    "detections": enhanced_result["detections"],
                    "message": enhanced_result["message"]
                },
                "ultra": {
                    "count": ultra_result["total_cows"],
                    "detections": ultra_result["detections"],
                    "message": ultra_result["message"]
                }
            },
            "summary": {
                "best_method": max(
                    [("simple", simple_result["total_cows"]),
                     ("enhanced", enhanced_result["total_cows"]),
                     ("ultra", ultra_result["total_cows"])],
                    key=lambda x: x[1]
                )[0],
                "total_detections": {
                    "simple": simple_result["total_cows"],
                    "enhanced": enhanced_result["total_cows"],
                    "ultra": ultra_result["total_cows"]
                }
            }
        }

        # Save comparison results
        comparison_file = image_output_dir / "method_comparison.json"
        with open(comparison_file, "w") as f:
            json.dump(comparison, f, indent=2)

        return comparison

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Comparison failed: {str(e)}")


# Results endpoint


@router.get("/results/{filename}")
async def get_latest_results(filename: str):
    """
    Get the latest detection results.
    """
    results_file = OUTPUT_DIR / filename / "detection_results.json"

    if not results_file.exists():
        raise HTTPException(
            status_code=404, detail="No detection results found")

    try:
        with open(results_file, "r") as f:
            results = json.load(f)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error reading results: {str(e)}")


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
        raise HTTPException(
            status_code=500, detail=f"Error listing images: {str(e)}")


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
        raise HTTPException(
            status_code=500, detail=f"Error deleting image: {str(e)}")


# Initialize model on module load
def initialize_model():
    """Initialize the YOLO model"""
    load_model()


# Call initialization
initialize_model()
