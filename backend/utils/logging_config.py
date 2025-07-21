"""
로깅 설정 유틸리티
"""
import logging
import sys
from typing import Optional

from core.config import settings


def setup_logging(log_level: Optional[str] = None) -> logging.Logger:
    """로깅 설정"""
    level = log_level or settings.log_level
    
    # 로깅 포맷 설정
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # 기본 로깅 설정
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler("backend.log", encoding="utf-8")
        ]
    )
    
    # 메인 로거 생성
    logger = logging.getLogger("skin_analyzer")
    logger.setLevel(getattr(logging, level.upper()))
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """이름으로 로거 가져오기"""
    return logging.getLogger(f"skin_analyzer.{name}")


# 기본 로거 인스턴스
logger = setup_logging()