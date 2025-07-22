import os
import json
import base64
from pathlib import Path
from typing import Dict, List, Optional
import cv2
import numpy as np
from ultralytics import YOLO

# Import configuration
from ..config import (
    YOLO_MODEL, DEFAULT_CONFIDENCE, COW_CLASS_ID
)

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
        raise Exception("Model not available")

    # Convert Path to string if needed
    image_path_str = str(image_path)

    # Load image
    image = cv2.imread(image_path_str)
    if image is None:
        raise Exception("Could not load image")

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


def save_uploaded_file(file_content: bytes, filename: str, images_dir: Path) -> Path:
    """Save uploaded file to images directory"""
    file_path = images_dir / filename
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    return file_path


def list_image_files(images_dir: Path) -> List[Dict]:
    """List all available image files"""
    images = []
    for file_path in images_dir.glob("*"):
        if file_path.is_file() and file_path.suffix.lower() in ['.jpg', '.jpeg', '.png']:
            images.append({
                "filename": file_path.name,
                "size": file_path.stat().st_size,
                "url": f"/images/{file_path.name}"
            })
    return images


def delete_image_file(filename: str, images_dir: Path) -> bool:
    """Delete an image file"""
    file_path = images_dir / filename
    if file_path.exists():
        file_path.unlink()
        return True
    return False


def save_detection_results_json(image_path, detections, output_dir="output"):
    """
    Save detection results as JSON for web interface.
    """
    # Convert image to base64 for web display
    with open(image_path, "rb") as img_file:
        img_base64 = base64.b64encode(img_file.read()).decode('utf-8')

    # Get actual image dimensions
    import cv2
    image = cv2.imread(image_path)
    original_height, original_width = image.shape[:2]

    # Prepare data for JSON
    results_data = {
        "image_name": os.path.basename(image_path),
        "image_base64": f"data:image/jpeg;base64,{img_base64}",
        "image_width": original_width,
        "image_height": original_height,
        "total_detections": len(detections),
        "detections": []
    }

    for i, detection in enumerate(detections):
        x1, y1, x2, y2 = detection['bbox']
        results_data["detections"].append({
            "id": i,
            "bbox": {
                "x1": int(x1),
                "y1": int(y1),
                "x2": int(x2),
                "y2": int(y2),
                "width": int(x2 - x1),
                "height": int(y2 - y1)
            },
            "confidence": float(detection['confidence']),
            "class_name": detection.get('class_name', 'cow'),
            "model": detection.get('model', 'yolo'),
            "size": (x2 - x1) * (y2 - y1),
            "is_cow": True,  # Default to true, user can unselect in web interface
            "verified": False  # User hasn't verified yet
        })

    # Save JSON file
    json_file = os.path.join(output_dir, "detection_results.json")
    with open(json_file, 'w') as f:
        json.dump(results_data, f, indent=2)

    print(f"💾 Detection results saved to {json_file}")
    return json_file
