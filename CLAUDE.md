# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered skin analysis web application with a React frontend and FastAPI backend that provides real-time facial recognition, advanced skin analysis, and personalized skincare product recommendations.

## Commands

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py  # or uvicorn main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm start  # Development server on port 3000 (uses Vite)
npm run build  # Production build
npm test  # Run tests
```

### Testing Backend
```bash
cd backend
python test_api.py  # Test main API endpoints
python test_face_detection.py  # Test face detection
python test_hwahae_search.py  # Test product search
python test_integration.py  # Integration tests
```

## Architecture

### Backend Structure
- **main.py**: FastAPI server with ModernSkinAnalyzer class and skin analysis endpoints
- **hwahae_scraper.py**: HwahaeProductScraper class for real-time product recommendation scraping
- **langchain_integration.py**: LangChain multi-agent workflow with StateGraph and master-slave architecture
- **test_*.py**: Comprehensive test modules for API, face detection, integration, and product search

### Frontend Structure (React 18 + Vite)
- **App.jsx**: Main app entry point, renders SkinAnalyzer2025
- **components/SkinAnalyzer2025.jsx**: Main skin analysis interface with ProductCard components
- **components/SmartCamera.jsx**: Real-time camera controls with MediaPipe integration
- **components/AdvancedSkinAnalyzer.jsx**: Advanced analysis features
- **components/AcneMarker.jsx**: Acne detection visualization with confidence scoring
- **components/SkinAnalysisEngine.jsx**: Analysis processing engine
- **components/SkinChatBot.jsx**: AI chatbot for skin consultations

### Key Technologies
- **Backend**: FastAPI, OpenCV, NumPy, PyTorch, YOLOv8 (Ultralytics), OpenAI API, LangChain/LangGraph, Transformers (ViT), BeautifulSoup4
- **Frontend**: React 18, TailwindCSS, Lucide React, Vite (build tool)
- **AI Models**: YOLOv8 for acne detection (`yolov8m-acnedetect-best.pt`), BlazeFace for face detection (`blaze_face_short_range.tflite`), ViT for age classification

### Core Features
1. **Real-time Face Detection**: 60fps face tracking with MediaPipe and YOLO models
2. **Smart Camera Control**: Auto-quality check and countdown photography
3. **Multi-Agent Analysis**: LangChain-powered master-slave workflow using LangGraph StateGraph
4. **Acne Detection**: Medical-grade visualization with confidence scoring using YOLOv8
5. **Skin Analysis**: 6-parameter analysis (moisture, oil, blemishes, tone, wrinkles, age)
6. **Product Recommendations**: Real-time integration with Hwahae product database scraping

## API Endpoints

### Main Analysis
- `POST /analyze-skin-base64`: Base64 image analysis with ModernSkinAnalyzer
- `GET /health`: Server health check
- `GET /`: API information
- `/temp-image/{filename}`: Temporary image serving endpoint

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_api_key  # Optional for LangChain features
NYCKEL_API_KEY=your_nyckel_api_key  # Optional for enhanced analysis
```

## Development Notes

- Backend server runs on port 8000 by default (FastAPI with uvicorn)
- Frontend uses Vite dev server on port 3000 with proxy to `http://127.0.0.1:8000`
- Temporary images stored in `backend/temp_images/` with automatic cleanup
- System supports both basic analysis and LangChain multi-agent modes
- AI models located in `model/` directory: YOLOv8 (.pt) and TensorFlow Lite (.tflite)
- Async image processing with aiohttp and aiofiles for performance
- Real-time product scraping with session management and rate limiting

## Key Classes and Functions

### Backend
- `ModernSkinAnalyzer`: Main analysis class with methods like `analyze_image()`, `detect_face()`, `analyze_skin_advanced_2025()`
- `HwahaeProductScraper`: Product scraping with async methods and timeout handling
- `download_and_save_image()`: Async image downloading with session management
- `cleanup_session_images()`: Temporary file cleanup by session ID

### Frontend  
- `SkinAnalyzer2025`: Main component with camera integration and analysis UI
- `ProductCard`: Reusable component for product recommendations display
- Camera-related functions: `startCamera()`, `capturePhoto()`, `analyzeSkin()`

## Testing Strategy

- Backend: Multiple test files covering API endpoints, face detection accuracy, integration workflows, and product search functionality
- Frontend: React Testing Library (via react-scripts) for component testing
- Manual testing recommended for camera functionality, MediaPipe integration, and real-time features
- Load testing for concurrent image analysis and product scraping