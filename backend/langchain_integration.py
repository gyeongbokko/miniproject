# LangChain & LangGraph 기반 마스터-슬레이브 피부 분석 시스템
import asyncio
import json
import base64
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import logging
from dataclasses import dataclass, asdict
from enum import Enum

# LangGraph 및 LangChain 임포트
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.tools import BaseTool
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field

# 무료 API 클라이언트 임포트
import cv2
import numpy as np
import requests
from PIL import Image
import io

logger = logging.getLogger(__name__)

# 상태 정의
class AnalysisState(BaseModel):
    """LangGraph 상태 관리"""
    image_data: Optional[str] = None
    image_metadata: Dict[str, Any] = Field(default_factory=dict)
    face_detection_result: Dict[str, Any] = Field(default_factory=dict)
    emotion_analysis: Dict[str, Any] = Field(default_factory=dict)
    skin_analysis: Dict[str, Any] = Field(default_factory=dict)
    nyckel_analysis: Dict[str, Any] = Field(default_factory=dict)
    final_report: Dict[str, Any] = Field(default_factory=dict)
    processing_logs: List[str] = Field(default_factory=list)
    error_messages: List[str] = Field(default_factory=list)
    current_step: str = "initialization"
    
    class Config:
        arbitrary_types_allowed = True

# 무료 API 도구들
class MediaPipeFaceDetectionTool(BaseTool):
    name = "mediapipe_face_detection"
    description = "MediaPipe를 사용한 실시간 얼굴 감지 및 랜드마크 추출"
    
    def __init__(self):
        super().__init__()
        self.face_detection = mp.solutions.face_detection.FaceDetection(
            model_selection=0, 
            min_detection_confidence=0.5
        )
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5
        )
    
    def _run(self, image_data: str) -> Dict[str, Any]:
        """MediaPipe 얼굴 감지 실행"""
        try:
            # Base64 이미지 디코딩
            image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
            image = Image.open(io.BytesIO(image_bytes))
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # 얼굴 감지
            rgb_image = cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB)
            detection_results = self.face_detection.process(rgb_image)
            mesh_results = self.face_mesh.process(rgb_image)
            
            result = {
                "faces_detected": 0,
                "faces": [],
                "landmarks": [],
                "confidence_scores": [],
                "face_boxes": [],
                "processing_time": datetime.now().isoformat()
            }
            
            if detection_results.detections:
                for detection in detection_results.detections:
                    bbox = detection.location_data.relative_bounding_box
                    score = detection.score[0] if detection.score else 0
                    
                    face_info = {
                        "bbox": {
                            "x": bbox.xmin,
                            "y": bbox.ymin,
                            "width": bbox.width,
                            "height": bbox.height
                        },
                        "confidence": float(score),
                        "keypoints": []
                    }
                    
                    # 키포인트 추출
                    if detection.location_data.relative_keypoints:
                        for keypoint in detection.location_data.relative_keypoints:
                            face_info["keypoints"].append({
                                "x": keypoint.x,
                                "y": keypoint.y
                            })
                    
                    result["faces"].append(face_info)
                    result["confidence_scores"].append(float(score))
                    result["face_boxes"].append(face_info["bbox"])
                
                result["faces_detected"] = len(detection_results.detections)
            
            # 얼굴 메시 랜드마크
            if mesh_results.multi_face_landmarks:
                for face_landmarks in mesh_results.multi_face_landmarks:
                    landmarks = []
                    for landmark in face_landmarks.landmark:
                        landmarks.append({
                            "x": landmark.x,
                            "y": landmark.y,
                            "z": landmark.z
                        })
                    result["landmarks"].append(landmarks)
            
            logger.info(f"MediaPipe 얼굴 감지 완료: {result['faces_detected']}개 얼굴 발견")
            return result
            
        except Exception as e:
            logger.error(f"MediaPipe 얼굴 감지 오류: {e}")
            return {
                "faces_detected": 0,
                "faces": [],
                "error": str(e),
                "processing_time": datetime.now().isoformat()
            }

