"""
Roboflow API를 사용한 여드름 감지 서비스
"""
import cv2
import numpy as np
import os
import uuid
from typing import List, Dict
import roboflow
from roboflow import Roboflow
import logging

logger = logging.getLogger(__name__)


class AcneDetector:
    """Roboflow API를 사용한 여드름 감지 담당 클래스"""
    
    def __init__(self, 
                 api_key: str = None,
                 workspace: str = None, 
                 project: str = None,
                 version: int = None,
                 temp_dir: str = "temp_images"):
        """여드름 감지기 초기화"""
        self.api_key = api_key or os.getenv("ROBOFLOW_API_KEY")
        self.workspace = workspace or os.getenv("ROBOFLOW_WORKSPACE")
        self.project = project or os.getenv("ROBOFLOW_PROJECT")
        self.version = version or int(os.getenv("ROBOFLOW_VERSION", "1"))
        self.temp_dir = temp_dir
        
        self.rf = None
        self.model = None
        self._initialize_roboflow()
    
    def _initialize_roboflow(self):
        """Roboflow API 초기화"""
        try:
            if not all([self.api_key, self.workspace, self.project]):
                logger.warning("⚠️ Roboflow 설정이 불완전합니다. 환경변수를 확인해주세요.")
                return
                
            self.rf = Roboflow(api_key=self.api_key)
            project = self.rf.workspace(self.workspace).project(self.project)
            self.model = project.version(self.version).model
            logger.info("✅ Roboflow 모델 초기화 완료")
        except Exception as e:
            logger.error(f"❌ Roboflow 초기화 실패: {e}")
            self.rf = None
            self.model = None
    
    def detect_acne_roboflow(self, image: np.ndarray, 
                           confidence_threshold: float = 0.15,
                           overlap_threshold: float = 0.45) -> List[Dict]:
        """Roboflow API를 사용한 여드름 탐지"""
        temp_filepath = None
        try:
            if self.model is None:
                logger.warning("⚠️ Roboflow 모델이 초기화되지 않음")
                return []
            
            # 임시 파일 생성
            os.makedirs(self.temp_dir, exist_ok=True)
            temp_filename = f"{uuid.uuid4()}.jpg"
            temp_filepath = os.path.join(self.temp_dir, temp_filename)

            # 이미지 저장 (RGB -> BGR 변환)
            cv2.imwrite(temp_filepath, cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
            
            # Roboflow API 호출 (cho-2 프로젝트와 정확히 동일한 설정)
            prediction = self.model.predict(
                temp_filepath, 
                confidence=15,  # 고정값 15%
                overlap=45      # 고정값 45%
            ).json()
            
            logger.info(f"🔍 Roboflow API 응답: {len(prediction.get('predictions', []))}개 예측")
            
            # 전체 예측 결과 로깅
            predictions = prediction.get('predictions', [])
            if predictions:
                confidences = [float(p['confidence']) for p in predictions]
                logger.info(f"📊 신뢰도 분포: 최대={max(confidences):.3f}, 최소={min(confidences):.3f}, 평균={sum(confidences)/len(confidences):.3f}")
                
                # 신뢰도별 분포 분석
                high_conf = len([c for c in confidences if c >= 0.5])
                med_conf = len([c for c in confidences if 0.2 <= c < 0.5])
                low_conf = len([c for c in confidences if c < 0.2])
                logger.info(f"📈 신뢰도 분포: 높음(≥50%)={high_conf}개, 중간(20-50%)={med_conf}개, 낮음(<20%)={low_conf}개")
            
            # 임시 파일 삭제
            os.remove(temp_filepath)
            temp_filepath = None

            # 결과 변환
            acne_lesions = []
            for pred in predictions:
                acne_lesions.append({
                    "x": int(pred['x'] - pred['width'] / 2),  # 중심점 -> 좌상단 좌표
                    "y": int(pred['y'] - pred['height'] / 2),
                    "width": int(pred['width']),
                    "height": int(pred['height']),
                    "confidence": float(pred['confidence']),
                    "class": pred.get('class', 'acne'),
                    "center_x": int(pred['x']),  # 중심점 좌표 추가
                    "center_y": int(pred['y'])
                })
            
            logger.info(f"✅ Roboflow 여드름 감지 완료: 총 {len(acne_lesions)}개 발견")
            return acne_lesions
            
        except Exception as e:
            logger.error(f"❌ Roboflow 여드름 감지 오류: {e}")
            
            # 임시 파일 정리
            if temp_filepath and os.path.exists(temp_filepath):
                try:
                    os.remove(temp_filepath)
                except Exception:
                    pass
            
            return []
    
    def generate_care_tips(self, skin_type: str, acne_count: int) -> List[str]:
        """피부 타입과 여드름 개수에 따른 맞춤 관리법 생성"""
        if acne_count == 0:
            return ["탐지된 여드름이 없습니다. 현재의 스킨케어 루틴을 잘 유지해주세요! 🌟"]
        
        tips = [
            f"💡 총 {acne_count}개의 여드름성 병변이 감지되었습니다.",
            "💡 [공통] 손으로 병변을 만지거나 짜지 마세요.",
            "💡 [공통] 하루 두 번, 저자극성 클렌저로 세안하는 것이 좋습니다."
        ]
        
        if skin_type == "지성":
            tips.append("💧 [지성] 오일프리 보습제로 유수분 밸런스를 맞춰주세요.")
        elif skin_type == "건성":
            tips.append("💧 [건성] 수분감이 풍부한 보습제로 피부 장벽을 강화해야 합니다.")
        else:
            tips.append("💧 [기타] 피부 자극을 최소화하고, 새로운 화장품은 테스트 후 사용하세요.")
        
        return tips
    
    def adjust_acne_coordinates(self, acne_lesions: List[Dict], bbox: Dict, scale_factor: Dict) -> List[Dict]:
        """여드름 좌표를 원본 이미지 좌표계로 조정"""
        adjusted_lesions = []
        
        for lesion in acne_lesions:
            # 1단계: 얼굴 영역 내 좌표를 전처리된 이미지 좌표로 변환
            face_x = lesion["x"] + bbox["xmin"]
            face_y = lesion["y"] + bbox["ymin"]
            
            # 2단계: 전처리된 이미지 좌표를 원본 이미지 좌표로 변환
            original_x = face_x / scale_factor["x"]
            original_y = face_y / scale_factor["y"]
            original_width = lesion["width"] / scale_factor["x"]
            original_height = lesion["height"] / scale_factor["y"]
            
            adjusted_lesion = {
                "x": int(original_x),
                "y": int(original_y),
                "width": int(original_width),
                "height": int(original_height),
                "confidence": lesion["confidence"],
                "class": lesion.get("class", "acne"),
                "face_relative": {  # 얼굴 영역 내 상대 좌표 (디버깅용)
                    "x": lesion["x"],
                    "y": lesion["y"],
                    "width": lesion["width"],
                    "height": lesion["height"]
                },
                "processed_image": {  # 전처리된 이미지 좌표 (디버깅용)
                    "x": face_x,
                    "y": face_y,
                    "width": lesion["width"],
                    "height": lesion["height"]
                }
            }
            adjusted_lesions.append(adjusted_lesion)
        
        return adjusted_lesions
    
    def is_available(self) -> bool:
        """Roboflow API 사용 가능 여부 확인"""
        return self.model is not None