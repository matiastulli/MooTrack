from pathlib import Path
from typing import Dict, Optional, Any
from ultralytics import YOLO
from fastapi import UploadFile

# Import configuration
from ..config import (
    YOLO_MODEL, COW_CLASS_ID
)

# Import enhanced detection functions
from .cow_counter_enhanced import enhanced_cow_detection

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


def detect_cows_enhanced(image_path: Path, output_dir: Path) -> Dict[str, Any]:
    """
    Enhanced cow detection using multiple models and techniques.
    """
    try:
        count, detections = enhanced_cow_detection(
            str(image_path), str(output_dir))

        # Convert detections to expected format
        formatted_detections = []
        for detection in detections:
            x1, y1, x2, y2 = detection['bbox']
            formatted_detections.append({
                "confidence": detection['confidence'],
                "bbox": [float(x1), float(y1), float(x2), float(y2)],
                "class_name": detection.get('class_name', 'cow'),
                "class_id": detection.get('class_id', COW_CLASS_ID),
                "model": detection.get('model', 'enhanced'),
                "size": detection.get('size', 0)
            })

        return {
            "total_cows": count,
            "detections": formatted_detections,
            "image_path": str(image_path),
            "analysis_complete": True,
            "message": f"Enhanced detection found {count} cows",
            "method": "enhanced"
        }

    except Exception as e:
        return {
            "total_cows": 0,
            "detections": [],
            "image_path": str(image_path),
            "analysis_complete": False,
            "message": f"Enhanced detection failed: {str(e)}",
            "method": "enhanced"
        }


def save_uploaded_file(file_content: UploadFile, filename: str, images_dir: Path) -> Path:
    """Save uploaded file to images directory"""
    file_path = images_dir / filename
    with open(file_path, "wb") as buffer:
        # Read the content from UploadFile object
        content = file_content.file.read()
        buffer.write(content)
        # Reset file pointer for potential future reads
        file_content.file.seek(0)
    return file_path

