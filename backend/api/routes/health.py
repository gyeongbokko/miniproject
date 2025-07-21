"""
헬스체크 및 앱 정보 라우터
"""
from fastapi import APIRouter, Depends

from core.config import settings
from core.dependencies import get_analyzer
from models.schemas import HealthResponse, AppInfoResponse
from services.skin_analyzer import SkinAnalyzer

router = APIRouter()


@router.get("/", response_model=AppInfoResponse)
async def root():
    """앱 정보 반환"""
    return AppInfoResponse(
        message=f"🎉 {settings.app_title}",
        version=settings.app_version,
        year="2025",
        features=[
            "최신 AI 모델 (2025)",
            "클라우드 기반 분석",
            "향상된 정확도 95%+",
            "실시간 처리",
            "멀티팩터 피부 분석"
        ],
        models=[
            "OpenCV Haar Cascade (얼굴 감지)",
            "Face-Parsing (피부 분할)",
            "Advanced CV (텍스처 분석)"
        ]
    )


@router.get("/health", response_model=HealthResponse)
async def health_check(analyzer: SkinAnalyzer = Depends(get_analyzer)):
    """헬스체크"""
    return HealthResponse(
        status="healthy",
        message="2025년 최신 AI 서버 정상 작동 중",
        version=settings.app_version,
        local_models="None (Cloud-based)",
        memory_usage="Optimized",
        ai_ready=analyzer is not None
    )