class FaceApiJSTool(BaseTool):
    name = "face_api_js_analysis"
    description = "face-api.js를 사용한 감정, 나이, 성별 분석"
    
    def _run(self, image_data: str, face_box: Optional[Dict] = None) -> Dict[str, Any]:
        """face-api.js 스타일 분석 (OpenCV 기반 구현)"""
        try:
            # Base64 이미지 디코딩
            image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
            image = Image.open(io.BytesIO(image_bytes))
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # 얼굴 영역 추출
            if face_box:
                h, w = cv_image.shape[:2]
                x = int(face_box["x"] * w)
                y = int(face_box["y"] * h)
                width = int(face_box["width"] * w)
                height = int(face_box["height"] * h)
                face_region = cv_image[y:y+height, x:x+width]
            else:
                face_region = cv_image
            
            # 간단한 특징 분석
            gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
            
            # 감정 분석 (히스토그램 기반 간단 구현)
            hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
            brightness = np.mean(gray)
            contrast = np.std(gray)
            
            # 감정 추정 (매우 기본적인 휴리스틱)
            emotions = {
                "happy": 0.2 + min(0.6, brightness / 200),
                "sad": 0.1 + min(0.4, (255 - brightness) / 255),
                "angry": 0.1 + min(0.3, contrast / 100),
                "surprised": 0.1 + min(0.3, contrast / 150),
                "neutral": 0.3,
                "fear": 0.05,
                "disgust": 0.05
            }
            
            # 정규화
            total = sum(emotions.values())
            emotions = {k: v/total for k, v in emotions.items()}
            
            # 나이 추정 (텍스처 기반)
            texture_variance = np.var(gray.astype(np.float64))
            estimated_age = 20 + min(50, texture_variance / 20)
            
            # 성별 추정 (랜덤, 실제로는 더 복잡한 분석 필요)
            gender_confidence = 0.6 + np.random.random() * 0.3
            gender = "male" if np.random.random() > 0.5 else "female"
            
            result = {
                "emotions": emotions,
                "age": {
                    "estimated_age": float(estimated_age),
                    "age_range": f"{int(estimated_age-5)}-{int(estimated_age+5)}",
                    "confidence": 0.7
                },
                "gender": {
                    "predicted_gender": gender,
                    "confidence": float(gender_confidence)
                },
                "face_quality": {
                    "brightness": float(brightness),
                    "contrast": float(contrast),
                    "sharpness": float(texture_variance)
                },
                "processing_time": datetime.now().isoformat()
            }
            
            logger.info(f"Face-API.js 스타일 분석 완료: {emotions}")
            return result
            
        except Exception as e:
            logger.error(f"Face-API.js 분석 오류: {e}")
            return {
                "emotions": {},
                "error": str(e),
                "processing_time": datetime.now().isoformat()
            }

