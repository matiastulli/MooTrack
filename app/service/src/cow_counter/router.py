"""
FastAPI router for cow detection endpoints.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Query

# Import schemas
from .schema import (
    AnalysisResponse
)

# Import services
from .service import (
    detect_cows_enhanced, detect_cows_ultra_aggressive,
    save_uploaded_file, load_model
)

# Import configuration
from ..config import IMAGES_DIR, OUTPUT_DIR

router = APIRouter()

# Detection endpoints


@router.post("/detect/file", response_model=AnalysisResponse)
async def detect_cows_from_file(
    filename: str = Query(...,
                          description="Name of the image file to analyze"),
    file_content: UploadFile = File(...),
    detection_method: str = Query(
        "enhanced", description="Detection method to use: enhanced, ultra")
):
    """
    Detect cows in an existing image file.
    """

    try:
        save_uploaded_file(file_content, filename, IMAGES_DIR)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"File upload failed: {str(e)}")

    try:
        file_path = IMAGES_DIR / filename

        # Create output directory named after the filename without extension
        # Get filename without extension
        filename_stem = filename.rsplit('.', 1)[0]
        output_directory = OUTPUT_DIR / filename_stem
        output_directory.mkdir(exist_ok=True)  # Ensure the directory exists

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Image file not found")

        if detection_method == "enhanced":
            result = detect_cows_enhanced(file_path, output_directory)
        elif detection_method == "ultra":
            result = detect_cows_ultra_aggressive(file_path, output_directory)
        else:
            raise HTTPException(
                status_code=400, detail="Invalid detection method specified")

        return AnalysisResponse(
            total_cows=result["total_cows"],
            detections=result["detections"],
            image_path=result["image_path"],
            analysis_complete=result["analysis_complete"],
            message=result["message"],
            method=result["method"]
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Detection failed: {str(e)}")


# Initialize model on module load
def initialize_model():
    """Initialize the YOLO model"""
    load_model()


# Call initialization
initialize_model()
