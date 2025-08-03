"""
FastAPI router for cow detection endpoints.
"""
import base64
import io
from fastapi import APIRouter, HTTPException, Body

# Import schemas
from .schema import (
    AnalysisResponse
)

# Import services
from .service import (
    detect_cows_enhanced
)

# Import configuration
from ..config import IMAGES_DIR

router = APIRouter()

# Detection endpoints


@router.post("/detect", response_model=AnalysisResponse)
async def detect_cows_from_file(
    file_name: str = Body(..., description="Name of the image file to analyze"),
    file_content: str = Body(..., description="Base64 encoded image content"),
    detection_method: str = Body(
        "enhanced", description="Detection method to use: enhanced")
):
    """
    Detect cows in an image from base64 content.
    """

    try:
        # Decode base64 content
        try:
            image_data = base64.b64decode(file_content)
        except Exception as e:
            raise HTTPException(
                status_code=400, detail=f"Invalid base64 content: {str(e)}")

        # Save the decoded image
        file_path = IMAGES_DIR / file_name
        with open(file_path, "wb") as f:
            f.write(image_data)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"File processing failed: {str(e)}")

    try:
        file_path = IMAGES_DIR / file_name

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Image file not found")

        if detection_method == "enhanced":
            result = detect_cows_enhanced(file_path)
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