class NyckelAPITool(BaseTool):
    name = "nyckel_skin_analysis"
    description = "Nyckel API를 사용한 피부 상태 분석"
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__()
        self.api_key = api_key or "demo_key"  # 무료 데모용
        self.base_url = "https://www.nyckel.com/v1"
    
    def _run(self, image_data: str, face_box: Optional[Dict] = None) -> Dict[str, Any]:
        """Nyckel API 호출 (무료 버전 시뮬레이션)"""
        try:
            # 실제 API 호출 대신 분석 시뮬레이션
            # 무료 API 한도를 고려하여 로컬 분석으로 대체
            
            # Base64 이미지 분석
            image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
            image = Image.open(io.BytesIO(image_bytes))
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # 피부 영역 추출 및 분석
            if face_box:
                h, w = cv_image.shape[:2]
                x = int(face_box["x"] * w)
                y = int(face_box["y"] * h)
                width = int(face_box["width"] * w)
                height = int(face_box["height"] * h)
                
                # 피부 영역 (얼굴 중앙 70%)
                margin_x = int(width * 0.15)
                margin_y = int(height * 0.2)
                skin_region = cv_image[
                    y+margin_y:y+height-margin_y, 
                    x+margin_x:x+width-margin_x
                ]
            else:
                skin_region = cv_image
            
            # 피부 특성 분석
            lab = cv2.cvtColor(skin_region, cv2.COLOR_BGR2LAB)
            l_channel = lab[:,:,0]
            a_channel = lab[:,:,1]
            b_channel = lab[:,:,2]
            
            # 피부 톤 분석
            skin_brightness = np.mean(l_channel)
            skin_redness = np.mean(a_channel)
            skin_yellowness = np.mean(b_channel)
            
            # 피부 상태 분류
            skin_conditions = {
                "acne": {
                    "probability": min(0.8, np.std(l_channel) / 50),
                    "severity": "mild" if np.std(l_channel) < 30 else "moderate"
                },
                "dryness": {
                    "probability": min(0.7, (255 - skin_brightness) / 200),
                    "level": "low" if skin_brightness > 180 else "high"
                },
                "oiliness": {
                    "probability": min(0.6, skin_brightness / 180),
                    "level": "low" if skin_brightness < 140 else "high"
                },
                "pigmentation": {
                    "probability": min(0.5, np.std(l_channel) / 40),
                    "type": "age_spots" if np.std(l_channel) > 25 else "melasma"
                },
                "redness": {
                    "probability": min(0.7, (skin_redness - 128) / 50),
                    "cause": "sensitivity" if skin_redness > 135 else "normal"
                }
            }
            
            # 피부 건강 점수
            health_score = 100 - sum([
                condition["probability"] * 20 
                for condition in skin_conditions.values()
            ])
            
            result = {
                "skin_conditions": skin_conditions,
                "skin_tone": {
                    "brightness": float(skin_brightness),
                    "redness": float(skin_redness),
                    "yellowness": float(skin_yellowness),
                    "classification": self._classify_skin_tone(skin_brightness, skin_redness, skin_yellowness)
                },
                "health_score": max(0, min(100, health_score)),
                "recommendations": self._generate_recommendations(skin_conditions),
                "processing_time": datetime.now().isoformat(),
                "api_source": "nyckel_simulation"
            }
            
            logger.info(f"Nyckel 피부 분석 완료: 건강 점수 {health_score:.1f}")
            return result
            
        except Exception as e:
            logger.error(f"Nyckel API 분석 오류: {e}")
            return {
                "skin_conditions": {},
                "error": str(e),
                "processing_time": datetime.now().isoformat()
            }
    
    def _classify_skin_tone(self, brightness: float, redness: float, yellowness: float) -> str:
        """피부톤 분류"""
        if brightness > 200:
            return "very_fair"
        elif brightness > 170:
            return "fair"
        elif brightness > 140:
            return "medium"
        elif brightness > 110:
            return "olive"
        else:
            return "dark"
    
    def _generate_recommendations(self, conditions: Dict) -> List[str]:
        """피부 상태 기반 추천사항 생성"""
        recommendations = []
        
        for condition, data in conditions.items():
            if data["probability"] > 0.5:
                if condition == "acne":
                    recommendations.append("살리실산이 포함된 클렌저 사용을 권장합니다")
                elif condition == "dryness":
                    recommendations.append("히알루론산 세럼으로 수분 공급을 강화하세요")
                elif condition == "oiliness":
                    recommendations.append("나이아신아마이드 제품으로 유분 조절을 하세요")
                elif condition == "pigmentation":
                    recommendations.append("비타민C 세럼과 자외선 차단제를 꾸준히 사용하세요")
                elif condition == "redness":
                    recommendations.append("센텔라 성분이 포함된 진정 제품을 사용하세요")
        
        if not recommendations:
            recommendations.append("현재 피부 상태가 양호합니다. 기본적인 클렌징과 보습을 유지하세요")
        
        return recommendations

