"""
Configuration settings for MooTrack FastAPI server.
Simple, environment-based configuration following KISS principle.
"""
import os
from pathlib import Path

# Server Configuration
HOST = os.getenv("MOOTRACK_HOST", "0.0.0.0")
PORT = int(os.getenv("MOOTRACK_PORT", "8000"))
RELOAD = os.getenv("MOOTRACK_RELOAD", "True").lower() == "true"

# Model Configuration
YOLO_MODEL = os.getenv("YOLO_MODEL", "yolov8m.pt")  # Options: yolov8n.pt, yolov8s.pt, yolov8m.pt
DEFAULT_CONFIDENCE = float(os.getenv("DEFAULT_CONFIDENCE", "0.3"))
MAX_CONFIDENCE = float(os.getenv("MAX_CONFIDENCE", "1.0"))
MIN_CONFIDENCE = float(os.getenv("MIN_CONFIDENCE", "0.01"))

# File Configuration
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10")) * 1024 * 1024  # 10MB default
ALLOWED_EXTENSIONS = os.getenv("ALLOWED_EXTENSIONS", ".jpg,.jpeg,.png").split(",")

# Directory Configuration
BASE_DIR = Path(__file__).parent
IMAGES_DIR = BASE_DIR / "cow_counter/images"
OUTPUT_DIR = BASE_DIR / "cow_counter/output"
UPLOADS_DIR = BASE_DIR / "cow_counter/uploads"

# CORS Configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# Logging Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "info")

# API Configuration
API_TITLE = "MooTrack API"
API_DESCRIPTION = "Simple cow detection API using YOLO"
API_VERSION = "1.0.0"

# Detection Classes (COCO dataset)
COW_CLASS_ID = 21
ANIMAL_CLASSES = {
    21: "cow",
    # Add other animal classes if needed in the future
    # 16: "dog",
    # 17: "horse", 
    # 18: "sheep",
    # 19: "cat"
}

def get_config_summary():
    """Return a summary of current configuration"""
    return {
        "server": {
            "host": HOST,
            "port": PORT,
            "reload": RELOAD
        },
        "model": {
            "yolo_model": YOLO_MODEL,
            "default_confidence": DEFAULT_CONFIDENCE,
            "confidence_range": [MIN_CONFIDENCE, MAX_CONFIDENCE]
        },
        "files": {
            "max_file_size_mb": MAX_FILE_SIZE // (1024 * 1024),
            "allowed_extensions": ALLOWED_EXTENSIONS,
            "images_dir": str(IMAGES_DIR),
            "output_dir": str(OUTPUT_DIR)
        },
        "cors": {
            "allowed_origins": CORS_ORIGINS
        }
    }
