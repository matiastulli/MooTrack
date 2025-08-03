#!/usr/bin/env python3
"""
Simple FastAPI server for cow detection service.
KISS principle - no database, minimal dependencies, clean API.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Import configuration
from src.config import (
    API_TITLE, API_DESCRIPTION, API_VERSION,
    CORS_ORIGINS, IMAGES_DIR,
    get_config_summary
)

# Import the cow detection router
from src.cow_counter.router import router as cow_router

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

# Mount static files
if IMAGES_DIR.exists():
    app.mount("/images", StaticFiles(directory=str(IMAGES_DIR)), name="images")

# Include the cow detection router
app.include_router(cow_router, prefix="/cow-counter", tags=["cow-counter"])

# Legacy endpoints for backward compatibility


@app.get("/")
async def root():
    """Legacy root endpoint - redirects to new API"""
    return {"message": "MooTrack API is running", "api_docs": "/docs", "api_v1": "/api/v1/"}


@app.get("/health")
async def health():
    """Legacy health endpoint"""
    return {"status": "healthy", "message": "API is running"}


@app.get("/config")
async def get_config():
    """Legacy config endpoint"""
    return get_config_summary()

# Startup event


@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    print("🚀 Starting MooTrack API...")
    print("✅ MooTrack API ready!")

if __name__ == "__main__":
    import uvicorn
    from src.config import HOST, PORT, RELOAD
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=RELOAD,
        log_level="info"
    )