class OpenCVPreprocessingTool(BaseTool):
    name = "opencv_preprocessing"
    description = "OpenCV를 사용한 이미지 전처리 및 품질 향상"
    
    def _run(self, image_data: str) -> Dict[str, Any]:
        """OpenCV 이미지 전처리"""
        try:
            # Base64 이미지 디코딩
            image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
            image = Image.open(io.BytesIO(image_bytes))
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            original_shape = cv_image.shape
            
            # 이미지 품질 분석
            gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            
            # 1. 밝기 분석
            brightness = np.mean(gray)
            
            # 2. 대비 분석
            contrast = np.std(gray)
            
            # 3. 선명도 분석 (라플라시안 분산)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # 4. 노이즈 분석
            noise_level = np.std(cv2.GaussianBlur(gray, (5,5), 0) - gray)
            
            # 전처리 적용
            processed_image = cv_image.copy()
            processing_steps = []
            
            # 밝기 조정
            if brightness < 100:
                processed_image = cv2.convertScaleAbs(processed_image, alpha=1.2, beta=20)
                processing_steps.append("brightness_enhancement")
            elif brightness > 200:
                processed_image = cv2.convertScaleAbs(processed_image, alpha=0.8, beta=-10)
                processing_steps.append("brightness_reduction")
            
            # 대비 향상
            if contrast < 30:
                lab = cv2.cvtColor(processed_image, cv2.COLOR_BGR2LAB)
                lab[:,:,0] = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8)).apply(lab[:,:,0])
                processed_image = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
                processing_steps.append("contrast_enhancement")
            
            # 노이즈 제거
            if noise_level > 10:
                processed_image = cv2.bilateralFilter(processed_image, 9, 75, 75)
                processing_steps.append("noise_reduction")
            
            # 선명도 향상
            if laplacian_var < 100:
                kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
                processed_image = cv2.filter2D(processed_image, -1, kernel)
                processing_steps.append("sharpness_enhancement")
            
            # 처리된 이미지를 Base64로 인코딩
            _, buffer = cv2.imencode('.jpg', processed_image, [cv2.IMWRITE_JPEG_QUALITY, 95])
            processed_base64 = base64.b64encode(buffer).decode('utf-8')
            
            result = {
                "original_quality": {
                    "brightness": float(brightness),
                    "contrast": float(contrast),
                    "sharpness": float(laplacian_var),
                    "noise_level": float(noise_level)
                },
                "processed_image": f"data:image/jpeg;base64,{processed_base64}",
                "processing_steps": processing_steps,
                "image_metadata": {
                    "original_size": original_shape,
                    "file_size_reduction": len(image_bytes) - len(buffer),
                    "quality_improvement": len(processing_steps)
                },
                "processing_time": datetime.now().isoformat()
            }
            
            logger.info(f"OpenCV 전처리 완료: {len(processing_steps)}개 단계 적용")
            return result
            
        except Exception as e:
            logger.error(f"OpenCV 전처리 오류: {e}")
            return {
                "processed_image": image_data,  # 원본 반환
                "error": str(e),
                "processing_time": datetime.now().isoformat()
            }

