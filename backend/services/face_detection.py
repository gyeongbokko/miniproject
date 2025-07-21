"""
얼굴 감지 서비스
"""
import cv2
import numpy as np
import math
import os
from typing import Dict, List
import aiohttp

from core.config import settings
from core.exceptions import FaceDetectionError, ModelLoadError
from utils.logging_config import get_logger
from utils.image_utils import image_to_bytes
from utils.math_utils import calculate_distance_from_center, calculate_area_ratio

logger = get_logger("face_detection")


class FaceDetector:
    """얼굴 감지 담당 클래스"""
    
    def __init__(self):
        """얼굴 감지기 초기화"""
        try:
            # OpenCV 얼굴 검출기 초기화
            cascade_path = os.path.join(os.path.dirname(cv2.__file__), 'data', 'haarcascade_frontalface_default.xml')
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            if self.face_cascade.empty():
                raise ModelLoadError("얼굴 검출 모델을 로드할 수 없습니다.")
            
            self.session = None
            logger.info("✨ OpenCV Face Detection 모델 로드 완료!")
            
        except Exception as e:
            logger.error(f"얼굴 감지기 초기화 실패: {e}")
            raise ModelLoadError(f"얼굴 감지기 초기화 실패: {str(e)}")
    
    async def init_session(self):
        """비동기 HTTP 세션 초기화"""
        if self.session is None:
            timeout = aiohttp.ClientTimeout(total=30)
            connector = aiohttp.TCPConnector(limit=20, ttl_dns_cache=300)
            self.session = aiohttp.ClientSession(
                connector=connector,
                timeout=timeout,
                headers={"User-Agent": "SkinAnalyzer-2025/3.0"}
            )
    
    async def close_session(self):
        """세션 종료"""
        if self.session:
            await self.session.close()
            self.session = None
    
    def detect_face(self, image: np.ndarray) -> Dict:
        """OpenCV를 사용한 얼굴 감지"""
        try:
            # 그레이스케일 변환
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # 얼굴 감지
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=settings.face_scale_factor,
                minNeighbors=settings.face_min_neighbors,
                minSize=settings.face_min_size,
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            
            if len(faces) == 0:
                return {
                    "face_detected": False,
                    "confidence": 0.0,
                    "bbox": None
                }
            
            # 가장 큰 얼굴 선택 (중앙에 있는 얼굴일 가능성이 높음)
            best_face = max(faces, key=lambda x: x[2] * x[3])
            x, y, w, h = best_face
            
            # 얼굴 크기와 위치에 따른 신뢰도 계산
            area_ratio = calculate_area_ratio(w, h, image.shape[1], image.shape[0])
            
            # 신뢰도 점수 계산 (0.0 ~ 1.0)
            confidence = min(1.0, area_ratio * 5) if 0.05 <= area_ratio <= 0.6 else 0.0
            
            # 중앙에 가까울수록 높은 신뢰도
            center_x = x + w/2
            center_y = y + h/2
            
            distance_from_center = calculate_distance_from_center(
                center_x, center_y, image.shape[1], image.shape[0]
            )
            
            # 중앙 거리에 따른 신뢰도 조정
            confidence *= max(0.5, 1 - distance_from_center)
            
            return {
                "face_detected": True,
                "confidence": float(confidence),
                "bbox": {
                    "xmin": int(x),
                    "ymin": int(y),
                    "width": int(w),
                    "height": int(h)
                }
            }
            
        except Exception as e:
            logger.error(f"얼굴 감지 오류: {e}")
            return {
                "face_detected": False,
                "confidence": 0.0,
                "bbox": None,
                "error": str(e)
            }
    
    async def call_hf_api(self, model_name: str, image_bytes: bytes) -> Dict:
        """Hugging Face API 호출"""
        await self.init_session()
        
        url = f"{settings.hf_api_base}/{settings.models[model_name]}"
        headers = {
            "Content-Type": "application/octet-stream",
            "X-Request-ID": f"skin-analyzer-{int(__import__('time').time())}",
        }
        
        try:
            async with self.session.post(url, headers=headers, data=image_bytes) as response:
                if response.status == 200:
                    result = await response.json()
                    return {"success": True, "data": result}
                elif response.status == 503:
                    return {
                        "success": False, 
                        "error": "model_loading", 
                        "message": "AI 모델 로딩 중입니다. 30초 후 다시 시도하세요."
                    }
                else:
                    error_text = await response.text()
                    return {
                        "success": False, 
                        "error": "api_error", 
                        "message": f"API 오류: {error_text[:100]}"
                    }
                    
        except Exception as e:
            logger.error(f"HF API 호출 오류: {e}")
            return {
                "success": False, 
                "error": "network_error", 
                "message": f"네트워크 오류: {str(e)}"
            }
    
    
    def opencv_face_detection_backup(self, image: np.ndarray) -> List[Dict]:
        """OpenCV 백업 얼굴 감지"""
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            
            # 향상된 얼굴 감지
            faces = self.face_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.05,  # 최적화
                minNeighbors=6,
                minSize=(50, 50),
                maxSize=(500, 500)
            )
            
            result = []
            for (x, y, w, h) in faces:
                result.append({
                    "bbox": {"xmin": x, "ymin": y, "xmax": x+w, "ymax": y+h},
                    "confidence": 0.85,  # 향상된 기본 신뢰도
                    "quality": "medium"
                })
            return result
        except Exception as e:
            logger.error(f"OpenCV 얼굴 감지 오류: {e}")
            return []