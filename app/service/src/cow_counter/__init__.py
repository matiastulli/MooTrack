"""
Cow detection module for MooTrack.
"""

from .service import detect_cows_simple, load_model
from .router import router
from .schema import AnalysisResponse, DetectionResult, HealthResponse

__all__ = [
    'detect_cows_simple',
    'load_model', 
    'router',
    'AnalysisResponse',
    'DetectionResult',
    'HealthResponse'
]
