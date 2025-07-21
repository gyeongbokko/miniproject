"""
피부 분석 라우터
"""
from fastapi import APIRouter, Depends, HTTPException

from core.dependencies import get_analyzer
from core.exceptions import handle_analysis_error, SkinAnalysisException
from models.schemas import (
    ImageAnalysisRequest, 
    AnalysisResponse, 
    FaceDetectionRequest, 
    FaceDetectionResponse
)
from services.skin_analyzer import SkinAnalyzer
from utils.image_utils import decode_base64_image
from utils.logging_config import get_logger
from models.analysis_result import SkinAnalysisResult

logger = get_logger("analysis_router")
router = APIRouter()


def convert_to_schema(result: SkinAnalysisResult) -> dict:
    """SkinAnalysisResult를 API 스키마로 변환"""
    return {
        "skin_type": result.skin_type,
        "moisture_level": result.moisture_level,
        "oil_level": result.oil_level,
        "blemish_count": result.blemish_count,
        "skin_tone": result.skin_tone,
        "wrinkle_level": result.wrinkle_level,
        "pore_size": result.pore_size,
        "overall_score": result.overall_score,
        "avg_skin_color": result.avg_skin_color,
        "face_detected": result.face_detected,
        "confidence": result.confidence,
        "skin_area_percentage": result.skin_area_percentage,
        "detected_features": result.detected_features,
        "processing_time": result.processing_time,
        "api_method": result.api_method,
        "analysis_version": result.analysis_version,
        "age_range": result.age_range,
        "age_confidence": result.age_confidence,
        "acne_lesions": result.acne_lesions,
        "image_size": result.image_size,
        "care_tips": result.care_tips,
        "oil_hotspots": result.oil_hotspots,
        "moisture_hotspots": result.moisture_hotspots
    }


@router.post("/analyze-skin-base64", response_model=AnalysisResponse)
async def analyze_skin_base64(
    request: ImageAnalysisRequest,
    analyzer: SkinAnalyzer = Depends(get_analyzer)
):
    """Base64 이미지 분석 엔드포인트"""
    
    if analyzer is None:
        raise HTTPException(status_code=503, detail="AI 분석기가 준비되지 않았습니다.")
    
    try:
        # Base64 이미지 디코딩
        image_array = decode_base64_image(request.image)
        
        # AI 분석 수행
        result = await analyzer.analyze_image_advanced(image_array)
        
        return AnalysisResponse(
            success=True,
            analysis_method="2025년 최신 AI 기반 분석",
            processing_time=f"{result.processing_time:.2f}s",
            ai_version=result.analysis_version,
            result=convert_to_schema(result)
        )
        
    except SkinAnalysisException as e:
        logger.error(f"분석 오류: {e}")
        raise handle_analysis_error(e)
    except Exception as e:
        logger.error(f"예상치 못한 오류: {e}")
        raise HTTPException(status_code=500, detail=f"서버 오류가 발생했습니다: {str(e)}")


@router.post("/detect-face-realtime", response_model=FaceDetectionResponse)
async def detect_face_realtime(
    request: FaceDetectionRequest,
    analyzer: SkinAnalyzer = Depends(get_analyzer)
):
    """실시간 얼굴 감지 엔드포인트"""
    
    if analyzer is None:
        raise HTTPException(status_code=503, detail="AI 분석기가 준비되지 않았습니다.")
        
    try:
        # Base64 이미지 디코딩
        image_array = decode_base64_image(request.image)

        # OpenCV 얼굴 감지만 수행
        face_detection_result = analyzer.face_detector.detect_face(image_array)
        
        return FaceDetectionResponse(
            success=True,
            face_detected=face_detection_result["face_detected"],
            confidence=face_detection_result.get("confidence", 0.0)
        )

    except Exception as e:
        logger.error(f"실시간 얼굴 감지 오류: {e}")
        # 오류 발생 시에도 정상적인 응답 구조를 반환하여 프론트엔드 오류 방지
        return FaceDetectionResponse(
            success=False,
            face_detected=False,
            confidence=0.0,
            error=str(e)
        )