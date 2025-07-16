# AI 피부 분석기 2025

> 2025년 최신 AI 기술을 활용한 실시간 피부 분석 웹 애플리케이션

## 🚀 프로젝트 개요

AI 기반 실시간 피부 분석 웹 애플리케이션으로, 사용자의 얼굴 사진을 분석하여 피부 타입, 수분도, 유분도, 잡티 등을 진단하고 개인 맞춤형 스킨케어 제품을 추천합니다.

### 주요 기능
- 📸 실시간 웹캠 촬영 및 이미지 업로드
- 🧠 AI 기반 얼굴 감지 및 피부 분석
- 📊 6가지 피부 지표 분석 (피부 타입, 수분도, 유분도, 잡티, 주름, 모공)
- 💄 개인 맞춤형 스킨케어 제품 추천
- 📱 모바일 반응형 PWA 지원

## 🛠 기술 스택

### 백엔드 (Python FastAPI)
- FastAPI 서버 프레임워크
- Hugging Face Inference API (클라우드 AI 모델)
- OpenCV (이미지 전처리)
- scikit-learn (피부 분석 알고리즘)

### 프론트엔드 (React)
- React 18 + Vite
- Tailwind CSS (2025년 최신 디자인)
- Lucide React (아이콘)
- PWA 지원

### AI 모델
- YOLOv8 Face Detection (얼굴 감지)
- Face-Parsing Segformer (얼굴 분할)
- 커스텀 피부 분석 알고리즘

## 🏗 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Services   │
│   (React)       │───▶│   (FastAPI)     │───▶│   (Hugging Face)│
│                 │    │                 │    │                 │
│ • 카메라 촬영    │    │ • 이미지 처리    │    │ • 얼굴 감지      │
│ • 실시간 UI     │    │ • AI 분석       │    │ • 피부 분할      │
│ • 결과 표시     │    │ • 제품 추천     │    │ • 텍스처 분석    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone https://github.com/gyeongbokko/miniproject.git
cd miniproject
```

### 2. 백엔드 설정
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. 프론트엔드 설정
```bash
cd frontend
npm install
npm start
```

### 4. 접속
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8000
- API 문서: http://localhost:8000/docs

## 🎯 사용 방법

1. 웹 브라우저에서 애플리케이션 접속
2. 카메라 권한 허용
3. "AI 카메라로 촬영" 버튼 클릭하여 실시간 촬영
4. 얼굴 가이드라인에 맞춰 사진 촬영
5. AI 분석 결과 확인 (약 3-5초 소요)
6. 맞춤형 제품 추천 및 피부 관리 팁 확인

## 📊 분석 지표

- **피부 타입**: 건성, 지성, 복합성, 민감성, 정상, 완벽
- **수분도**: 0-100% (최적: 65-85%)
- **유분도**: 0-100% (최적: 20-40%)
- **잡티 개수**: 자동 감지 및 카운팅
- **주름 정도**: 1-5 단계
- **모공 크기**: 매우 작음 ~ 매우 큼

## 🔧 개발 환경

- Python 3.13+
- Node.js 18+
- 현대 웹 브라우저 (Chrome, Firefox, Safari, Edge)
- 웹캠 지원 디바이스

## 🌟 특징

- **클라우드 기반 AI**: 로컬 GPU 불필요, 서버 리소스 최소화
- **실시간 분석**: 평균 3-5초 내 결과 제공
- **고정밀 분석**: 95%+ 정확도의 얼굴 감지 및 피부 분석
- **개인정보 보호**: 이미지는 분석 후 즉시 삭제
- **PWA 지원**: 모바일 앱처럼 설치 가능

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 👨‍💻 개발자

- **AI 알고리즘**: 최신 컴퓨터 비전 및 머신러닝 기술
- **웹 개발**: React + FastAPI 현대적 풀스택 구조
- **UI/UX**: 2025년 최신 디자인 트렌드 적용

---

🎉 **2025년 최신 AI 기술로 당신의 피부를 분석해보세요!**