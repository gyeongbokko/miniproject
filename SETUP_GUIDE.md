# 🚀 얼굴 출입 서비스급 피부 분석 시스템 설치 가이드

## 📋 시스템 개요

본 시스템은 다음과 같은 고도화된 기능을 제공합니다:

### ✨ 핵심 기능
- 🎯 **실시간 얼굴 추적**: MediaPipe 기반 60fps 얼굴 감지
- 📸 **스마트 카메라**: 자동 품질 검사 및 카운트다운 촬영
- 🔍 **정밀 여드름 마킹**: 의료진 수준의 시각화 시스템
- 🧠 **LangChain 멀티에이전트**: 마스터-슬레이브 분석 구조
- 📊 **다중 피부 분석**: 수분도/유분도/모공/색소침착 히트맵

### 🏗 시스템 구조
```
Master Agent (LangGraph)
├── MediaPipe Slave (얼굴 감지)
├── Face-API.js Slave (감정/나이/성별)
├── Nyckel API Slave (피부 상태)
└── OpenCV Slave (이미지 전처리)
```

## 🛠 설치 단계

### 1. 백엔드 설정

```bash
cd backend

# 기본 패키지 설치
pip install fastapi uvicorn python-multipart
pip install opencv-python pillow numpy scipy scikit-learn
pip install torch torchvision torchaudio
pip install transformers ultralytics
pip install python-dotenv aiohttp

# MediaPipe 설치
pip install mediapipe

# LangChain/LangGraph 설치 (선택사항)
pip install langchain langsmith langgraph
pip install langchain-openai langchain-core
pip install pydantic
```

### 2. 프론트엔드 설정

```bash
cd frontend

# Node.js 패키지 설치
npm install

# MediaPipe 웹 패키지 설치
npm install @mediapipe/face_detection @mediapipe/camera_utils
npm install @mediapipe/face_mesh

# 추가 UI 라이브러리
npm install lucide-react
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 다음을 추가:

```env
# OpenAI API (선택사항 - LangChain 기능용)
OPENAI_API_KEY=your_openai_api_key_here

# Nyckel API (선택사항 - 무료 티어 사용 가능)
NYCKEL_API_KEY=your_nyckel_api_key_here
```

## 🚀 실행 방법

### 1. 백엔드 실행
```bash
cd backend
python main.py
```
서버가 http://localhost:8000 에서 실행됩니다.

### 2. 프론트엔드 실행
```bash
cd frontend
npm run dev
```
웹 애플리케이션이 http://localhost:3000 에서 실행됩니다.

## 📱 사용 방법

### 기본 분석 모드
1. 웹 페이지 접속
2. "표준 분석" 모드 선택
3. 카메라에 얼굴을 맞추고 대기
4. AI가 자동으로 최적 순간에 촬영
5. 분석 결과 확인

### LangChain 멀티에이전트 모드
1. "LangChain 멀티에이전트" 모드 선택
2. 동일한 촬영 과정
3. 여러 AI 에이전트가 협력하여 분석
4. 더 상세한 분석 결과 제공

## 🎯 핵심 기능 상세

### 1. 실시간 얼굴 추적 (MediaPipe)
- **기능**: 60fps 실시간 얼굴 감지 및 안정성 검사
- **특징**: 
  - 얼굴 가림/마스크 감지
  - 눈 인식 확인
  - 안정화 대기 (30프레임)
  - 신뢰도 기반 품질 검사

### 2. 스마트 카메라 제어
- **기능**: 이미지 품질 자동 검사 및 최적 촬영
- **특징**:
  - 밝기/대비/선명도 실시간 모니터링
  - 얼굴 안정성 기반 카운트다운
  - 품질 임계값 미달 시 촬영 방지
  - 고해상도 이미지 캡처

### 3. 정밀 여드름 마킹
- **기능**: 의료진 수준의 여드름 시각화
- **특징**:
  - 신뢰도별 색상 구분
  - 타입별 모양 표시 (원형/사각형/다이아몬드)
  - 인터랙티브 확대/축소
  - 통계 정보 제공
  - 상세 정보 팝업

### 4. 다중 피부 영역 분석
- **기능**: 여러 피부 특성을 히트맵으로 시각화
- **분석 항목**:
  - 수분도 (0-100%)
  - 유분도 (0-100%)
  - 모공 밀도 (count/cm²)
  - 색소침착 (index)
  - 탄력도 (score)
  - 텍스처 (roughness)

### 5. LangChain 멀티에이전트
- **구조**: 마스터-슬레이브 워크플로우
- **에이전트**:
  - **Master**: LangGraph 상태 관리
  - **Slave 1**: MediaPipe 얼굴 감지
  - **Slave 2**: Face-API.js 감정 분석
  - **Slave 3**: Nyckel 피부 상태 분석
  - **Slave 4**: OpenCV 이미지 전처리

## 🔧 문제 해결

### MediaPipe 설치 오류
```bash
# macOS
brew install opencv
pip install mediapipe

# Ubuntu
sudo apt-get install python3-opencv
pip install mediapipe

# Windows
pip install mediapipe
```

### LangChain 관련 오류
```bash
# 최신 버전 설치
pip install --upgrade langchain langgraph langchain-openai
```

### 카메라 접근 오류
- HTTPS 환경에서만 카메라 접근 가능
- 로컬 개발 시 localhost는 허용됨
- 브라우저 권한 설정 확인

### 성능 최적화
```bash
# GPU 가속 (CUDA 사용 가능 시)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

## 📊 시스템 요구사항

### 최소 사양
- **RAM**: 4GB 이상
- **CPU**: 2.0GHz 듀얼코어
- **GPU**: 통합 그래픽 (Intel HD 4000 이상)
- **브라우저**: Chrome 88+, Firefox 85+, Safari 14+

### 권장 사양
- **RAM**: 8GB 이상
- **CPU**: 2.5GHz 쿼드코어
- **GPU**: 전용 그래픽 카드
- **카메라**: 720p 이상 해상도

## 🌟 확장 가능성

### 향후 추가 가능한 기능
1. **실시간 스킨 트래킹**: 동영상 기반 피부 변화 추적
2. **3D 얼굴 맵핑**: 깊이 정보를 활용한 입체적 분석
3. **시계열 분석**: 과거 데이터와 비교한 변화 추이
4. **개인화 AI**: 사용자별 맞춤형 분석 모델
5. **의료진 연동**: 전문의 원격 상담 시스템

### API 확장
- RESTful API 완전 지원
- WebSocket 실시간 통신
- GraphQL 스키마 제공
- 모바일 앱 SDK

## 📞 지원 및 문의

### 기술 지원
- GitHub Issues를 통한 버그 리포트
- Wiki 문서를 통한 상세 가이드
- 커뮤니티 포럼 참여

### 라이선스
- MIT 라이선스 하에 배포
- 상업적 사용 가능
- 수정 및 재배포 허용

---

🎉 **축하합니다!** 얼굴 출입 서비스급 피부 분석 시스템이 성공적으로 구축되었습니다.
모든 기능이 정상적으로 작동하는지 확인하고, 필요에 따라 추가 커스터마이징을 진행하세요.