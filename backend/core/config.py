"""
애플리케이션 설정 관리 모듈
"""
import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """애플리케이션 설정"""
    
    # API 설정
    app_title: str = "AI 피부 분석기 API"
    app_version: str = "3.0.0"
    app_description: str = "2025년 최신 기술 기반 클라우드 피부 분석 서비스"
    
    # 서버 설정
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # CORS 설정
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000", 
        "http://localhost:3001"
    ]
    
    # AI 모델 설정
    hf_api_base: str = "https://api-inference.huggingface.co/models"
    models: dict = {
        "face_parsing": "jonathandinu/face-parsing",
        "age_analysis": "nateraw/vit-age-classifier",
        "skin_analysis": "microsoft/DialoGPT-medium"
    }
    
    # Roboflow API 설정
    roboflow_api_key: str = "JUBdpTBjKonjWlwJY7ya"
    roboflow_workspace: str = "runner-e0dmy"
    roboflow_project: str = "acne-ijcab"
    roboflow_version: int = 1
    
    # 이미지 처리 설정
    max_image_size: int = 1080
    target_size_large: int = 640
    target_size_small: int = 512
    image_quality: int = 90
    image_quality_large: int = 85
    
    # 얼굴 감지 설정
    min_face_confidence: float = 0.8
    face_scale_factor: float = 1.1
    face_min_neighbors: int = 5
    face_min_size: tuple = (30, 30)
    
    # 분석 설정
    analysis_version: str = "2025.1.0"
    acne_confidence_threshold: int = 15  # 원본과 동일하게 15%
    acne_overlap_threshold: int = 45     # 원본과 동일하게 45%
    
    # 임시 파일 설정
    temp_dir: str = "temp_images"
    
    # 로깅 설정
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# 전역 설정 인스턴스
settings = Settings()