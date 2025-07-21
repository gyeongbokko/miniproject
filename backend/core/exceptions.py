"""
커스텀 예외 클래스들
"""
from fastapi import HTTPException


class SkinAnalysisException(Exception):
    """피부 분석 관련 기본 예외"""
    def __init__(self, message: str, details: str = None):
        self.message = message
        self.details = details
        super().__init__(self.message)


class FaceDetectionError(SkinAnalysisException):
    """얼굴 감지 실패 예외"""
    pass


class ImageProcessingError(SkinAnalysisException):
    """이미지 처리 오류 예외"""
    pass


class ModelLoadError(SkinAnalysisException):
    """AI 모델 로드 오류 예외"""
    pass


class APIError(SkinAnalysisException):
    """외부 API 호출 오류 예외"""
    pass


def raise_http_exception(status_code: int, detail: str, headers: dict = None):
    """HTTPException을 발생시키는 헬퍼 함수"""
    raise HTTPException(
        status_code=status_code,
        detail=detail,
        headers=headers
    )


def handle_analysis_error(error: Exception) -> HTTPException:
    """분석 오류를 적절한 HTTP 예외로 변환"""
    if isinstance(error, FaceDetectionError):
        return HTTPException(
            status_code=422,
            detail=f"얼굴 감지 실패: {error.message}"
        )
    elif isinstance(error, ImageProcessingError):
        return HTTPException(
            status_code=400,
            detail=f"이미지 처리 오류: {error.message}"
        )
    elif isinstance(error, ModelLoadError):
        return HTTPException(
            status_code=503,
            detail=f"AI 모델 오류: {error.message}"
        )
    elif isinstance(error, APIError):
        return HTTPException(
            status_code=502,
            detail=f"외부 API 오류: {error.message}"
        )
    else:
        return HTTPException(
            status_code=500,
            detail=f"예상치 못한 오류: {str(error)}"
        )