// 얼굴 출입 서비스급 고도화된 피부 분석기 (모든 컴포넌트 통합)
import React, { useState, useCallback } from 'react';
import { 
  Brain, Sparkles, Zap, Eye, Shield, Target, 
  Camera, Upload, RotateCw, CheckCircle, AlertTriangle,
  Layers, TrendingUp, BarChart3, Map
} from 'lucide-react';

// 기존 컴포넌트들 임포트
import SkinAnalyzer2025 from './SkinAnalyzer2025';

const AdvancedSkinAnalyzer = () => {
  const [currentStep, setCurrentStep] = useState('capture');
  const [capturedImage, setCapturedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisMode, setAnalysisMode] = useState('standard'); // standard, langchain
  
  const API_BASE_URL = 'http://localhost:8000';

  // SmartCamera에서 사진 촬영 완료 콜백
  const handleCaptureComplete = useCallback((imageData, metadata) => {
    console.log('📸 고품질 사진 촬영 완료:', metadata);
    setCapturedImage(imageData);
    setCurrentStep('captured');
  }, []);

  // 카메라 오류 처리
  const handleCameraError = useCallback((error) => {
    console.error('📹 카메라 오류:', error);
    setError(`카메라 오류: ${error.message}`);
  }, []);

  // 분석 실행
  const runAnalysis = useCallback(async () => {
    if (!capturedImage) {
      setError('분석할 이미지가 없습니다.');
      return;
    }

    setIsLoading(true);
    setCurrentStep('analyzing');
    setError(null);

    try {
      const endpoint = analysisMode === 'langchain' 
        ? `${API_BASE_URL}/analyze-skin-langchain`
        : `${API_BASE_URL}/analyze-skin-base64`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: capturedImage
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '분석 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      
      if (data.success) {
        setAnalysisResult(data.result || data);
        setCurrentStep('result');
      } else {
        throw new Error('분석 결과를 받을 수 없습니다.');
      }

    } catch (error) {
      console.error('🔬 분석 오류:', error);
      setError(error.message || '분석 중 오류가 발생했습니다.');
      setCurrentStep('captured');
    } finally {
      setIsLoading(false);
    }
  }, [capturedImage, analysisMode]);

  // 초기화
  const resetAnalysis = useCallback(() => {
    setCurrentStep('capture');
    setCapturedImage(null);
    setAnalysisResult(null);
    setIsLoading(false);
    setError(null);
  }, []);

  // 분석 모드 변경
  const handleModeChange = useCallback((mode) => {
    setAnalysisMode(mode);
    console.log(`🔄 분석 모드 변경: ${mode}`);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              얼굴 출입 서비스급 피부 분석기
            </h1>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-gray-600 mb-4">
            MediaPipe 실시간 얼굴 추적 + 스마트 카메라 + 정밀 여드름 마킹 + LangChain 멀티에이전트
          </p>
          
          {/* 분석 모드 선택 */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => handleModeChange('standard')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                analysisMode === 'standard'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Zap className="w-5 h-5 inline mr-2" />
              표준 분석
            </button>
            <button
              onClick={() => handleModeChange('langchain')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                analysisMode === 'langchain'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Brain className="w-5 h-5 inline mr-2" />
              LangChain 멀티에이전트
            </button>
          </div>
          
          {/* 기능 표시 */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {[
              { icon: Eye, text: "실시간 얼굴 추적", color: "text-green-600" },
              { icon: Camera, text: "스마트 품질 검사", color: "text-blue-600" },
              { icon: Target, text: "정밀 여드름 마킹", color: "text-red-600" },
              { icon: Layers, text: "다중 피부 분석", color: "text-purple-600" },
              { icon: Brain, text: "AI 멀티에이전트", color: "text-pink-600" }
            ].map(({ icon: Icon, text, color }, index) => (
              <div key={index} className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-gray-700">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-800 font-medium text-sm">오류 발생</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* 메인 콘텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 왼쪽: 카메라/이미지 영역 */}
          <div className="space-y-6">
            {/* 카메라 카드 */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Camera className="w-6 h-6 text-blue-600" />
                스마트 카메라 시스템
              </h3>
              
              <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                {currentStep === 'capture' ? (
                  <SmartCamera
                    onCapture={handleCaptureComplete}
                    onError={handleCameraError}
                    isActive={true}
                    autoCapture={true}
                    qualityChecks={true}
                  />
                ) : capturedImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={capturedImage}
                      alt="촬영된 이미지"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      촬영 완료
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Camera className="w-16 h-16 mx-auto mb-4" />
                      <p>카메라 준비 중...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 카메라 컨트롤 */}
              <div className="mt-4 flex gap-3">
                {currentStep !== 'capture' && (
                  <button
                    onClick={resetAnalysis}
                    className="flex-1 bg-gray-100 text-gray-600 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCw className="w-4 h-4" />
                    다시 촬영
                  </button>
                )}
                
                {currentStep === 'captured' && (
                  <button
                    onClick={runAnalysis}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        분석 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {analysisMode === 'langchain' ? 'LangChain 분석' : '표준 분석'} 시작
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 분석 결과 영역 */}
          <div className="space-y-6">
            {currentStep === 'result' && analysisResult && (
              <>
                {/* 여드름 마킹 카드 */}
                {analysisResult.acne_lesions && analysisResult.acne_lesions.length > 0 && (
                  <div className="bg-white rounded-3xl shadow-xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Target className="w-6 h-6 text-red-600" />
                      정밀 여드름 마킹
                    </h3>
                    
                    <div className="h-96 border rounded-2xl overflow-hidden">
                      <AcneMarker
                        imageUrl={capturedImage}
                        acneLesions={analysisResult.acne_lesions}
                        imageSize={analysisResult.image_size}
                        showConfidence={true}
                        showTypes={true}
                        interactive={true}
                        exportable={true}
                      />
                    </div>
                    
                    <div className="mt-4 text-center">
                      <p className="text-gray-600">
                        <span className="font-bold text-red-600">{analysisResult.acne_lesions.length}개</span>의 여드름이 감지되었습니다
                      </p>
                    </div>
                  </div>
                )}

                {/* 다중 피부 분석 카드 */}
                <div className="bg-white rounded-3xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Layers className="w-6 h-6 text-purple-600" />
                    다중 피부 영역 분석
                  </h3>
                  
                  <div className="h-96 border rounded-2xl overflow-hidden">
                    <SkinAnalysisEngine
                      imageUrl={capturedImage}
                      analysisData={analysisResult}
                      enabledAnalyses={['moisture', 'oil', 'pores', 'pigmentation']}
                      interactive={true}
                    />
                  </div>
                </div>

                {/* LangChain 멀티에이전트 결과 */}
                {analysisMode === 'langchain' && analysisResult.agents_used && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Brain className="w-6 h-6 text-purple-600" />
                      멀티에이전트 분석 결과
                    </h3>
                    
                    <div className="space-y-3">
                      {analysisResult.agents_used.map((agent, index) => (
                        <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-xl">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="font-medium text-gray-700">{agent}</span>
                          <span className="text-green-600 text-sm">완료</span>
                        </div>
                      ))}
                    </div>
                    
                    {analysisResult.result?.final_report?.ai_summary && (
                      <div className="mt-4 p-4 bg-white rounded-xl">
                        <h4 className="font-bold text-gray-800 mb-2">AI 종합 분석</h4>
                        <p className="text-gray-700 leading-relaxed">
                          {analysisResult.result.final_report.ai_summary}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 기본 분석 결과 */}
                <div className="bg-white rounded-3xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    분석 요약
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analysisResult.skin_type || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">피부 타입</div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-xl text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {analysisResult.overall_score || 0}/100
                      </div>
                      <div className="text-sm text-gray-600">종합 점수</div>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-xl text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {analysisResult.moisture_level || 0}%
                      </div>
                      <div className="text-sm text-gray-600">수분도</div>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded-xl text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {analysisResult.blemish_count || 0}개
                      </div>
                      <div className="text-sm text-gray-600">여드름</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 대기 상태 */}
            {currentStep !== 'result' && (
              <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                <div className="text-gray-400 mb-4">
                  {currentStep === 'capture' && (
                    <>
                      <Camera className="w-16 h-16 mx-auto mb-4" />
                      <h3 className="text-lg font-medium">얼굴을 카메라에 맞춰주세요</h3>
                      <p className="text-sm">AI가 자동으로 최적의 순간에 촬영합니다</p>
                    </>
                  )}
                  
                  {currentStep === 'captured' && (
                    <>
                      <Sparkles className="w-16 h-16 mx-auto mb-4" />
                      <h3 className="text-lg font-medium">분석 준비 완료!</h3>
                      <p className="text-sm">버튼을 클릭하여 분석을 시작하세요</p>
                    </>
                  )}
                  
                  {currentStep === 'analyzing' && (
                    <>
                      <div className="w-16 h-16 mx-auto mb-4 relative">
                        <Brain className="w-16 h-16 text-purple-500 animate-pulse" />
                        <div className="absolute inset-0 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
                      </div>
                      <h3 className="text-lg font-medium">AI 분석 진행 중...</h3>
                      <p className="text-sm">
                        {analysisMode === 'langchain' 
                          ? '멀티에이전트가 협력하여 분석하고 있습니다'
                          : '고급 AI 모델이 피부를 분석하고 있습니다'
                        }
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="text-center text-sm text-gray-500 mt-8 bg-white/50 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              MediaPipe 얼굴 추적
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              정밀 여드름 마킹
            </span>
            <span className="flex items-center gap-1">
              <Layers className="w-4 h-4" />
              다중 피부 분석
            </span>
            <span className="flex items-center gap-1">
              <Brain className="w-4 h-4" />
              LangChain 멀티에이전트
            </span>
          </div>
          <p>* 얼굴 출입 서비스급 고도화된 시스템으로 정밀한 분석을 제공합니다</p>
          <p>* 모든 분석은 로컬에서 처리되며 개인정보는 저장되지 않습니다</p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSkinAnalyzer;