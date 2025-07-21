# AI 피부 분석기 2025 🎯

> 2025년 최신 AI 기술을 활용한 실시간 피부 분석 웹 애플리케이션

FastAPI 백엔드와 React 프론트엔드를 기반으로 한 고성능 피부 분석 시스템으로, 실시간 얼굴 인식, 고급 피부 분석, 개인 맞춤형 스킨케어 제품 추천을 제공합니다.

## 📚 목차
- [프로젝트 개요](#-프로젝트-개요)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [설치 및 실행](#-설치-및-실행)
- [API 명세](#-api-명세)
- [AI 모델 상세](#-ai-모델-상세)
- [테스트](#-테스트)
- [환경 변수](#-환경-변수)

## 🚀 프로젝트 개요

AI 기반 실시간 피부 분석 웹 애플리케이션으로, 사용자의 얼굴 사진을 분석하여 피부 타입, 수분도, 유분도, 잡티 등을 진단하고 개인 맞춤형 스킨케어 제품을 추천합니다.

## 💡 주요 기능

1. **실시간 얼굴 인식 및 촬영**
   - OpenCV 기반 실시간 얼굴 감지 및 인식
   - 자동 품질 검사 및 카운트다운 촬영
   - 스마트 카메라 컨트롤

2. **고급 피부 분석**
   - **수분도/유분도**: OpenCV 기반 피부 텍스처 및 색상 분석 알고리즘
   - **여드름 감지**: Roboflow API 클라우드 기반 객체 감지 (신뢰도 점수 포함)
   - **연령 분석**: ViT(Vision Transformer) 모델 + OpenCV 기반 폴백 알고리즘
   - **피부톤 분석**: LAB 색공간 기반 ITA(Individual Typology Angle) 계산
   - **주름 분석**: Canny 엣지 검출 및 텍스처 분산 계산
   - **종합 점수**: 가중치 기반 AI 알고리즘

3. **OpenAI 기반 전문
   - OpenCV 수집 데이터를 OpenAI API로 전송하여 전문가급 피드백 생성
   - 피부 나이 예측 및 민감도 분석가 피드백**
   - 개인 맞춤형 관리 방법 및 제품 구매 고려사항 제공
   - 피부톤 팔레트 분석 및 상세 진단

4. **실시간 제품 추천**
   - OpenAI 추천 제품을 Hwahae에서 실시간 검색 및 매칭
   - 세션 기반 이미지 다운로드 및 자동 정리
   - 타임아웃 처리 및 폴백 메커니즘

## 🛠 기술 스택

### Backend
- **FastAPI**: 고성능 비동기 API 서버
- **OpenCV**: 이미지 처리 및 얼굴 감지/인식
- **NumPy/SciPy**: 수치 연산 및 이미지 분석
- **PyTorch**: 딥러닝 모델 실행
- **Roboflow API**: 클라우드 기반 여드름 객체 감지
- **Transformers**: AI 모델 통합
- **LangChain/LangGraph**: Multi-agent AI 워크플로우
- **OpenAI API**: GPT 기반 분석 및 추천
- **BeautifulSoup4**: 웹 스크래핑 (Hwahae 제품 데이터)
- **aiohttp/aiofiles**: 비동기 HTTP 및 파일 처리

### Frontend
- **React 18**: UI 컴포넌트 및 상태 관리
- **React Scripts**: Create React App 기반 빌드
- **TailwindCSS**: 반응형 디자인
- **Lucide React**: 모던 아이콘 시스템
- **MediaPipe**: 브라우저 기반 얼굴 감지 (프론트엔드)

### AI 모델 및 분석 알고리즘
- **Roboflow 여드름 감지 모델**: 클라우드 기반 객체 감지 API (신뢰도 15%, 겹침 45%)
- **ViT Age Classifier**: Vision Transformer 기반 연령 분류 (`nateraw/vit-age-classifier`)
- **OpenCV 피부 분석**: 
  - Haar Cascade 얼굴 감지
  - LAB 색공간 기반 피부톤 분석 (ITA 계산)
  - Canny 엣지 검출 기반 주름 분석
  - 텍스처 분산 계산 (수분도/유분도)
  - Harris Corner Detection 패턴 분석
- **OpenAI GPT-4o-mini**: 전문가 피드백 및 피부 나이 예측

## 📂 프로젝트 구조

```
miniproject-son1/
├── backend/                     # FastAPI 백엔드
│   ├── api/                     # API 라우팅
│   │   ├── middleware.py        # CORS 및 미들웨어
│   │   └── routes/             # API 엔드포인트
│   │       ├── analysis.py     # 피부 분석 API
│   │       └── health.py       # 헬스 체크
│   ├── core/                   # 핵심 설정
│   │   ├── config.py           # 애플리케이션 설정
│   │   ├── dependencies.py     # 의존성 주입
│   │   └── exceptions.py       # 예외 처리
│   ├── models/                 # 데이터 모델
│   │   ├── analysis_result.py  # 분석 결과 모델
│   │   └── schemas.py          # Pydantic 스키마
│   ├── services/               # 비즈니스 로직
│   │   ├── acne_detection.py   # 여드름 감지 서비스
│   │   ├── age_analysis.py     # 연령 분석 서비스
│   │   ├── face_detection.py   # 얼굴 감지 서비스
│   │   ├── image_processing.py # 이미지 처리 서비스
│   │   └── skin_analyzer.py    # 피부 분석 엔진
│   ├── utils/                  # 유틸리티
│   │   ├── image_utils.py      # 이미지 유틸
│   │   ├── logging_config.py   # 로깅 설정
│   │   └── math_utils.py       # 수학 계산
│   ├── hwahae_scraper.py       # 제품 추천 스크래핑
│   ├── langchain_integration.py # LangChain AI 워크플로우
│   ├── main.py                 # FastAPI 앱 진입점
│   ├── requirements.txt        # Python 의존성
│   └── test_*.py              # 테스트 파일들
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   ├── components/         # React 컴포넌트
│   │   │   ├── SkinAnalyzer2025.jsx      # 메인 분석기
│   │   │   ├── SmartCamera.jsx           # 카메라 컨트롤
│   │   │   ├── AdvancedSkinAnalyzer.jsx  # 고급 분석
│   │   │   ├── AcneMarker.jsx            # 여드름 마커
│   │   │   ├── SkinAnalysisEngine.jsx    # 분석 엔진
│   │   │   └── SkinChatBot.jsx           # AI 챗봇
│   │   ├── App.jsx             # 메인 앱 컴포넌트
│   │   └── index.js            # 앱 진입점
│   ├── package.json            # Node.js 의존성
│   └── vite.config.js          # Vite 설정
├── model/                      # AI 모델 파일
│   ├── yolov8m-acnedetect-best.pt      # 백업 로컬 모델 (사용하지 않음)
│   └── blaze_face_short_range.tflite   # BlazeFace 모델 (브라우저용)
├── CLAUDE.md                   # Claude 가이드라인
├── README.md                   # 프로젝트 문서
└── SETUP_GUIDE.md             # 설정 가이드
```

## 📡 API 명세

### 1. 기본 엔드포인트
- **GET /** - API 정보 및 상태
- **GET /health** - 서버 상태 확인

### 2. 분석 엔드포인트
- **POST /analyze-skin-base64**
  ```json
  {
    "image": "base64_encoded_image_string"
  }
  ```
  응답:
  ```json
  {
    "success": true,
    "analysis_method": "2025년 최신 AI 기반 분석",
    "result": {
      "skin_type": "string",
      "moisture_level": 0-100,
      "oil_level": 0-100,
      "blemish_count": number,
      "skin_tone": "string",
      "wrinkle_level": 1-5,
      "age_range": "string",
      "confidence": 0.0-1.0
    }
  }
  ```


## 🔍 주요 함수 설명

### Backend

#### 1. ModernSkinAnalyzer 클래스
- `analyze_image(image)`: 메인 분석 파이프라인
- `detect_face(image)`: 얼굴 감지 처리
- `analyze_skin_advanced_2025(image, parsing_result)`: 피부 분석
- `analyze_age_2025(face_image)`: 연령대 분석

#### 2. 이미지 처리 함수
- `preprocess_image_2025(image)`: 이미지 전처리
- `enhanced_skin_detection(image)`: 고급 피부 감지
- `detect_blemishes_ai_2025(image, mask)`: 잡티 감지

### Frontend

#### 1. SkinAnalyzer2025 컴포넌트
- `checkFaceDetection()`: 실시간 얼굴 감지
- `capturePhoto()`: 고화질 사진 촬영
- `analyzeSkin()`: API 호출 및 결과 처리

#### 2. 카메라 관련 함수
- `startCamera()`: 웹캠 초기화
- `handleFileUpload()`: 이미지 업로드 처리
- `startCountDown()`: 자동 촬영 카운트다운

## 📦 설치 및 실행

### Backend 설정
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py  # 또는 uvicorn main:app --reload
```

### Frontend 설정
```bash
cd frontend
npm install
npm start  # React 개발 서버 (포트 3000)
npm run build  # 프로덕션 빌드
npm test  # 테스트 실행
```

### 서버 정보
- **Backend**: FastAPI 서버 (기본 포트 8000)
- **Frontend**: React 개발 서버 (포트 3000, 백엔드 프록시 설정됨)
- **Proxy**: `http://127.0.0.1:8000`으로 API 요청 자동 전달

## 🧪 테스트

### Backend 테스트
```bash
cd backend
python test_api.py              # 메인 API 엔드포인트 테스트
python test_face_detection.py   # 얼굴 감지 정확도 테스트
python test_hwahae_search.py    # 제품 검색 기능 테스트
python test_integration.py      # 통합 테스트
```

### Frontend 테스트
```bash
cd frontend
npm test  # React Testing Library 기반 컴포넌트 테스트
```

### 수동 테스트 권장 항목
- 카메라 기능 및 MediaPipe 통합
- 실시간 얼굴 감지 성능
- 동시 이미지 분석 및 제품 스크래핑 부하 테스트

## 🔧 환경 변수

```bash
# 선택사항 - LangChain 기능을 위한 OpenAI API
OPENAI_API_KEY=your_openai_api_key

# 선택사항 - 향상된 분석을 위한 Nyckel API  
NYCKEL_API_KEY=your_nyckel_api_key

# Roboflow API 설정 (여드름 감지용)
ROBOFLOW_API_KEY=your_roboflow_api_key
ROBOFLOW_WORKSPACE=your_workspace_name
ROBOFLOW_PROJECT=your_project_name
ROBOFLOW_VERSION=1
```

## 🔐 보안 및 최적화

1. **데이터 보안**
   - 이미지 데이터 즉시 삭제
   - CORS 보안 설정
   - API 요청 제한

2. **성능 최적화**
   - 이미지 압축 및 전처리
   - 비동기 처리
   - 캐시 시스템

## 👥 기여 방법

1. Fork the Project
2. Create your Feature Branch
3. Commit your Changes
4. Push to the Branch
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스로 배포됩니다.

---

## 🌟 버전 기록

- v3.0.0 (2025) - 최신 AI 모델 통합
- v2.0.0 (2024) - 실시간 분석 추가
- v1.0.0 (2023) - 초기 버전 출시