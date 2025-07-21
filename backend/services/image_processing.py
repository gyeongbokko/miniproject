"""
이미지 처리 서비스
"""
import cv2
import numpy as np
from typing import Dict

from utils.logging_config import get_logger
from core.exceptions import ImageProcessingError
from utils.math_utils import calculate_texture_variance, calculate_uniformity_score

logger = get_logger("image_processing")


class ImageProcessor:
    """이미지 처리 담당 클래스"""
    
    def enhanced_skin_detection(self, image: np.ndarray) -> Dict:
        """향상된 피부 감지 알고리즘"""
        try:
            # YCrCb 색공간 활용
            ycrcb = cv2.cvtColor(image, cv2.COLOR_RGB2YCrCb)
            
            # 최적화된 피부색 범위
            lower_skin = np.array([0, 133, 77], dtype=np.uint8)
            upper_skin = np.array([255, 173, 127], dtype=np.uint8)
            
            skin_mask = cv2.inRange(ycrcb, lower_skin, upper_skin)
            
            # 고급 모폴로지 연산
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
            skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_OPEN, kernel)
            skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel)
            
            # 가우시안 블러로 부드럽게
            skin_mask = cv2.GaussianBlur(skin_mask, (5, 5), 0)
            
            return {
                "masks": {"skin": skin_mask},
                "labels_found": ["skin", "background"],
                "confidence": 0.88
            }
        except Exception as e:
            logger.error(f"향상된 피부 감지 오류: {e}")
            return {"masks": {}, "labels_found": [], "confidence": 0.0}
    
    def analyze_skin_advanced(self, image: np.ndarray, parsing_result: Dict) -> Dict:
        """고급 피부 분석 알고리즘"""
        analysis = {
            'skin_area_percentage': 0,
            'avg_skin_color': {'r': 0, 'g': 0, 'b': 0},
            'skin_texture_variance': 0,
            'skin_brightness': 0,
            'skin_uniformity': 0,
            'skin_health_score': 0,
            'detected_features': parsing_result.get('labels_found', [])
        }
        
        if 'skin' not in parsing_result.get('masks', {}):
            # 전체 이미지 기반 분석
            analysis['avg_skin_color'] = {
                'r': float(np.mean(image[:,:,0])),
                'g': float(np.mean(image[:,:,1])),
                'b': float(np.mean(image[:,:,2]))
            }
            analysis['skin_brightness'] = float(np.mean(image))
            analysis['skin_area_percentage'] = 85.0
            gray_image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            analysis['skin_texture_variance'] = calculate_texture_variance(gray_image)
            return analysis
        
        skin_mask = parsing_result['masks']['skin']
        
        # 향상된 분석
        total_pixels = skin_mask.size
        skin_pixels = np.sum(skin_mask > 128)
        analysis['skin_area_percentage'] = (skin_pixels / total_pixels) * 100
        
        if skin_pixels > 0:
            skin_regions = image[skin_mask > 128]
            
            if len(skin_regions) > 0:
                # 색상 분석
                avg_color = np.mean(skin_regions, axis=0)
                analysis['avg_skin_color'] = {
                    'r': float(avg_color[0]),
                    'g': float(avg_color[1]),
                    'b': float(avg_color[2])
                }
                
                analysis['skin_brightness'] = float(np.mean(avg_color))
                
                # 새로운 지표들
                gray_skin = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
                skin_texture = gray_skin[skin_mask > 128]
                if len(skin_texture) > 0:
                    analysis['skin_texture_variance'] = calculate_texture_variance(skin_texture)
                    analysis['skin_uniformity'] = calculate_uniformity_score(skin_texture)
                    
                    # 피부 건강 점수
                    color_balance = 1.0 - abs(avg_color[0] - avg_color[1]) / 255
                    texture_quality = min(1.0, 200.0 / analysis['skin_texture_variance'])
                    analysis['skin_health_score'] = float((color_balance + texture_quality) / 2 * 100)
        
        return analysis
    
    def detect_blemishes_advanced(self, image: np.ndarray, skin_mask: np.ndarray) -> int:
        """고급 잡티 감지"""
        try:
            # 고급 잡티 감지 알고리즘
            lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
            l_channel = lab[:,:,0]
            
            # 적응형 임계값
            adaptive_thresh = cv2.adaptiveThreshold(
                l_channel, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY_INV, 15, 3
            )
            
            if skin_mask is not None and skin_mask.size > 0:
                adaptive_thresh[skin_mask <= 128] = 0
            
            # 고급 노이즈 제거
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
            cleaned = cv2.morphologyEx(adaptive_thresh, cv2.MORPH_OPEN, kernel)
            
            # 연결된 구성 요소 분석
            num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(cleaned)
            
            blemish_count = 0
            for i in range(1, num_labels):
                area = stats[i, cv2.CC_STAT_AREA]
                if 8 < area < 150:  # 최적화된 범위
                    blemish_count += 1
            
            return min(blemish_count, 40)  # 상한선
            
        except Exception as e:
            logger.error(f"잡티 감지 오류: {e}")
            return 0
    
    def find_skin_hotspots(self, face_image: np.ndarray) -> tuple:
        """유분/수분 핫스팟 영역 찾기"""
        h, w = face_image.shape[:2]
        oil_contours_final = []
        moisture_contours_final = []

        try:
            # 1. 유분 영역 분석 (번들거림, Specular Reflection)
            # T존(이마, 코)을 주요 분석 영역으로 한정
            t_zone_mask = np.zeros((h, w), dtype=np.uint8)
            cv2.rectangle(t_zone_mask, (int(w*0.2), int(h*0.1)), (int(w*0.8), int(h*0.4)), 255, -1)  # 이마
            cv2.rectangle(t_zone_mask, (int(w*0.35), int(h*0.4)), (int(w*0.65), int(h*0.7)), 255, -1)  # 코

            # LAB 색 공간으로 변환하여 밝기(L) 채널을 사용
            lab_image = cv2.cvtColor(face_image, cv2.COLOR_RGB2LAB)
            l_channel = lab_image[:,:,0]

            # T존 내에서 매우 밝은 영역(번들거림)을 임계값으로 추출
            _, specular_mask = cv2.threshold(l_channel, 225, 255, cv2.THRESH_BINARY)
            specular_mask = cv2.bitwise_and(specular_mask, specular_mask, mask=t_zone_mask)
            
            # 노이즈 제거
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5,5))
            specular_mask = cv2.morphologyEx(specular_mask, cv2.MORPH_OPEN, kernel)

            contours, _ = cv2.findContours(specular_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for cnt in contours:
                if cv2.contourArea(cnt) > 50:  # 너무 작은 영역은 제외
                    epsilon = 0.02 * cv2.arcLength(cnt, True)
                    approx = cv2.approxPolyDP(cnt, epsilon, True)
                    oil_contours_final.append([{'x': int(point[0][0]), 'y': int(point[0][1])} for point in approx])

            # 2. 수분 영역 분석 (매끄러움, Low Texture)
            # U존(볼)을 주요 분석 영역으로 한정
            u_zone_mask = np.zeros((h, w), dtype=np.uint8)
            cv2.rectangle(u_zone_mask, (int(w*0.05), int(h*0.3)), (int(w*0.35), int(h*0.8)), 255, -1)  # 왼쪽 볼
            cv2.rectangle(u_zone_mask, (int(w*0.65), int(h*0.3)), (int(w*0.95), int(h*0.8)), 255, -1)  # 오른쪽 볼

            gray_image = cv2.cvtColor(face_image, cv2.COLOR_RGB2GRAY)
            gray_image = cv2.bitwise_and(gray_image, gray_image, mask=u_zone_mask)
            
            sobelx = cv2.Sobel(gray_image, cv2.CV_64F, 1, 0, ksize=5)
            sobely = cv2.Sobel(gray_image, cv2.CV_64F, 0, 1, ksize=5)
            sobel_magnitude = np.sqrt(sobelx**2 + sobely**2)

            valid_area = sobel_magnitude[u_zone_mask > 0]
            if len(valid_area) > 0:
                threshold_value = np.percentile(valid_area, 20)
                smooth_mask = np.where((sobel_magnitude < threshold_value) & (u_zone_mask > 0), 255, 0).astype(np.uint8)
                
                kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7,7))
                smooth_mask = cv2.morphologyEx(smooth_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
                smooth_mask = cv2.morphologyEx(smooth_mask, cv2.MORPH_OPEN, kernel)

                contours, _ = cv2.findContours(smooth_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                for cnt in contours:
                    if cv2.contourArea(cnt) > 200:
                        epsilon = 0.02 * cv2.arcLength(cnt, True)
                        approx = cv2.approxPolyDP(cnt, epsilon, True)
                        moisture_contours_final.append([{'x': int(point[0][0]), 'y': int(point[0][1])} for point in approx])

        except Exception as e:
            logger.error(f"피부 핫스팟 분석 중 오류 발생: {e}")

        return oil_contours_final, moisture_contours_final