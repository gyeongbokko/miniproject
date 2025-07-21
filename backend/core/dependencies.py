"""
FastAPI 의존성 주입 관리
"""
from functools import lru_cache
from typing import Optional

from core.config import Settings, settings
from services.skin_analyzer import SkinAnalyzer


# 전역 분석기 인스턴스
_analyzer_instance: Optional[SkinAnalyzer] = None


@lru_cache()
def get_settings() -> Settings:
    """설정 의존성"""
    return settings


async def get_analyzer() -> SkinAnalyzer:
    """피부 분석기 의존성"""
    global _analyzer_instance
    
    if _analyzer_instance is None:
        _analyzer_instance = SkinAnalyzer()
    
    return _analyzer_instance


async def cleanup_analyzer():
    """분석기 정리 (앱 종료시)"""
    global _analyzer_instance
    
    if _analyzer_instance:
        await _analyzer_instance.close_session()
        _analyzer_instance = None