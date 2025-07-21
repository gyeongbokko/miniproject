"""
메인 피부 분석 서비스
"""
import time
from typing import Dict

from models.analysis_result import SkinAnalysisResult
from core.config import settings
from core.exceptions import FaceDetectionError
from utils.logging_config import get_logger
from utils.image_utils import preprocess_image, calculate_image_size_info
from utils.math_utils import calculate_ita_angle, calculate_skin_tone_from_ita, clamp
from services.face_detection import FaceDetector
from services.age_analysis import AgeAnalyzer
from services.acne_detection import AcneDetector
from services.image_processing import ImageProcessor

logger = get_logger("skin_analyzer")


class SkinAnalyzer:
    """통합 피부 분석 서비스"""
    
    def __init__(self):
        """피부 분석기 초기화"""
        self.face_detector = FaceDetector()
        self.age_analyzer = AgeAnalyzer()
        self.acne_detector = AcneDetector()
        self.image_processor = ImageProcessor()
        
        logger.info("🚀 2025년 최신 AI 피부 분석기 초기화 완료")
    
    async def close_session(self):
        """세션 종료"""
        await self.face_detector.close_session()
    
    async def analyze_image_advanced(self, image) -> SkinAnalysisResult:
        """최신 AI 기반 이미지 분석"""
        start_time = time.time()
        
        try:
            # 원본 이미지 크기 저장
            original_height, original_width = image.shape[:2]
            
            # 1. 향상된 전처리
            processed_image = preprocess_image(image)
            
            # 이미지 크기 정보 계산
            image_size = calculate_image_size_info(image, processed_image)

            # 2. 향상된 얼굴 감지
            face_detection_result = self.face_detector.detect_face(processed_image)
            
            if not face_detection_result["face_detected"] or face_detection_result["confidence"] < settings.min_face_confidence:
                return SkinAnalysisResult.create_failed_result(
                    reason="얼굴 감지 실패",
                    confidence=face_detection_result.get("confidence", 0.0),
                    processing_time=time.time() - start_time,
                    image_size=image_size
                )

            # 3. 얼굴 영역 추출
            bbox = face_detection_result["bbox"]
            face_image = processed_image[
                bbox["ymin"]:bbox["ymin"]+bbox["height"],
                bbox["xmin"]:bbox["xmin"]+bbox["width"]
            ]
            
            # 4. 기존 피부 분석 진행
            parsing_result = await self._advanced_face_parsing(face_image)
            skin_analysis = self.image_processor.analyze_skin_advanced(face_image, parsing_result)
            
            # 5. AI 기반 분류
            skin_type = self._classify_skin_type_ai(skin_analysis)
            
            # 6. 향상된 피부톤 분석
            skin_tone = self._analyze_skin_tone_ai(skin_analysis['avg_skin_color'])
            
            # 7. 수분도/유분도 계산
            moisture_level, oil_level = self._calculate_levels_ai(skin_type, skin_analysis)
            
            # 8. 여드름 감지 (원본 방식과 동일)
            acne_lesions = self.acne_detector.detect_acne_roboflow(image)  # 원본 그대로
            blemish_count = len(acne_lesions)
            
            # 9. 연령대 분석
            age_range, age_confidence = self.age_analyzer.analyze_age(face_image)
            
            # 10. 기타 계산
            wrinkle_level = min(5, max(1, int(skin_analysis['skin_texture_variance'] / 120) + 1))
            pore_size = self._determine_pore_size(skin_type, skin_analysis)
            
            # 11. 종합 점수
            overall_score = self._calculate_overall_score(skin_analysis, blemish_count, wrinkle_level)
            
            # 12. 유분/수분 핫스팟 분석
            oil_hotspots, moisture_hotspots = self.image_processor.find_skin_hotspots(face_image)
            
            # 13. 관리 팁 생성
            care_tips = self.acne_detector.generate_care_tips(skin_type, blemish_count)
            
            processing_time = time.time() - start_time
            
            return SkinAnalysisResult(
                skin_type=skin_type,
                moisture_level=int(moisture_level),
                oil_level=int(oil_level),
                blemish_count=blemish_count,
                skin_tone=skin_tone,
                wrinkle_level=wrinkle_level,
                pore_size=pore_size,
                overall_score=int(overall_score),
                avg_skin_color=skin_analysis['avg_skin_color'],
                face_detected=True,
                confidence=face_detection_result["confidence"],
                skin_area_percentage=skin_analysis['skin_area_percentage'],
                detected_features=parsing_result['labels_found'],
                processing_time=processing_time,
                api_method="2025_advanced_ai",
                age_range=age_range,
                age_confidence=age_confidence,
                acne_lesions=acne_lesions,
                image_size=image_size,
                care_tips=care_tips,
                oil_hotspots=oil_hotspots,
                moisture_hotspots=moisture_hotspots
            )
            
        except Exception as e:
            logger.error(f"2025년 이미지 분석 오류: {e}")
            raise FaceDetectionError(f"분석 중 오류 발생: {str(e)}")
    
    async def _advanced_face_parsing(self, image) -> Dict:
        """향상된 Face Parsing"""
        # 실제로는 HF API를 호출하지만, 현재는 간단한 버전으로 구현
        return self.image_processor.enhanced_skin_detection(image)
    
    def _classify_skin_type_ai(self, skin_analysis: Dict) -> str:
        """AI 기반 피부 타입 분류"""
        brightness = skin_analysis['skin_brightness']
        variance = skin_analysis['skin_texture_variance']
        uniformity = skin_analysis.get('skin_uniformity', 0.5)
        health_score = skin_analysis.get('skin_health_score', 50)
        
        # 멀티팩터 분석
        if brightness > 180 and variance < 150 and uniformity > 0.7:
            return "건성"
        elif brightness < 140 and variance > 300 and uniformity < 0.4:
            return "지성"
        elif variance > 400 or health_score < 40:
            return "민감성"
        elif uniformity < 0.6 and variance > 200:
            return "복합성"
        elif health_score > 80 and uniformity > 0.8:
            return "완벽"
        else:
            return "정상"
    
    def _analyze_skin_tone_ai(self, avg_color: Dict[str, float]) -> str:
        """AI 기반 피부톤 분석"""
        try:
            ita = calculate_ita_angle(avg_color)
            return calculate_skin_tone_from_ita(ita)
        except Exception as e:
            logger.error(f"피부톤 분석 오류: {e}")
            return "분석 불가"
    
    def _calculate_levels_ai(self, skin_type: str, skin_analysis: Dict) -> tuple:
        """AI 기반 수분도/유분도 계산"""
        base_values = {
            '건성': {'moisture': 25, 'oil': 15},
            '지성': {'moisture': 45, 'oil': 70},
            '복합성': {'moisture': 55, 'oil': 45},
            '민감성': {'moisture': 35, 'oil': 25},
            '정상': {'moisture': 65, 'oil': 35},
            '완벽': {'moisture': 85, 'oil': 20}
        }
        
        base = base_values.get(skin_type, base_values['정상'])
        
        # AI 기반 조정
        health_factor = skin_analysis.get('skin_health_score', 50) / 100
        uniformity_factor = skin_analysis.get('skin_uniformity', 0.5)
        
        moisture_adj = (health_factor - 0.5) * 20
        oil_adj = (0.5 - uniformity_factor) * 30
        
        moisture = clamp(base['moisture'] + moisture_adj, 10, 95)
        oil = clamp(base['oil'] + oil_adj, 5, 90)
        
        return int(moisture), int(oil)
    
    def _determine_pore_size(self, skin_type: str, skin_analysis: Dict) -> str:
        """AI 기반 모공 크기 결정"""
        texture_var = skin_analysis['skin_texture_variance']
        
        if skin_type == "지성" and texture_var > 300:
            return "매우 큼"
        elif skin_type == "지성":
            return "큼"
        elif skin_type == "건성" and texture_var < 100:
            return "매우 작음"
        elif skin_type == "건성":
            return "작음"
        elif texture_var > 250:
            return "큼"
        elif texture_var < 150:
            return "작음"
        else:
            return "보통"
    
    def _calculate_overall_score(self, skin_analysis: Dict, blemish_count: int, wrinkle_level: int) -> float:
        """AI 기반 종합 점수 계산"""
        health_score = skin_analysis.get('skin_health_score', 50)
        uniformity = skin_analysis.get('skin_uniformity', 0.5) * 100
        
        # 가중치 기반 계산
        base_score = (health_score * 0.4 + uniformity * 0.3 + 70 * 0.3)
        
        # 페널티 적용
        blemish_penalty = blemish_count * 1.5
        wrinkle_penalty = wrinkle_level * 3
        
        final_score = max(40, base_score - blemish_penalty - wrinkle_penalty)
        
        return final_score