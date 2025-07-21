"""
분석 결과 데이터 모델
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class SkinAnalysisResult:
    """피부 분석 결과 데이터 클래스"""
    
    # 기본 분석 결과
    skin_type: str
    moisture_level: int
    oil_level: int
    blemish_count: int
    skin_tone: str
    wrinkle_level: int
    pore_size: str
    overall_score: int
    
    # 색상 및 기술적 정보
    avg_skin_color: Dict[str, float]
    face_detected: bool
    confidence: float
    skin_area_percentage: float
    detected_features: List[str]
    processing_time: float
    api_method: str
    
    # 확장 정보
    analysis_version: str = "2025.1.0"
    age_range: str = "분석 불가"
    age_confidence: float = 0.0
    acne_lesions: List[Dict] = field(default_factory=list)
    image_size: Optional[Dict[str, int]] = None
    care_tips: Optional[List[str]] = None
    
    # 핫스팟 정보 (선택적)
    oil_hotspots: Optional[List[List[Dict]]] = None
    moisture_hotspots: Optional[List[List[Dict]]] = None
    
    def to_dict(self) -> Dict:
        """딕셔너리로 변환"""
        return {
            "skin_type": self.skin_type,
            "moisture_level": self.moisture_level,
            "oil_level": self.oil_level,
            "blemish_count": self.blemish_count,
            "skin_tone": self.skin_tone,
            "wrinkle_level": self.wrinkle_level,
            "pore_size": self.pore_size,
            "overall_score": self.overall_score,
            "avg_skin_color": self.avg_skin_color,
            "face_detected": self.face_detected,
            "confidence": self.confidence,
            "skin_area_percentage": self.skin_area_percentage,
            "detected_features": self.detected_features,
            "processing_time": self.processing_time,
            "api_method": self.api_method,
            "analysis_version": self.analysis_version,
            "age_range": self.age_range,
            "age_confidence": self.age_confidence,
            "acne_lesions": self.acne_lesions,
            "image_size": self.image_size,
            "care_tips": self.care_tips,
            "oil_hotspots": self.oil_hotspots,
            "moisture_hotspots": self.moisture_hotspots
        }
    
    @classmethod
    def create_failed_result(
        cls, 
        reason: str = "분석 실패", 
        confidence: float = 0.0,
        processing_time: float = 0.0,
        image_size: Optional[Dict] = None
    ) -> "SkinAnalysisResult":
        """실패한 분석 결과 생성"""
        return cls(
            skin_type=reason,
            moisture_level=0,
            oil_level=0,
            blemish_count=0,
            skin_tone=reason,
            wrinkle_level=0,
            pore_size=reason,
            overall_score=0,
            avg_skin_color={'r': 0, 'g': 0, 'b': 0},
            face_detected=False,
            confidence=confidence,
            skin_area_percentage=0,
            detected_features=[],
            processing_time=processing_time,
            api_method="failed",
            age_range="분석 불가",
            age_confidence=0.0,
            acne_lesions=[],
            image_size=image_size
        )