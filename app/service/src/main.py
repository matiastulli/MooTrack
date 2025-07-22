#!/usr/bin/env python3
"""
Simple FastAPI server for cow detection service.
KISS principle - no database, minimal dependencies, clean API.
"""
import os
import json
from pathlib import Path
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import cv2
import numpy as np
from ultralytics import YOLO

# Import configuration
from config import (
    API_TITLE, API_DESCRIPTION, API_VERSION,
    CORS_ORIGINS, IMAGES_DIR, OUTPUT_DIR,
    YOLO_MODEL, DEFAULT_CONFIDENCE, COW_CLASS_ID,
    get_config_summary
)

# Initialize FastAPI app
app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories
IMAGES_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# Mount static files
if IMAGES_DIR.exists():
    app.mount("/images", StaticFiles(directory=str(IMAGES_DIR)), name="images")
if OUTPUT_DIR.exists():
    app.mount("/output", StaticFiles(directory=str(OUTPUT_DIR)), name="output")

# Pydantic models
class DetectionResult(BaseModel):
    confidence: float
    bbox: List[float]  # [x1, y1, x2, y2]
    class_name: str
    class_id: int

class AnalysisResponse(BaseModel):
    total_cows: int
    detections: List[DetectionResult]
    image_path: str
    analysis_complete: bool
    message: str

class HealthResponse(BaseModel):
    status: str
    message: str

# Global variable to store the YOLO model (loaded once)
model: Optional[YOLO] = None

def load_model():
    """Load YOLO model once at startup"""
    global model
    if model is None:
        try:
            model = YOLO(YOLO_MODEL)
            print(f"✅ YOLO model {YOLO_MODEL} loaded successfully")
        except Exception as e:
            print(f"❌ Error loading YOLO model: {e}")
            model = None
    return model

def detect_cows_simple(image_path, confidence_threshold: float = DEFAULT_CONFIDENCE):
    """
    Simple cow detection using YOLO.
    Returns detection results in a clean format.
    """
    if not load_model():
        raise HTTPException(status_code=500, detail="Model not available")
    
    # Convert Path to string if needed
    image_path_str = str(image_path)
    
    # Load image
    image = cv2.imread(image_path_str)
    if image is None:
        raise HTTPException(status_code=400, detail="Could not load image")
    
    # Run detection
    results = model(image, conf=confidence_threshold, verbose=False)
    
    detections = []
    cow_count = 0
    
    for r in results:
        if r.boxes is not None:
            for box in r.boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                
                # Only detect cows (class 21 in COCO dataset)
                if class_id == COW_CLASS_ID:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    
                    detections.append({
                        "confidence": confidence,
                        "bbox": [x1, y1, x2, y2],
                        "class_name": "cow",
                        "class_id": class_id
                    })
                    cow_count += 1
    
    return {
        "total_cows": cow_count,
        "detections": detections,
        "image_path": image_path_str,
        "analysis_complete": True,
        "message": f"Found {cow_count} cows with confidence >= {confidence_threshold}"
    }

# API Routes
@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="MooTrack API is running"
    )

@app.get("/health", response_model=HealthResponse)
async def health():
    """Detailed health check"""
    model_status = "loaded" if model else "not loaded"
    return HealthResponse(
        status="healthy",
        message=f"API is running, YOLO model: {model_status}"
    )

@app.get("/config")
async def get_config():
    """Get current configuration"""
    return get_config_summary()

@app.post("/detect", response_model=AnalysisResponse)
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
    file_path = IMAGES_DIR / file.filename
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
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

@app.get("/detect/file/{filename}", response_model=AnalysisResponse)
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

@app.get("/results")
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

@app.get("/images")
async def list_images():
    """
    List all available images.
    """
    try:
        images = []
        for file_path in IMAGES_DIR.glob("*"):
            if file_path.is_file() and file_path.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                images.append({
                    "filename": file_path.name,
                    "size": file_path.stat().st_size,
                    "url": f"/images/{file_path.name}"
                })
        return {"images": images}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing images: {str(e)}")

@app.delete("/images/{filename}")
async def delete_image(filename: str):
    """
    Delete an image file.
    """
    file_path = IMAGES_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found")
    
    try:
        file_path.unlink()
        return {"message": f"Image {filename} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting image: {str(e)}")

# Startup event
@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    print("🚀 Starting MooTrack API...")
    load_model()
    print("✅ MooTrack API ready!")

if __name__ == "__main__":
    import uvicorn
    from config import HOST, PORT, RELOAD
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=RELOAD,
        log_level="info"
    )
