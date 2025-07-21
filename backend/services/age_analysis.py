"""
나이 분석 서비스
"""
import cv2
import numpy as np
from PIL import Image
from typing import Tuple
from transformers import ViTFeatureExtractor, ViTForImageClassification

from utils.logging_config import get_logger
from core.exceptions import ModelLoadError
from utils.math_utils import calculate_confidence_score

logger = get_logger("age_analysis")


class AgeAnalyzer:
    """나이 분석 담당 클래스"""
    
    def __init__(self):
        """나이 분석기 초기화"""
        self.age_model, self.age_transforms = self.init_age_model()
    
    def init_age_model(self):
        """나이 분석을 위한 ViT 모델 초기화"""
        try:
            model = ViTForImageClassification.from_pretrained('nateraw/vit-age-classifier')
            transforms = ViTFeatureExtractor.from_pretrained('nateraw/vit-age-classifier')
            logger.info("나이 분석 모델 로드 완료")
            return model, transforms
        except Exception as e:
            logger.error(f"나이 분석 모델 로드 실패: {e}")
            return None, None
    
    def analyze_age(self, face_image: np.ndarray) -> Tuple[str, float]:
        """AI 기반 연령대 분석"""
        try:
            # OpenCV 이미지를 PIL Image로 변환
            pil_image = Image.fromarray(cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB))
            
            # 모델이 로드되지 않은 경우 폴백 방법 사용
            if self.age_model is None or self.age_transforms is None:
                return self.analyze_age_fallback(face_image)
            
            # 이미지 변환 및 모델 추론
            inputs = self.age_transforms(pil_image, return_tensors='pt')
            outputs = self.age_model(**inputs)
            
            # 클래스별 확률 계산
            probs = outputs.logits.softmax(1)
            pred_class = probs.argmax(1).item()
            confidence = probs[0][pred_class].item()
            
            # 나이 범위 매핑
            age_ranges = {
                0: "0-2",
                1: "3-9",
                2: "10대",
                3: "20대",
                4: "30대",
                5: "40대",
                6: "50대",
                7: "60대",
                8: "70대 이상"
            }
            
            predicted_range = age_ranges[pred_class]
            
            return predicted_range, min(confidence + 0.1, 1.0)  # 신뢰도 약간 상향 조정
            
        except Exception as e:
            logger.error(f"나이 분석 중 오류 발생: {e}")
            return self.analyze_age_fallback(face_image)
    
    def analyze_age_fallback(self, face_image: np.ndarray) -> Tuple[str, float]:
        """기존 방식의 연령대 분석 (폴백 메서드)"""
        try:
            # 얼굴 이미지를 그레이스케일로 변환
            gray = cv2.cvtColor(face_image, cv2.COLOR_RGB2GRAY)
            
            # 1. 피부 텍스처 분석
            texture_variance = np.var(gray.astype(np.float64))
            
            # 2. 주름 분석 (개선된 Canny 엣지 디텍션)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            edges = cv2.Canny(blurred, 30, 150)
            wrinkle_density = np.sum(edges) / (edges.shape[0] * edges.shape[1])
            
            # 3. 피부 톤 균일성 분석
            lab = cv2.cvtColor(face_image, cv2.COLOR_RGB2LAB)
            l_channel = lab[:,:,0]
            tone_variance = np.var(l_channel)
            
            # 4. 피부 밝기 분석
            brightness = np.mean(l_channel)
            
            # 5. 피부 대비 분석
            contrast = np.std(l_channel)
            
            # 6. 텍스처 패턴 분석
            texture_pattern = cv2.cornerHarris(gray, 2, 3, 0.04)
            texture_density = np.sum(texture_pattern > 0.01 * texture_pattern.max()) / (gray.shape[0] * gray.shape[1])
            
            # 연령대 점수 계산 (0~100)
            age_score = 0
            
            # 텍스처 기반 점수 (0-25점)
            texture_score = min(25, texture_variance / 20)
            age_score += texture_score
            
            # 주름 기반 점수 (0-25점)
            wrinkle_score = min(25, wrinkle_density * 1000)
            age_score += wrinkle_score
            
            # 피부 톤 균일성 기반 점수 (0-20점)
            tone_score = min(20, tone_variance / 25)
            age_score += tone_score
            
            # 밝기 기반 점수 (0-15점)
            brightness_score = max(0, min(15, (200 - brightness) / 8))
            age_score += brightness_score
            
            # 대비 기반 점수 (0-15점)
            contrast_score = min(15, contrast / 4)
            age_score += contrast_score
            
            # 점수를 나이로 변환 (15-70세)
            base_age = 15 + (age_score / 100) * 55
            
            # 텍스처 패턴 밀도에 따른 미세 조정
            pattern_adjustment = texture_density * 20
            base_age += pattern_adjustment
            
            # 최종 연령대 범위 계산 (±2~4세)
            range_width = 2 + int(age_score / 25)
            min_age = max(15, int(base_age - range_width))
            max_age = min(70, int(base_age + range_width))
            age_range = f"{min_age}~{max_age}세"
            
            # 신뢰도 계산 (0.6-1.0)
            confidence_factors = [
                1 - (texture_variance / 1000),
                1 - (wrinkle_density * 5),
                1 - (tone_variance / 500),
                1 - abs(contrast - 50) / 100,
                1 - abs(brightness - 128) / 256
            ]
            
            confidence = calculate_confidence_score(confidence_factors)
            confidence = max(0.6, min(1.0, confidence))
            
            logger.info(f"연령대 분석 상세 (폴백) - 텍스처: {texture_score:.1f}, 주름: {wrinkle_score:.1f}, " +
                       f"톤: {tone_score:.1f}, 밝기: {brightness_score:.1f}, 대비: {contrast_score:.1f}")
            
            return age_range, float(confidence)
            
        except Exception as e:
            logger.error(f"연령대 분석 오류 (폴백): {e}")
            return "20대", 0.6  # 오류 발생 시 기본값 반환