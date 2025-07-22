"""
Pydantic models for cow detection API.
"""
from typing import List, Optional
from pydantic import BaseModel

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

class ImageInfo(BaseModel):
    filename: str
    size: int
    url: str

class ImageListResponse(BaseModel):
    images: List[ImageInfo]

class DeleteResponse(BaseModel):
    message: str
