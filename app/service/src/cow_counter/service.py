from pathlib import Path
from typing import Dict, Any

# Import configuration
from ..config import (
    COW_CLASS_ID
)

# Import ICAERUS-based detection functions
from .cow_counter_enhanced import analyze_image_and_count_cows


def detect_cows_enhanced(image_path: Path) -> Dict[str, Any]:
    """
    Enhanced cow detection using ICAERUS methodology for aerial imagery.
    """
    try:
        count, detections = analyze_image_and_count_cows(
            str(image_path))

        # Convert detections to expected format
        formatted_detections = []
        for detection in detections:
            x1, y1, x2, y2 = detection['bbox']
            formatted_detections.append({
                "confidence": detection['confidence'],
                "bbox": [float(x1), float(y1), float(x2), float(y2)],
                "class_name": detection.get('class_name', 'cow'),
                "class_id": detection.get('class_id', COW_CLASS_ID),
                "model": detection.get('model', 'inference'),
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
