# MooTrack AI Coding Instructions

## Project Overview
MooTrack is a cow detection system with a **two-service architecture**: a FastAPI backend with YOLO computer vision and a React frontend. The backend provides multiple detection algorithms while the frontend helps with the detections.

## Architecture & Service Boundaries

### Backend (`app/service/`)
- **FastAPI server** with modular router-based endpoints (`src/cow_counter/router.py`)
- **Three detection algorithms**: simple, enhanced (grid-based), and ultra-aggressive (multiple models)
- **Global YOLO model** loaded once at startup (`src/cow_counter/service.py::load_model()`)
- **Environment-based config** in `src/config.py` - use env vars like `YOLO_MODEL`, `DEFAULT_CONFIDENCE`
- **Static file serving** for uploaded images and detection results

### Frontend (`app/client/`)
- **Vite + React** with TailwindCSS and PWA support
- **API service layer** in `src/services/api.jsx` with JWT token handling
- **Component-based UI** with shadcn/ui patterns in `src/components/ui/`
- **Goal**: Provide and interface to interact with the uploaded images and detection results, not real time, just show the images that the user has uploaded and the results of the detection algorithms.

## Critical Workflows

### Development Setup
```bash
# Backend
cd app/service
pip install -r requirements.txt
python -m src.main  # Runs on port 8000

# Frontend  
cd app/client
npm install
npm run dev  # Runs on port 5173
```

### Model Management
- YOLO models are loaded globally and cached (`model: Optional[YOLO] = None`)
- Default is `yolov8n.pt` but supports multiple variants (s, m models)
- Models are downloaded automatically by ultralytics if not present

## Project-Specific Patterns

### Backend Conventions
- **Router pattern**: All endpoints in `cow_counter/router.py`, business logic in `service.py`
- **Config centralization**: All settings in `config.py` with env var fallbacks
- **Three-tier detection**: `detect_cows_simple()` → `enhanced_cow_detection()` → `detect_cows_aggressive()`
- **Grid analysis**: Enhanced detection uses 4x4 grid sectioning for better coverage
- **Results persistence**: Detection outputs saved as JSON in `OUTPUT_DIR`

### Frontend Conventions  
- **Component structure**: `MainApp.jsx` is the main dashboard, UI components in `components/ui/`
- **API abstraction**: Use `api.get/post/put/delete()` from `services/api.jsx` (handles auth headers)
- **Utility functions**: `lib/utils.js` has confidence formatting and bounding box scaling helpers
- **Colors**: Use TailwindCSS and CSS variables from index.css for consistent theming. Use hsl colors for dynamic theming (e.g., `hsl(var(--primary))`).

### Data Flow Patterns
- **Detection results**: `DetectionResult` schema with `bbox: [x1, y1, x2, y2]` format
- **File uploads**: Images stored in `IMAGES_DIR`, results in `OUTPUT_DIR`
- **Static serving**: FastAPI mounts `/images` and `/output` endpoints for file access

## Integration Points
- **CORS configured** for frontend-backend communication (`CORS_ORIGINS` in config)
- **JWT authentication** implemented in frontend API layer but not backend yet
- **File upload workflow**: `router.py::upload_and_detect()` → `service.py::save_uploaded_file()`
- **Real-time updates**: Frontend ready for WebSocket integration (currently using mock intervals)

## Key Files for Understanding
- `app/service/src/main.py` - FastAPI app initialization and middleware
- `app/service/src/cow_counter/service.py` - Core detection logic and model management  
- `app/client/src/components/MainApp.jsx` - Main UI dashboard with detection simulation
- `app/client/src/services/api.jsx` - HTTP client with authentication handling
- `app/service/src/config.py` - Centralized configuration with environment variables
