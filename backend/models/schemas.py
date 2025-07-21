"""
API 요청/응답 스키마 정의
"""
from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class ImageAnalysisRequest(BaseModel):
    """이미지 분석 요청 스키마"""
    image: str = Field(..., description="Base64 인코딩된 이미지 데이터")
    
    class Config:
        json_schema_extra = {
            "example": {
                "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
            }
        }


class FaceDetectionRequest(BaseModel):
    """실시간 얼굴 감지 요청 스키마"""
    image: str = Field(..., description="Base64 인코딩된 이미지 데이터")


class AcneLesion(BaseModel):
    """여드름 병변 정보"""
    x: int = Field(..., description="X 좌표")
    y: int = Field(..., description="Y 좌표") 
    width: int = Field(..., description="너비")
    height: int = Field(..., description="높이")
    confidence: float = Field(..., description="신뢰도 (0.0-1.0)")
    class_name: Optional[str] = Field(None, alias="class", description="여드름 유형")


class ImageSize(BaseModel):
    """이미지 크기 정보"""
    original: Dict[str, int] = Field(..., description="원본 이미지 크기")
    processed: Dict[str, int] = Field(..., description="처리된 이미지 크기")
    scale_factor: Dict[str, float] = Field(..., description="스케일 팩터")


class SkinColor(BaseModel):
    """피부 색상 정보"""
    r: float = Field(..., description="빨강 값 (0-255)")
    g: float = Field(..., description="초록 값 (0-255)")
    b: float = Field(..., description="파랑 값 (0-255)")


class AnalysisResult(BaseModel):
    """피부 분석 결과"""
    skin_type: str = Field(..., description="피부 타입")
    moisture_level: int = Field(..., description="수분도 (0-100)")
    oil_level: int = Field(..., description="유분도 (0-100)")
    blemish_count: int = Field(..., description="잡티 개수")
    skin_tone: str = Field(..., description="피부톤")
    wrinkle_level: int = Field(..., description="주름 정도 (1-5)")
    pore_size: str = Field(..., description="모공 크기")
    overall_score: int = Field(..., description="종합 점수 (0-100)")
    avg_skin_color: SkinColor = Field(..., description="평균 피부 색상")
    face_detected: bool = Field(..., description="얼굴 감지 여부")
    confidence: float = Field(..., description="얼굴 감지 신뢰도")
    skin_area_percentage: float = Field(..., description="피부 영역 비율")
    detected_features: List[str] = Field(..., description="감지된 특징들")
    processing_time: float = Field(..., description="처리 시간")
    api_method: str = Field(..., description="사용된 분석 방법")
    analysis_version: str = Field(..., description="분석 버전")
    age_range: str = Field(..., description="추정 연령대")
    age_confidence: float = Field(..., description="연령 추정 신뢰도")
    acne_lesions: List[AcneLesion] = Field(..., description="여드름 병변 목록")
    image_size: Optional[ImageSize] = Field(None, description="이미지 크기 정보")
    care_tips: Optional[List[str]] = Field(None, description="관리 팁")
    oil_hotspots: Optional[List[List[Dict]]] = Field(None, description="유분 핫스팟")
    moisture_hotspots: Optional[List[List[Dict]]] = Field(None, description="수분 핫스팟")


class AnalysisResponse(BaseModel):
    """분석 응답 스키마"""
    success: bool = Field(..., description="성공 여부")
    analysis_method: str = Field(..., description="분석 방법")
    processing_time: str = Field(..., description="처리 시간")
    ai_version: str = Field(..., description="AI 버전")
    result: AnalysisResult = Field(..., description="분석 결과")


class FaceDetectionResponse(BaseModel):
    """얼굴 감지 응답 스키마"""
    success: bool = Field(..., description="성공 여부")
    face_detected: bool = Field(..., description="얼굴 감지 여부")
    confidence: float = Field(..., description="감지 신뢰도")
    error: Optional[str] = Field(None, description="오류 메시지")


class HealthResponse(BaseModel):
    """헬스체크 응답 스키마"""
    status: str = Field(..., description="서버 상태")
    message: str = Field(..., description="상태 메시지")
    version: str = Field(..., description="API 버전")
    local_models: str = Field(..., description="로컬 모델 상태")
    memory_usage: str = Field(..., description="메모리 사용량")
    ai_ready: bool = Field(..., description="AI 준비 상태")


class AppInfoResponse(BaseModel):
    """앱 정보 응답 스키마"""
    message: str = Field(..., description="앱 메시지")
    version: str = Field(..., description="앱 버전")
    year: str = Field(..., description="년도")
    features: List[str] = Field(..., description="주요 기능들")
    models: List[str] = Field(..., description="사용된 AI 모델들")