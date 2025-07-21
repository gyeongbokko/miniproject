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
npm start  # Development server on port 3000
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
- **main.py**: FastAPI server with skin analysis endpoints
- **hwahae_scraper.py**: Product recommendation scraper for Hwahae
- **langchain_integration.py**: LangChain multi-agent workflow integration
- **test_*.py**: Various test modules for different functionalities

### Frontend Structure
- **App.jsx**: Main app entry point, renders SkinAnalyzer2025
- **components/SkinAnalyzer2025.jsx**: Main skin analysis interface
- **components/SmartCamera.jsx**: Real-time camera controls with MediaPipe
- **components/AdvancedSkinAnalyzer.jsx**: Advanced analysis features
- **components/AcneMarker.jsx**: Acne detection visualization
- **components/SkinAnalysisEngine.jsx**: Analysis processing engine
- **components/SkinChatBot.jsx**: AI chatbot for skin consultations

### Key Technologies
- **Backend**: FastAPI, OpenCV, NumPy, PyTorch, YOLO, OpenAI API, LangChain
- **Frontend**: React 18, TailwindCSS, Lucide React, WebRTC, MediaPipe
- **AI Models**: YOLOv8 for face detection, ViT for age classification, custom skin analysis

### Core Features
1. **Real-time Face Detection**: 60fps face tracking with MediaPipe
2. **Smart Camera Control**: Auto-quality check and countdown photography
3. **Multi-Agent Analysis**: LangChain-powered master-slave workflow
4. **Acne Detection**: Medical-grade visualization with confidence scoring
5. **Skin Analysis**: 6-parameter analysis (moisture, oil, blemishes, tone, wrinkles, age)
6. **Product Recommendations**: Integration with Hwahae product database

## API Endpoints

### Main Analysis
- `POST /analyze-skin-base64`: Base64 image analysis
- `GET /health`: Server health check
- `GET /`: API information

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_api_key  # Optional for LangChain features
NYCKEL_API_KEY=your_nyckel_api_key  # Optional for enhanced analysis
```

## Development Notes

- The backend server runs on port 8000 by default
- Frontend proxy is configured to point to `http://127.0.0.1:8000`
- Temporary images are stored in `backend/temp_images/` and auto-cleaned
- The system supports both basic analysis and LangChain multi-agent modes
- AI models are located in the `model/` directory (YOLO and TensorFlow Lite)

## Testing Strategy

- Backend: Multiple test files covering API, face detection, integration, and product search
- Frontend: Uses React Testing Library (via react-scripts)
- Manual testing recommended for camera functionality and real-time features