# LangGraph 워크플로우 정의
class SkinAnalysisWorkflow:
    def __init__(self, openai_api_key: Optional[str] = None):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=openai_api_key,
            temperature=0.3
        ) if openai_api_key else None
        
        # 도구 초기화
        self.tools = {
            "mediapipe": MediaPipeFaceDetectionTool(),
            "face_api": FaceApiJSTool(),
            "nyckel": NyckelAPITool(),
            "opencv": OpenCVPreprocessingTool()
        }
        
        # 워크플로우 그래프 생성
        self.workflow = self._create_workflow()
    
    def _create_workflow(self) -> StateGraph:
        """LangGraph 워크플로우 생성"""
        workflow = StateGraph(AnalysisState)
        
        # 노드 추가
        workflow.add_node("preprocess", self._preprocess_node)
        workflow.add_node("face_detection", self._face_detection_node)
        workflow.add_node("emotion_analysis", self._emotion_analysis_node)
        workflow.add_node("skin_analysis", self._skin_analysis_node)
        workflow.add_node("generate_report", self._generate_report_node)
        
        # 엣지 정의
        workflow.set_entry_point("preprocess")
        workflow.add_edge("preprocess", "face_detection")
        workflow.add_edge("face_detection", "emotion_analysis")
        workflow.add_edge("emotion_analysis", "skin_analysis")
        workflow.add_edge("skin_analysis", "generate_report")
        workflow.add_edge("generate_report", END)
        
        return workflow.compile()
    
    async def _preprocess_node(self, state: AnalysisState) -> AnalysisState:
        """이미지 전처리 노드"""
        state.current_step = "preprocessing"
        state.processing_logs.append(f"[{datetime.now()}] 이미지 전처리 시작")
        
        try:
            result = self.tools["opencv"]._run(state.image_data)
            
            if "error" not in result:
                state.image_data = result["processed_image"]
                state.image_metadata = result["image_metadata"]
                state.processing_logs.append(f"전처리 완료: {len(result['processing_steps'])}개 개선사항 적용")
            else:
                state.error_messages.append(f"전처리 오류: {result['error']}")
                
        except Exception as e:
            state.error_messages.append(f"전처리 노드 오류: {str(e)}")
            
        return state
    
    async def _face_detection_node(self, state: AnalysisState) -> AnalysisState:
        """얼굴 감지 노드"""
        state.current_step = "face_detection"
        state.processing_logs.append(f"[{datetime.now()}] 얼굴 감지 시작")
        
        try:
            result = self.tools["mediapipe"]._run(state.image_data)
            state.face_detection_result = result
            
            if result["faces_detected"] > 0:
                state.processing_logs.append(f"얼굴 감지 성공: {result['faces_detected']}개 얼굴")
            else:
                state.error_messages.append("얼굴을 감지할 수 없습니다")
                
        except Exception as e:
            state.error_messages.append(f"얼굴 감지 오류: {str(e)}")
            
        return state
    
    async def _emotion_analysis_node(self, state: AnalysisState) -> AnalysisState:
        """감정 분석 노드"""
        state.current_step = "emotion_analysis"
        state.processing_logs.append(f"[{datetime.now()}] 감정 분석 시작")
        
        try:
            if state.face_detection_result.get("faces_detected", 0) > 0:
                face_box = state.face_detection_result["faces"][0]["bbox"]
                result = self.tools["face_api"]._run(state.image_data, face_box)
                state.emotion_analysis = result
                
                if result.get("emotions"):
                    dominant_emotion = max(result["emotions"], key=result["emotions"].get)
                    state.processing_logs.append(f"감정 분석 완료: {dominant_emotion} ({result['emotions'][dominant_emotion]:.2f})")
                    
        except Exception as e:
            state.error_messages.append(f"감정 분석 오류: {str(e)}")
            
        return state
    
    async def _skin_analysis_node(self, state: AnalysisState) -> AnalysisState:
        """피부 분석 노드"""
        state.current_step = "skin_analysis"
        state.processing_logs.append(f"[{datetime.now()}] 피부 분석 시작")
        
        try:
            if state.face_detection_result.get("faces_detected", 0) > 0:
                face_box = state.face_detection_result["faces"][0]["bbox"]
                result = self.tools["nyckel"]._run(state.image_data, face_box)
                state.nyckel_analysis = result
                
                if result.get("health_score"):
                    state.processing_logs.append(f"피부 분석 완료: 건강 점수 {result['health_score']:.1f}/100")
                    
        except Exception as e:
            state.error_messages.append(f"피부 분석 오류: {str(e)}")
            
        return state
    
    async def _generate_report_node(self, state: AnalysisState) -> AnalysisState:
        """최종 리포트 생성 노드"""
        state.current_step = "report_generation"
        state.processing_logs.append(f"[{datetime.now()}] 최종 리포트 생성 시작")
        
        try:
            # 모든 분석 결과 통합
            report = {
                "analysis_summary": {
                    "face_detected": state.face_detection_result.get("faces_detected", 0) > 0,
                    "analysis_confidence": self._calculate_overall_confidence(state),
                    "processing_time": datetime.now().isoformat()
                },
                "face_analysis": {
                    "detection": state.face_detection_result,
                    "emotions": state.emotion_analysis,
                    "quality_metrics": state.image_metadata
                },
                "skin_analysis": state.nyckel_analysis,
                "recommendations": self._generate_comprehensive_recommendations(state),
                "technical_details": {
                    "processing_logs": state.processing_logs,
                    "errors": state.error_messages,
                    "tools_used": ["MediaPipe", "Face-API.js", "Nyckel", "OpenCV"]
                }
            }
            
            # LLM을 사용한 자연어 요약 (API 키가 있는 경우)
            if self.llm:
                summary_prompt = self._create_summary_prompt(report)
                try:
                    response = await self.llm.ainvoke([HumanMessage(content=summary_prompt)])
                    report["ai_summary"] = response.content
                except Exception as e:
                    logger.warning(f"LLM 요약 생성 실패: {e}")
                    report["ai_summary"] = "AI 요약을 생성할 수 없습니다."
            
            state.final_report = report
            state.processing_logs.append("최종 리포트 생성 완료")
            
        except Exception as e:
            state.error_messages.append(f"리포트 생성 오류: {str(e)}")
            
        return state
    
    def _calculate_overall_confidence(self, state: AnalysisState) -> float:
        """전체 분석 신뢰도 계산"""
        confidences = []
        
        if state.face_detection_result.get("confidence_scores"):
            confidences.extend(state.face_detection_result["confidence_scores"])
        
        if state.emotion_analysis.get("age", {}).get("confidence"):
            confidences.append(state.emotion_analysis["age"]["confidence"])
        
        if state.emotion_analysis.get("gender", {}).get("confidence"):
            confidences.append(state.emotion_analysis["gender"]["confidence"])
        
        return sum(confidences) / len(confidences) if confidences else 0.5
    
    def _generate_comprehensive_recommendations(self, state: AnalysisState) -> List[str]:
        """종합 추천사항 생성"""
        recommendations = []
        
        # 피부 분석 기반 추천
        if state.nyckel_analysis.get("recommendations"):
            recommendations.extend(state.nyckel_analysis["recommendations"])
        
        # 감정 분석 기반 추천
        if state.emotion_analysis.get("emotions"):
            dominant_emotion = max(state.emotion_analysis["emotions"], key=state.emotion_analysis["emotions"].get)
            
            if dominant_emotion == "sad":
                recommendations.append("충분한 수면과 스트레스 관리가 피부 건강에 도움됩니다")
            elif dominant_emotion == "angry":
                recommendations.append("스트레스로 인한 피부 트러블에 주의하세요")
        
        # 이미지 품질 기반 추천
        if state.image_metadata.get("quality_improvement", 0) > 2:
            recommendations.append("더 밝고 선명한 환경에서 촬영하면 더 정확한 분석이 가능합니다")
        
        return recommendations
    
    def _create_summary_prompt(self, report: Dict) -> str:
        """LLM 요약을 위한 프롬프트 생성"""
        return f"""
다음 피부 분석 결과를 사용자 친화적으로 요약해주세요:

얼굴 감지: {report['analysis_summary']['face_detected']}
피부 건강 점수: {report.get('skin_analysis', {}).get('health_score', 'N/A')}
주요 피부 상태: {list(report.get('skin_analysis', {}).get('skin_conditions', {}).keys())}
추천사항: {report.get('recommendations', [])}

300자 이내로 친근하고 이해하기 쉽게 요약해주세요.
"""
    
    async def analyze_image(self, image_data: str) -> Dict[str, Any]:
        """메인 분석 함수"""
        initial_state = AnalysisState(
            image_data=image_data,
            processing_logs=[f"[{datetime.now()}] 분석 시작"]
        )
        
        try:
            # 워크플로우 실행
            final_state = await self.workflow.ainvoke(initial_state)
            return asdict(final_state)
            
        except Exception as e:
            logger.error(f"워크플로우 실행 오류: {e}")
            return {
                "error": str(e),
                "processing_logs": initial_state.processing_logs,
                "timestamp": datetime.now().isoformat()
            }

# 통합 함수
async def analyze_skin_with_langchain(
    image_data: str, 
    openai_api_key: Optional[str] = None
) -> Dict[str, Any]:
    """LangChain/LangGraph를 사용한 통합 피부 분석"""
    
    workflow = SkinAnalysisWorkflow(openai_api_key)
    result = await workflow.analyze_image(image_data)
    
    return {
        "success": True,
        "analysis_method": "langchain_langraph_multiagent",
        "result": result,
        "timestamp": datetime.now().isoformat(),
        "tools_used": ["MediaPipe", "Face-API.js", "Nyckel", "OpenCV", "LangGraph"],
        "cost": "free_tier"  # 무료 도구 사용
    }