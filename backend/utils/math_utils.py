"""
수학 계산 유틸리티 함수들
"""
import math
import numpy as np
from typing import Dict, Tuple


def calculate_ita_angle(avg_color: Dict[str, float]) -> float:
    """ITA° (Individual Typology Angle) 계산"""
    try:
        r, g, b = avg_color['r'], avg_color['g'], avg_color['b']
        
        # L*a*b* 색공간으로 변환
        L = 116 * ((r/255) ** (1/3)) - 16 if r > 20 else 0
        a = 500 * (((r/255) ** (1/3)) - ((g/255) ** (1/3)))
        b_val = 200 * (((g/255) ** (1/3)) - ((b/255) ** (1/3)))
        
        # ITA° 계산
        ita = math.degrees(math.atan(L / b_val)) if b_val != 0 else 0
        
        return ita
        
    except Exception:
        return 0.0


def calculate_skin_tone_from_ita(ita: float) -> str:
    """ITA° 값으로부터 피부톤 분류"""
    if ita > 55:
        return "매우 밝은 쿨톤 (Type I)"
    elif ita > 41:
        return "밝은 쿨톤 (Type II)"
    elif ita > 28:
        return "중간 쿨톤 (Type III)"
    elif ita > 10:
        return "중간 웜톤 (Type IV)"
    elif ita > -30:
        return "어두운 웜톤 (Type V)"
    else:
        return "매우 어두운 웜톤 (Type VI)"


def calculate_confidence_score(factors: list) -> float:
    """신뢰도 점수 계산"""
    if not factors:
        return 0.0
    
    # 각 팩터를 0-1 범위로 정규화
    normalized_factors = []
    for factor in factors:
        if isinstance(factor, (int, float)):
            normalized_factor = max(0.0, min(1.0, factor))
            normalized_factors.append(normalized_factor)
    
    if not normalized_factors:
        return 0.0
    
    # 평균값 계산 후 최소/최대값 적용
    confidence = sum(normalized_factors) / len(normalized_factors)
    return max(0.0, min(1.0, confidence))


def calculate_distance_from_center(
    point_x: float, 
    point_y: float, 
    image_width: int, 
    image_height: int
) -> float:
    """이미지 중심에서의 거리 계산 (정규화된 값)"""
    center_x = image_width / 2
    center_y = image_height / 2
    
    distance = math.sqrt(
        ((point_x - center_x) / image_width) ** 2 +
        ((point_y - center_y) / image_height) ** 2
    )
    
    return distance


def calculate_area_ratio(width: int, height: int, total_width: int, total_height: int) -> float:
    """영역 비율 계산"""
    if total_width <= 0 or total_height <= 0:
        return 0.0
    
    area = width * height
    total_area = total_width * total_height
    
    return area / total_area if total_area > 0 else 0.0


def normalize_value(value: float, min_val: float, max_val: float) -> float:
    """값을 0-1 범위로 정규화"""
    if max_val <= min_val:
        return 0.0
    
    normalized = (value - min_val) / (max_val - min_val)
    return max(0.0, min(1.0, normalized))


def calculate_texture_variance(image_gray: np.ndarray) -> float:
    """텍스처 분산 계산"""
    try:
        if image_gray.size == 0:
            return 0.0
        
        return float(np.var(image_gray.astype(np.float64)))
        
    except Exception:
        return 0.0


def calculate_uniformity_score(image_gray: np.ndarray) -> float:
    """균일성 점수 계산"""
    try:
        if image_gray.size == 0:
            return 0.0
        
        std_dev = np.std(image_gray.astype(np.float64))
        uniformity = 1.0 / (1.0 + std_dev / 100)
        
        return float(uniformity)
        
    except Exception:
        return 0.0


def weighted_average(values: list, weights: list) -> float:
    """가중 평균 계산"""
    if not values or not weights or len(values) != len(weights):
        return 0.0
    
    if sum(weights) == 0:
        return 0.0
    
    weighted_sum = sum(v * w for v, w in zip(values, weights))
    total_weight = sum(weights)
    
    return weighted_sum / total_weight


def clamp(value: float, min_val: float, max_val: float) -> float:
    """값을 범위 내로 제한"""
    return max(min_val, min(max_val, value))