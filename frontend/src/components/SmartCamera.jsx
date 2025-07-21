// 얼굴 출입 서비스급 스마트 카메라 제어 시스템
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, RotateCw, Zap, CheckCircle, AlertTriangle, Timer, Eye, Sun, Focus } from 'lucide-react';
import OpenCVFaceDetector from './OpenCVFaceDetector';

const SmartCamera = ({ 
  onCapture, 
  onError, 
  isActive = true,
  autoCapture = true,
  qualityChecks = true 
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const qualityCheckInterval = useRef(null);
  
  const [cameraState, setCameraState] = useState({
    isInitialized: false,
    isStreaming: false,
    hasPermission: false,
    error: null
  });
  
  const [captureState, setCaptureState] = useState({
    phase: 'idle', // idle, detecting, preparing, countdown, capturing, complete
    countdown: 0,
    faceStable: false,
    qualityScore: 0,
    canCapture: false
  });
  
  const countdownIntervalRef = useRef(null);
  
  const [qualityMetrics, setQualityMetrics] = useState({
    brightness: 0,
    sharpness: 0,
    contrast: 0,
    faceSize: 0,
    eyeDistance: 0,
    overall: 0
  });

  // 이미지 품질 분석
  const analyzeImageQuality = useCallback((imageData) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // 밝기 분석
          let totalBrightness = 0;
          let pixels = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
            totalBrightness += brightness;
            pixels++;
          }
          
          const avgBrightness = totalBrightness / pixels;
          const brightnessScore = Math.max(0, Math.min(100, 
            avgBrightness < 80 ? (avgBrightness / 80) * 50 :
            avgBrightness > 200 ? 50 + (255 - avgBrightness) / 55 * 50 :
            50 + (avgBrightness - 80) / 120 * 50
          ));
          
          // 대비 분석
          let contrastSum = 0;
          for (let i = 0; i < data.length - 4; i += 4) {
            const current = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const next = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
            contrastSum += Math.abs(current - next);
          }
          
          const avgContrast = contrastSum / (pixels - 1);
          const contrastScore = Math.min(100, (avgContrast / 50) * 100);
          
          // 선명도 분석 (라플라시안 분산)
          const grayscale = [];
          for (let i = 0; i < data.length; i += 4) {
            grayscale.push(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
          }
          
          let laplacianVar = 0;
          const width = canvas.width;
          const height = canvas.height;
          
          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const idx = y * width + x;
              const laplacian = Math.abs(
                -4 * grayscale[idx] +
                grayscale[idx - 1] + grayscale[idx + 1] +
                grayscale[idx - width] + grayscale[idx + width]
              );
              laplacianVar += laplacian;
            }
          }
          
          const sharpnessScore = Math.min(100, (laplacianVar / ((width - 2) * (height - 2))) / 50 * 100);
          
          const overallScore = (brightnessScore + contrastScore + sharpnessScore) / 3;
          
          resolve({
            brightness: Math.round(brightnessScore),
            contrast: Math.round(contrastScore),
            sharpness: Math.round(sharpnessScore),
            overall: Math.round(overallScore)
          });
        };
        
        img.onerror = () => resolve({
          brightness: 0, contrast: 0, sharpness: 0, overall: 0
        });
        
        img.src = imageData;
      });
    } catch (error) {
      console.error('품질 분석 오류:', error);
      return { brightness: 0, contrast: 0, sharpness: 0, overall: 0 };
    }
  }, []);

  // 카메라 초기화
  const initializeCamera = useCallback(async () => {
    try {
      setCameraState(prev => ({ ...prev, error: null }));
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.style.transform = 'scaleX(-1)';
        
        // 메타데이터 로드 대기
        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => reject(new Error('비디오 로드 시간 초과')), 10000);
          
          videoRef.current.onloadedmetadata = () => {
            clearTimeout(timeoutId);
            resolve();
          };
        });
        
        await videoRef.current.play();
        streamRef.current = stream;
        
        setCameraState({
          isInitialized: true,
          isStreaming: true,
          hasPermission: true,
          error: null
        });
        
        // 품질 검사 시작
        if (qualityChecks) {
          startQualityMonitoring();
        }
      }
    } catch (error) {
      console.error('카메라 초기화 실패:', error);
      setCameraState(prev => ({ 
        ...prev, 
        error: error.message || '카메라에 접근할 수 없습니다'
      }));
      if (onError) onError(error);
    }
  }, [qualityChecks, onError, startQualityMonitoring]);

  // 품질 모니터링 시작
  const startQualityMonitoring = useCallback(() => {
    if (qualityCheckInterval.current) {
      clearInterval(qualityCheckInterval.current);
    }
    
    qualityCheckInterval.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || captureState.phase === 'capturing') return;
      
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        const quality = await analyzeImageQuality(imageData);
        
        setQualityMetrics(prev => ({
          ...prev,
          ...quality
        }));
      } catch (error) {
        console.warn('품질 검사 오류:', error);
      }
    }, 1000); // 1초마다 품질 검사
  }, [analyzeImageQuality, captureState.phase]);

  // 얼굴 감지 콜백
  const handleFaceDetected = useCallback((status, faceBox) => {
    if (captureState.phase === 'idle') {
      setCaptureState(prev => ({ ...prev, phase: 'detecting' }));
    }
    
    // 얼굴 크기 분석
    const faceSize = faceBox ? (faceBox.width * faceBox.height) / 10000 : 0;
    
    setQualityMetrics(prev => ({
      ...prev,
      faceSize: Math.round(faceSize * 100)
    }));
  }, [captureState.phase]);

  // 얼굴 안정화 콜백
  const handleFaceStable = useCallback((status, faceBox) => {
    if (!autoCapture) return;
    
    // 더 관대한 조건: 얼굴만 감지되면 바로 캡처 시작
    const canCapture = status.faceDetected && status.confidence > 0.1;
    
    console.log('🔍 얼굴 안정화 체크:', {
      qualityScore: qualityMetrics.overall,
      faceDetected: status.faceDetected,
      confidence: status.confidence,
      canCapture
    });
    
    setCaptureState(prev => ({
      ...prev,
      faceStable: true,
      canCapture,
      phase: canCapture ? 'preparing' : 'detecting'
    }));
    
    if (canCapture && captureState.phase !== 'countdown' && captureState.phase !== 'capturing') {
      console.log('✅ 얼굴 감지됨 - 카운트다운 시작!');
      startCountdown();
    } else {
      console.log('❌ 캡처 조건 미달성:', {
        canCapture,
        currentPhase: captureState.phase,
        faceDetected: status.faceDetected,
        confidence: status.confidence
      });
    }
  }, [autoCapture, qualityMetrics.overall, captureState.phase, startCountdown]);

  // 얼굴 손실 콜백
  const handleFaceLost = useCallback(() => {
    // 카운트다운이 시작되면 얼굴 인식이 끊겨도 계속 진행
    if (captureState.phase === 'countdown' || captureState.phase === 'capturing') {
      console.log('⚠️ 촬영 진행 중 얼굴 인식 끊김 - 하지만 촬영 계속 진행');
      return; // 카운트다운 및 촬영 중에는 절대 중단하지 않음
    }
    
    if (captureState.phase === 'preparing') {
      // preparing 단계에서만 지연된 중단 (3초 후 중단)
      setTimeout(() => {
        if (captureState.phase === 'preparing') { // 여전히 preparing 단계일 경우만 중단
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          
          setCaptureState(prev => ({
            ...prev,
            phase: 'idle',
            countdown: 0,
            faceStable: false,
            canCapture: false
          }));
          
          console.log('🔄 준비 단계에서 얼굴 인식 중단 (3초 지연) - 대기 상태로 복귀');
        }
      }, 3000);
    }
  }, [captureState.phase]);

  // 카운트다운 시작
  const startCountdown = useCallback(() => {
    // 이전 카운트다운이 있으면 정리
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    let count = 3;
    console.log('⏱️ 카운트다운 시작:', count);
    setCaptureState(prev => ({ ...prev, phase: 'countdown', countdown: count }));
    
    countdownIntervalRef.current = setInterval(() => {
      count--;
      console.log('⏱️ 카운트다운:', count);
      setCaptureState(prev => ({ ...prev, countdown: count }));
      
      if (count <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        console.log('📸 카운트다운 완료 - 촬영 시작');
        capturePhoto();
      }
    }, 1000);
  }, [capturePhoto]);

  // 사진 촬영
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setCaptureState(prev => ({ ...prev, phase: 'capturing' }));
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // 고해상도 캡처
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // 좌우 반전된 상태로 캡처
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.95);
      
      // 최종 품질 검사
      const finalQuality = await analyzeImageQuality(imageData);
      
      setCaptureState(prev => ({ 
        ...prev, 
        phase: 'complete',
        qualityScore: finalQuality.overall
      }));
      
      if (onCapture) {
        onCapture(imageData, {
          quality: finalQuality,
          timestamp: new Date().toISOString(),
          resolution: {
            width: video.videoWidth,
            height: video.videoHeight
          }
        });
      }
      
      // 상태 리셋
      setTimeout(() => {
        setCaptureState({
          phase: 'idle',
          countdown: 0,
          faceStable: false,
          qualityScore: 0,
          canCapture: false
        });
      }, 2000);
      
    } catch (error) {
      console.error('사진 촬영 실패:', error);
      setCaptureState(prev => ({ ...prev, phase: 'idle' }));
      if (onError) onError(error);
    }
  }, [analyzeImageQuality, onCapture, onError]);

  // 수동 촬영
  const manualCapture = useCallback(() => {
    if (captureState.faceStable && captureState.canCapture) {
      startCountdown();
    }
  }, [captureState.faceStable, captureState.canCapture, startCountdown]);

  // 카메라 정리
  const cleanup = useCallback(() => {
    if (qualityCheckInterval.current) {
      clearInterval(qualityCheckInterval.current);
    }
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setCameraState({
      isInitialized: false,
      isStreaming: false,
      hasPermission: false,
      error: null
    });
  }, []);

  // 컴포넌트 마운트/언마운트
  useEffect(() => {
    if (isActive && !cameraState.isInitialized) {
      initializeCamera();
    }
    
    return cleanup;
  }, [isActive, cameraState.isInitialized, initializeCamera, cleanup]);

  // 상태별 색상 계산
  const getPhaseColor = () => {
    switch (captureState.phase) {
      case 'idle': return 'text-gray-500';
      case 'detecting': return 'text-blue-500';
      case 'preparing': return 'text-yellow-500';
      case 'countdown': return 'text-orange-500';
      case 'capturing': return 'text-purple-500';
      case 'complete': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getPhaseMessage = () => {
    switch (captureState.phase) {
      case 'idle': return '얼굴을 화면에 맞춰주세요';
      case 'detecting': return '얼굴을 인식하고 있습니다';
      case 'preparing': return '촬영 준비 중입니다';
      case 'countdown': return `${captureState.countdown}초 후 촬영`;
      case 'capturing': return '촬영 중입니다';
      case 'complete': return '촬영이 완료되었습니다';
      default: return '준비 중입니다';
    }
  };

  const getQualityColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (cameraState.error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-6">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">카메라 오류</h3>
          <p className="text-gray-600 mb-4">{cameraState.error}</p>
          <button
            onClick={initializeCamera}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* 비디오 스트림 */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted
      />
      
      <canvas ref={canvasRef} className="hidden" />
      
      {/* OpenCV 얼굴 감지 컴포넌트 */}
      {cameraState.isStreaming && videoRef.current && (
        <OpenCVFaceDetector
          videoRef={videoRef}
          onFaceDetected={handleFaceDetected}
          onFaceStable={handleFaceStable}
          onFaceLost={handleFaceLost}
          isActive={isActive}
          stabilityThreshold={5}
          confidenceThreshold={0.3}
        />
      )}
      
      {/* 상태 정보 패널 */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg min-w-56">
        {/* 촬영 상태 */}
        <div className={`flex items-center gap-2 mb-3 ${getPhaseColor()}`}>
          {captureState.phase === 'countdown' ? (
            <Timer className="w-5 h-5 animate-pulse" />
          ) : captureState.phase === 'capturing' ? (
            <Camera className="w-5 h-5 animate-bounce" />
          ) : (
            <Zap className="w-5 h-5" />
          )}
          <span className="font-medium">{getPhaseMessage()}</span>
        </div>
        
        {/* 카운트다운 */}
        {captureState.phase === 'countdown' && (
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-orange-400 animate-pulse">
              {captureState.countdown}
            </div>
          </div>
        )}
        
        {/* 품질 지표 */}
        {qualityChecks && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <Sun className="w-4 h-4" />
                밝기
              </span>
              <span className={getQualityColor(qualityMetrics.brightness)}>
                {qualityMetrics.brightness}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <Focus className="w-4 h-4" />
                선명도
              </span>
              <span className={getQualityColor(qualityMetrics.sharpness)}>
                {qualityMetrics.sharpness}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                대비
              </span>
              <span className={getQualityColor(qualityMetrics.contrast)}>
                {qualityMetrics.contrast}%
              </span>
            </div>
            
            <div className="pt-2 border-t border-gray-600">
              <div className="flex justify-between items-center font-medium">
                <span>종합 품질</span>
                <span className={getQualityColor(qualityMetrics.overall)}>
                  {qualityMetrics.overall}%
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* 촬영 완료 정보 */}
        {captureState.phase === 'complete' && (
          <div className="mt-3 p-3 bg-green-900 bg-opacity-50 rounded">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">촬영 완료!</span>
            </div>
            <div className="text-sm mt-1">
              품질 점수: {captureState.qualityScore}%
            </div>
          </div>
        )}
      </div>
      
      {/* 수동 촬영 버튼 */}
      {!autoCapture && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <button
            onClick={manualCapture}
            disabled={!captureState.canCapture || captureState.phase === 'countdown' || captureState.phase === 'capturing'}
            className="w-16 h-16 bg-white bg-opacity-20 hover:bg-opacity-30 disabled:bg-opacity-10 rounded-full flex items-center justify-center border-4 border-white border-opacity-50 transition-all duration-200 transform hover:scale-110 disabled:scale-100 disabled:cursor-not-allowed"
          >
            <Camera className="w-8 h-8 text-white" />
          </button>
        </div>
      )}
      
      {/* 품질 가이드 */}
      {qualityMetrics.overall < 70 && (
        <div className="absolute bottom-4 left-4 bg-yellow-900 bg-opacity-75 text-yellow-200 p-3 rounded-lg max-w-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">촬영 품질 가이드</span>
          </div>
          <ul className="text-xs space-y-1">
            {qualityMetrics.brightness < 60 && <li>• 더 밝은 곳으로 이동하세요</li>}
            {qualityMetrics.sharpness < 60 && <li>• 카메라를 고정하고 움직이지 마세요</li>}
            {qualityMetrics.contrast < 60 && <li>• 배경과 대비가 명확한 곳에서 촬영하세요</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SmartCamera;