"""
Cow detection module for MooTrack.
"""

from .router import router
from .schema import AnalysisResponse, DetectionResult

__all__ = [
    'load_model', 
    'router',
    'AnalysisResponse',
    'DetectionResult'
]
