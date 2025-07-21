"""
이미지 처리 유틸리티 함수들
"""
import base64
import cv2
import numpy as np
from PIL import Image
import io
from typing import Tuple, Optional
from fastapi import HTTPException

from core.config import settings
from core.exceptions import ImageProcessingError
from utils.logging_config import get_logger

logger = get_logger("image_utils")


def decode_base64_image(image_data: str) -> np.ndarray:
    """Base64 이미지를 numpy 배열로 디코딩"""
    try:
        logger.info(f"원본 이미지 데이터 길이: {len(image_data)}")
        
        # Base64 헤더 처리
        if ';base64,' in image_data:
            prefix, image_data = image_data.split(';base64,')
            logger.info(f"감지된 이미지 타입: {prefix}")
        elif ',' in image_data:
            image_data = image_data.split(',')[1]
            
        # 공백 및 개행 문자 제거
        image_data = image_data.strip()
        logger.info(f"정제된 Base64 데이터 길이: {len(image_data)}")
        
        # Base64 패딩 확인 및 수정
        padding = 4 - (len(image_data) % 4)
        if padding != 4:
            image_data += '=' * padding
            logger.info(f"Base64 패딩 추가: {padding}개")
        
        # Base64 디코딩
        try:
            image_bytes = base64.b64decode(image_data)
            logger.info(f"디코딩된 바이트 길이: {len(image_bytes)}")
            
            if len(image_bytes) == 0:
                raise ImageProcessingError("디코딩된 이미지 데이터가 비어있습니다.")
                
        except Exception as e:
            logger.error(f"Base64 디코딩 실패: {e}")
            raise ImageProcessingError("잘못된 Base64 형식입니다.")
        
        # 이미지 배열로 변환
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            if len(nparr) == 0:
                raise ImageProcessingError("이미지 데이터를 배열로 변환할 수 없습니다.")
            
            logger.info(f"numpy 배열 크기: {len(nparr)}")
            
            # 이미지 디코딩
            image_array = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image_array is None:
                raise ImageProcessingError(
                    "이미지 디코딩 실패. 지원되는 이미지 형식: JPEG, PNG, BMP"
                )
            
            logger.info(f"디코딩된 이미지 크기: {image_array.shape}")
            
            # 이미지 크기 확인
            if image_array.shape[0] < 10 or image_array.shape[1] < 10:
                raise ImageProcessingError(
                    "이미지가 너무 작습니다. 최소 10x10 픽셀 이상이어야 합니다."
                )
            
            # BGR을 RGB로 변환
            image_array = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
            
            return image_array
            
        except ImageProcessingError:
            raise
        except Exception as e:
            logger.error(f"이미지 변환 실패: {e}")
            raise ImageProcessingError(
                "이미지 변환 실패. 올바른 이미지 파일인지 확인해주세요."
            )
            
    except ImageProcessingError:
        raise
    except Exception as e:
        logger.error(f"이미지 처리 실패: {e}")
        raise ImageProcessingError("이미지 처리 중 오류가 발생했습니다.")


def preprocess_image(image: np.ndarray) -> np.ndarray:
    """이미지 전처리 (여드름 감지를 위해 최소한의 처리만 적용)"""
    try:
        if len(image.shape) == 3 and image.shape[2] == 3:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        else:
            image_rgb = image
            
        # 동적 크기 조정 (여드름 감지를 위해 더 큰 크기 유지)
        height, width = image_rgb.shape[:2]
        
        # 여드름 감지를 위해 더 큰 타겟 사이즈 사용
        target_size = min(settings.max_image_size, max(height, width))
        
        # 너무 큰 이미지만 축소 (1080px 이상일 때만)
        if max(height, width) > settings.max_image_size:
            scale = target_size / max(height, width)
            new_width = int(width * scale)
            new_height = int(height * scale)
            # 세밀한 디테일 보존을 위한 보간법 사용
            image_rgb = cv2.resize(image_rgb, (new_width, new_height), 
                                 interpolation=cv2.INTER_CUBIC)
        
        # 이미지 품질 향상 (원본과 동일)
        image_rgb = cv2.bilateralFilter(image_rgb, 9, 75, 75)
            
        return image_rgb
        
    except Exception as e:
        logger.error(f"이미지 전처리 오류: {e}")
        raise ImageProcessingError(f"이미지 전처리 실패: {str(e)}")


def image_to_bytes(image: np.ndarray, quality: Optional[int] = None) -> bytes:
    """이미지를 바이트로 변환"""
    try:
        pil_image = Image.fromarray(image)
        img_byte_arr = io.BytesIO()
        
        # 적응형 품질
        if quality is None:
            quality = (settings.image_quality_large 
                      if image.shape[0] * image.shape[1] > 500000 
                      else settings.image_quality)
        
        pil_image.save(img_byte_arr, format='JPEG', quality=quality, optimize=True)
        return img_byte_arr.getvalue()
        
    except Exception as e:
        logger.error(f"이미지 바이트 변환 오류: {e}")
        raise ImageProcessingError(f"이미지 바이트 변환 실패: {str(e)}")


def calculate_image_size_info(original_image: np.ndarray, processed_image: np.ndarray) -> dict:
    """이미지 크기 정보 계산"""
    try:
        original_height, original_width = original_image.shape[:2]
        processed_height, processed_width = processed_image.shape[:2]
        
        # 스케일 팩터 계산
        scale_x = processed_width / original_width
        scale_y = processed_height / original_height
        
        return {
            "original": {"width": int(original_width), "height": int(original_height)},
            "processed": {"width": int(processed_width), "height": int(processed_height)},
            "scale_factor": {"x": float(scale_x), "y": float(scale_y)}
        }
        
    except Exception as e:
        logger.error(f"이미지 크기 정보 계산 오류: {e}")
        return {
            "original": {"width": 0, "height": 0},
            "processed": {"width": 0, "height": 0},
            "scale_factor": {"x": 1.0, "y": 1.0}
        }


def validate_image_array(image: np.ndarray) -> bool:
    """이미지 배열 유효성 검사"""
    try:
        if image is None:
            return False
        
        if len(image.shape) != 3:
            return False
            
        if image.shape[2] != 3:
            return False
            
        if image.shape[0] < 10 or image.shape[1] < 10:
            return False
            
        return True
        
    except Exception:
        return False