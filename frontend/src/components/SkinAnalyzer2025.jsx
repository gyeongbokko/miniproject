// 2025년 최신 React 피부 분석기 컴포넌트
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, RotateCw, CheckCircle, AlertCircle, Loader, Sparkles, Brain, Zap } from 'lucide-react';

const SkinAnalyzer2025 = () => {
  const [currentStep, setCurrentStep] = useState('capture');
  const [capturedImage, setCapturedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [countDown, setCountDown] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const faceCheckInterval = useRef(null);
  const countDownInterval = useRef(null);
  const dropZoneRef = useRef(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const imageRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const API_BASE_URL = 'http://localhost:8000';

  // 카메라 정리 함수 추가
  const stopCamera = useCallback(() => {
    console.log('카메라 정리 시작');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    console.log('카메라 정리 완료');
  }, []);

  // 2025년 고화질 사진 촬영 (공통)
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('비디오 또는 캔버스 요소가 없음');
      return;
    }

    console.log('사진 촬영 시작');
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // 비디오가 준비되지 않은 경우 캡처하지 않음
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('비디오가 아직 준비되지 않았습니다');
      return;
    }
    
    // 고화질 캡처를 위한 캔버스 크기 설정
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // 비디오가 좌우 반전되어 있으므로, 캔버스에도 동일하게 반전 적용
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 캔버스 변환 초기화
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    try {
      const imageData = canvas.toDataURL('image/jpeg', 0.95);
      console.log('촬영된 이미지 크기:', imageData.length);
      
      // 이미지 데이터가 유효한지 확인
      if (imageData.length < 1000) {
        console.error('캡처된 이미지가 너무 작습니다');
        setError('사진 촬영에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      // 이미지가 유효한 경우에만 상태 업데이트
      setCapturedImage(imageData);
      setCurrentStep('capture');
      
      // 이미지 로드 테스트
      const testImage = new Image();
      testImage.onload = () => {
        console.log('캡처된 이미지 확인 완료:', {
          width: testImage.width,
          height: testImage.height
        });
        
        // 이미지가 정상적으로 로드된 경우에만 카메라 정지
        if (testImage.width > 0 && testImage.height > 0) {
          stopCamera();
          setFaceDetected(false);
        } else {
          console.error('캡처된 이미지가 유효하지 않습니다');
          setError('사진 촬영에 실패했습니다. 다시 시도해주세요.');
        }
      };
      
      testImage.onerror = () => {
        console.error('이미지 확인 중 오류 발생');
        setError('사진 촬영에 실패했습니다. 다시 시도해주세요.');
      };
      
      testImage.src = imageData;
      
    } catch (error) {
      console.error('이미지 캡처 오류:', error);
      setError('사진 촬영에 실패했습니다.');
    }
  }, [stopCamera]);

  // 카운트다운 시작
  const startCountDown = useCallback(() => {
    console.log('카운트다운 시작 시도');
    
    // 비디오 준비 상태 확인
    if (!videoRef.current || videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      console.log('비디오가 아직 준비되지 않아 카운트다운을 시작하지 않습니다.');
      return;
    }

    console.log('비디오 준비 완료, 카운트다운 시작:', {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight
    });

    if (countDownInterval.current) {
      clearInterval(countDownInterval.current);
    }
    
    setCountDown(3);
    countDownInterval.current = setInterval(() => {
      setCountDown(prev => {
        if (prev <= 1) {
          clearInterval(countDownInterval.current);
          // 캡처 직전 마지막으로 비디오 상태 확인
          if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
            capturePhoto();
          } else {
            console.error('캡처 시점에 비디오가 준비되지 않음');
            setError('카메라가 준비되지 않았습니다. 다시 시도해주세요.');
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [capturePhoto]);

  // 얼굴 감지 상태 확인
  const checkFaceDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    const video = videoRef.current;
    
    // 비디오가 준비되지 않은 경우 얼굴 감지를 시도하지 않음
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('비디오가 아직 준비되지 않았습니다.');
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(video, 0, 0);
    
    try {
      const imageData = canvas.toDataURL('image/jpeg', 0.95);
      
      const response = await fetch(`${API_BASE_URL}/analyze-skin-base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('얼굴 감지 응답 오류:', errorData);
        throw new Error(errorData.detail || '얼굴 감지 실패');
      }
      
      const data = await response.json();
      console.log('얼굴 감지 응답:', data);
      
      const newFaceDetected = data.result.face_detected && data.result.confidence >= 0.8;
      
      // 얼굴 감지 상태가 변경되었을 때
      if (newFaceDetected !== faceDetected) {
        setFaceDetected(newFaceDetected);
        
        if (newFaceDetected && !countDown) {
          console.log('얼굴 감지됨, 카운트다운 시작 시도');
          // 비디오가 준비된 상태에서만 카운트다운 시작
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            startCountDown();
          } else {
            console.log('비디오가 준비되지 않아 카운트다운을 연기합니다.');
          }
        }
      }
      
      // 카운트다운 중 얼굴이 감지되지 않으면 초기화
      if (!newFaceDetected && countDown) {
        console.log('카운트다운 중 얼굴 감지 실패, 카운트다운 초기화');
        clearInterval(countDownInterval.current);
        setCountDown(null);
      }
      
    } catch (error) {
      console.error('얼굴 감지 오류:', error);
      setFaceDetected(false);
      // 에러 발생 시 카운트다운 초기화
      if (countDown) {
        clearInterval(countDownInterval.current);
        setCountDown(null);
      }
    }
  }, [API_BASE_URL, cameraActive, faceDetected, countDown, startCountDown]);

  // 2025년 API 상태 확인
  const checkApiHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        setApiStatus('connected');
        console.log('🚀 2025년 AI 서버 연결됨:', data.version);
      } else {
        setApiStatus('error');
      }
    } catch (error) {
      console.error('API 연결 실패:', error);
      setApiStatus('error');
    }
  }, []);

  useEffect(() => {
    checkApiHealth();
    // 5분마다 상태 확인
    const interval = setInterval(checkApiHealth, 300000);
    return () => clearInterval(interval);
  }, [checkApiHealth]);

  // 카메라 시작 (2025년 최신 웹캠 API)
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      console.log('카메라 시작 시도...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30 }
        }
      });
      
      console.log('카메라 스트림 획득 성공:', stream);
      
      // 먼저 카메라 활성화 상태를 변경하여 비디오 요소를 렌더링
      setCameraActive(true);
      streamRef.current = stream;
      
      // 비디오 요소가 렌더링될 때까지 대기
      const initVideo = () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.style.transform = 'scaleX(-1)';  // 화면 좌우 반전
          
          // 비디오 메타데이터 로드 완료 시 처리
          videoRef.current.onloadedmetadata = () => {
            console.log('비디오 메타데이터 로드 완료');
            videoRef.current.play().catch(e => {
              console.error('비디오 재생 오류:', e);
              setError('비디오 재생에 실패했습니다.');
            });
          };

          // 비디오가 실제로 재생 가능한 상태가 되었을 때 처리
          videoRef.current.oncanplay = () => {
            const { videoWidth, videoHeight } = videoRef.current;
            console.log('비디오 재생 준비 완료:', { videoWidth, videoHeight });
            
            // 비디오 크기가 유효한지 확인
            if (videoWidth === 0 || videoHeight === 0) {
              console.error('비디오 크기가 유효하지 않음');
              setError('카메라 초기화에 실패했습니다. 다시 시도해주세요.');
              stopCamera();
            }
          };
        } else {
          console.log('비디오 요소가 아직 준비되지 않음, 재시도...');
          setTimeout(initVideo, 100);
        }
      };

      initVideo();
      
    } catch (error) {
      console.error('카메라 접근 오류:', error);
      setError('카메라 접근에 실패했습니다.');
      setCameraActive(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [stopCamera]);

  // 컴포넌트 정리
  useEffect(() => {
    return () => {
      if (faceCheckInterval.current) {
        clearInterval(faceCheckInterval.current);
      }
      if (countDownInterval.current) {
        clearInterval(countDownInterval.current);
      }
    };
  }, []);

  // 카메라 시작 시 얼굴 감지 시작
  useEffect(() => {
    if (cameraActive && videoRef.current) {
      // 더 자주 체크하도록 간격 줄임 (1초 -> 500ms)
      faceCheckInterval.current = setInterval(checkFaceDetection, 500);
      return () => {
        if (faceCheckInterval.current) {
          clearInterval(faceCheckInterval.current);
        }
      };
    }
  }, [cameraActive, checkFaceDetection]);

  // 카메라 렌더링
  const renderCamera = () => (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100 relative">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
          style={{
            transform: 'scaleX(-1)',  // 화면 좌우 반전
            backgroundColor: '#000',
          }}
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      {/* 얼굴 인식 상태 표시 */}
      <div className="absolute top-4 left-4 p-2 rounded-lg bg-black bg-opacity-50 text-white">
        {faceDetected ? (
          countDown ? (
            <span className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              {countDown}초 후 촬영
            </span>
          ) : (
            <span className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              얼굴 인식됨
            </span>
          )
        ) : (
          <span className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
            얼굴을 인식할 수 없습니다
          </span>
        )}
      </div>

      {/* 얼굴 가이드라인 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 w-48 h-60 border-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg ${
          faceDetected ? 'border-green-500 border-4' : 'border-red-500'
        }`}></div>
      </div>
    </div>
  );

  // 파일 업로드 (2025년 향상된 검증)
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드 가능합니다.');
        return;
      }

      // 파일 크기 제한 (20MB)
      if (file.size > 20 * 1024 * 1024) {
        setError('파일 크기는 20MB 이하여야 합니다.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        console.log('이미지 로드 완료:', imageData.substring(0, 50) + '...');
        setCapturedImage(imageData);
        setCurrentStep('capture');
        setError(null);
      };
      reader.onerror = () => {
        console.error('파일 읽기 오류');
        setError('파일을 읽는 중 오류가 발생했습니다.');
      };
      reader.readAsDataURL(file);
    }
  };

  // 드래그 앤 드롭 이벤트 핸들러
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // 이미지 파일 검증
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드 가능합니다.');
        return;
      }

      // 파일 크기 검증 (10MB 제한)
      if (file.size > 10 * 1024 * 1024) {
        setError('파일 크기는 10MB 이하여야 합니다.');
        return;
      }

      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = e.target.result;
          console.log('이미지 로드 완료:', imageData.substring(0, 50) + '...');
          setCapturedImage(imageData);
          setCurrentStep('capture');
          setError(null);
        };
        reader.onerror = () => {
          console.error('파일 읽기 오류');
          setError('파일을 읽는 중 오류가 발생했습니다.');
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('파일 처리 오류:', error);
        setError('파일을 처리하는 중 오류가 발생했습니다.');
      }
    }
  };

  // 드래그 앤 드롭 영역 렌더링
  const renderDropZone = () => (
    <div
      ref={dropZoneRef}
      className={`relative w-full h-64 border-2 border-dashed rounded-lg p-4 text-center 
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} 
        transition-all duration-200 ease-in-out`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Upload className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700">
          {isDragging ? '파일을 여기에 놓아주세요' : '이미지를 드래그하여 업로드하세요'}
        </p>
        <p className="text-sm text-gray-500 mt-2">또는</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
            transition-colors duration-200"
        >
          파일 선택
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );

  // 2025년 최신 AI 피부 분석
  const analyzeSkin = async () => {
    if (!capturedImage) {
      setError('분석할 이미지가 없습니다.');
      return;
    }

    if (apiStatus !== 'connected') {
      setError('AI 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsLoading(true);
    setCurrentStep('analyzing');
    setError(null);
    setAnalysisProgress(0);

    // 프로그레스 시뮬레이션
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze-skin-base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: capturedImage
        }),
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '분석 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      
      if (data.success && data.result) {
        if (!data.result.face_detected) {
          throw new Error('얼굴을 찾을 수 없습니다. 정면을 바라보고 밝은 곳에서 다시 촬영해주세요.');
        }
        
        setAnalysisResult(data.result);
        setCurrentStep('result');
        
        // 성공 애니메이션
        setTimeout(() => {
          setAnalysisProgress(0);
        }, 1000);
      } else {
        throw new Error('분석 결과를 받을 수 없습니다.');
      }

    } catch (error) {
      console.error('피부 분석 오류:', error);
      setError(error.message || '분석 중 오류가 발생했습니다.');
      setCurrentStep('capture');
      clearInterval(progressInterval);
    } finally {
      setIsLoading(false);
    }
  };

  // 2025년 최신 제품 추천 (더 세분화됨)
  const getRecommendations = (skinType) => {
    const recommendations = {
      '건성': [
        { type: '클렌저', product: '크림/오일 클렌저', reason: '수분 보존하며 부드럽게 세정', priority: '높음' },
        { type: '토너', product: '하이드레이팅 에센스 토너', reason: '즉각적인 수분 공급', priority: '높음' },
        { type: '세럼', product: '히알루론산 + 세라마이드 세럼', reason: '깊은 수분 공급 및 보습막 형성', priority: '필수' },
        { type: '크림', product: '고영양 슬리핑 크림', reason: '수분 장벽 강화 및 야간 집중 케어', priority: '필수' }
      ],
      '지성': [
        { type: '클렌저', product: '살리실산 젤 클렌저', reason: '과도한 유분 제거 및 모공 케어', priority: '필수' },
        { type: '토너', product: 'BHA + 나이아신아마이드 토너', reason: '모공 관리 및 피지 조절', priority: '높음' },
        { type: '세럼', product: '레티놀 + 나이아신아마이드 세럼', reason: '피지 분비 조절 및 모공 수축', priority: '높음' },
        { type: '크림', product: '논코메도제닉 수분 크림', reason: '유분 밸런스 조절', priority: '보통' }
      ],
      '복합성': [
        { type: '클렌저', product: '아미노산 젤 클렌저', reason: '균형 잡힌 세정력', priority: '높음' },
        { type: '토너', product: '듀얼 기능 밸런싱 토너', reason: 'T존-U존 차별 케어', priority: '필수' },
        { type: '세럼', product: '비타민C + E 듀얼 세럼', reason: '전체적인 피부 톤 개선', priority: '높음' },
        { type: '크림', product: '어댑티브 모이스처라이저', reason: '부위별 맞춤 보습', priority: '높음' }
      ],
      '민감성': [
        { type: '클렌저', product: '센텔라 순한 클렌저', reason: '자극 최소화하며 부드럽게 세정', priority: '필수' },
        { type: '토너', product: '알로에 + 판테놀 진정 토너', reason: '피부 진정 및 수분 공급', priority: '필수' },
        { type: '세럼', product: '센텔라 + 마데카소사이드 세럼', reason: '진정 및 피부 재생', priority: '필수' },
        { type: '크림', product: '베리어 리페어 크림', reason: '피부 보호막 강화', priority: '필수' }
      ],
      '완벽': [
        { type: '클렌저', product: '프리미엄 효소 클렌저', reason: '완벽한 피부 유지', priority: '보통' },
        { type: '토너', product: '비타민 부스터 토너', reason: '영양 공급 및 광채 강화', priority: '보통' },
        { type: '세럼', product: '멀티 펩타이드 안티에이징 세럼', reason: '예방적 노화 방지', priority: '보통' },
        { type: '크림', product: '프리미엄 안티에이징 크림', reason: '완벽한 피부 유지', priority: '보통' }
      ],
      '정상': [
        { type: '클렌저', product: '마일드 폼 클렌저', reason: '기본적인 세정', priority: '보통' },
        { type: '토너', product: '밸런싱 토너', reason: '수분 밸런스 유지', priority: '보통' },
        { type: '세럼', product: '비타민C 세럼', reason: '피부 컨디션 유지', priority: '보통' },
        { type: '크림', product: '데일리 모이스처라이저', reason: '일상적인 보습', priority: '보통' }
      ]
    };
    
    return recommendations[skinType] || recommendations['정상'];
  };

  // 신뢰도 및 품질 표시
  const getConfidenceLevel = (confidence) => {
    if (confidence >= 0.9) return { level: '매우 높음', color: 'text-green-600', bg: 'bg-green-100' };
    if (confidence >= 0.8) return { level: '높음', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (confidence >= 0.7) return { level: '보통', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: '낮음', color: 'text-red-600', bg: 'bg-red-100' };
  };

  // 우선순위별 색상
  const getPriorityColor = (priority) => {
    switch (priority) {
      case '필수': return 'bg-red-100 text-red-700 border-red-200';
      case '높음': return 'bg-orange-100 text-orange-700 border-orange-200';
      case '보통': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const resetAnalysis = () => {
    setCurrentStep('capture');
    setCapturedImage(null);
    setAnalysisResult(null);
    setIsLoading(false);
    setError(null);
    setAnalysisProgress(0);
  };

  useEffect(() => {
    console.log('컴포넌트가 마운트되었습니다');
    return () => {
      console.log('컴포넌트가 언마운트됩니다');
      stopCamera();
    };
  }, []);

  useEffect(() => {
    console.log('카메라 활성 상태가 변경되었습니다:', cameraActive);
    if (cameraActive) {
      startCamera();
    }
  }, [cameraActive, startCamera]);

  // 이미지 크기에 따른 스케일 계산
  useEffect(() => {
    const calculateScale = () => {
      if (imageRef.current && analysisResult?.analyzed_width > 0) {
        setScale({
          x: imageRef.current.clientWidth / analysisResult.analyzed_width,
          y: imageRef.current.clientHeight / analysisResult.analyzed_height,
        });
      }
    };
    
    const img = imageRef.current;
    if (img?.complete) {
      calculateScale();
    } else if (img) {
      img.onload = calculateScale;
    }
    
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [analysisResult]);

  // drawAcneBoundaries 함수를 useCallback으로 감싸서 메모이제이션
  const drawAcneBoundaries = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !analysisResult?.acne_lesions) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    // 캔버스 크기를 이미지 표시 크기에 맞춤
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 여드름 위치 표시
    analysisResult.acne_lesions.forEach(lesion => {
      const x = lesion.x * scale.x;
      const y = lesion.y * scale.y;
      const width = lesion.width * scale.x;
      const height = lesion.height * scale.y;

      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // 신뢰도 표시
      ctx.fillStyle = 'red';
      ctx.font = '12px Arial';
      ctx.fillText(`${Math.round(lesion.confidence * 100)}%`, x, y - 5);
    });
  }, [analysisResult?.acne_lesions, scale]);

  // 이미지 로드 및 크기 변경 시 스케일 업데이트
  useEffect(() => {
    if (imageRef.current && analysisResult?.acne_lesions && imageLoaded) {
      const img = imageRef.current;
      const newScale = {
        x: img.clientWidth / img.naturalWidth,
        y: img.clientHeight / img.naturalHeight
      };

      // 스케일이 실제로 변경되었을 때만 업데이트
      if (newScale.x !== scale.x || newScale.y !== scale.y) {
        setScale(newScale);
      }
    }
  }, [imageLoaded, analysisResult?.acne_lesions]);

  // 스케일이 변경될 때만 여드름 경계 다시 그리기
  useEffect(() => {
    if (imageLoaded && analysisResult?.acne_lesions) {
      drawAcneBoundaries();
    }
  }, [scale, drawAcneBoundaries, imageLoaded, analysisResult?.acne_lesions]);

  // 윈도우 리사이즈 이벤트 처리
  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current && analysisResult?.acne_lesions && imageLoaded) {
        const img = imageRef.current;
        const newScale = {
          x: img.clientWidth / img.naturalWidth,
          y: img.clientHeight / img.naturalHeight
        };
        setScale(newScale);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imageLoaded, analysisResult?.acne_lesions]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    if (imageRef.current && analysisResult) {
      const img = imageRef.current;
      setScale({
        x: img.clientWidth / img.naturalWidth,
        y: img.clientHeight / img.naturalHeight
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
      <div className="max-w-md mx-auto">
        {/* 2025년 최신 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Brain className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              AI 피부 분석기
            </h1>
            <Sparkles className="w-6 h-6 text-pink-500" />
          </div>
          <p className="text-gray-600 mb-2">
            2025년 최신 AI 기술로 피부 상태를 정밀 분석합니다
          </p>
          
          {/* API 연결 상태 (2025년 디자인) */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${
              apiStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
              apiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
            }`}></div>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              {apiStatus === 'connected' ? (
                <>
                  <Zap className="w-3 h-3" />
                  AI 서버 연결됨
                </>
              ) : 
               apiStatus === 'error' ? 'AI 서버 연결 실패' : 'AI 서버 확인 중...'}
            </span>
          </div>
          
          <div className="text-xs text-gray-400">
            Advanced AI • Real-time Analysis • 2025 Technology
          </div>
        </div>

        {/* 에러 메시지 (2025년 디자인) */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-800 font-medium text-sm">오류 발생</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* 메인 카드 (2025년 글래스모피즘) */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 mb-6">
          
          {/* 1단계: 사진 촬영/업로드 */}
          {currentStep === 'capture' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-80 h-80 bg-white rounded-3xl mx-auto relative overflow-hidden shadow-xl">
                  {cameraActive ? (
                    <>
                      {renderCamera()}
                      {/* 2025년 얼굴 가이드라인 */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 w-48 h-60 border-2 border-white/60 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg"></div>
                      </div>
                    </>
                  ) : capturedImage ? (
                    <div className="w-full h-full bg-white rounded-3xl p-4">
                      <div className="w-full h-full relative rounded-2xl overflow-hidden bg-gray-50">
                        <img 
                          ref={imageRef} 
                          src={capturedImage} 
                          alt="촬영된 이미지" 
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{
                            objectPosition: 'center',
                            transform: `scale(${scale.x}, ${scale.y})`
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      ref={dropZoneRef}
                      className={`absolute inset-0 flex flex-col items-center justify-center p-4 text-center transition-all duration-200 ease-in-out border-2 border-dashed
                        ${isDragging ? 'bg-blue-50 border-blue-500' : 'border-gray-300'}`}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <Upload size={64} className={`mb-4 transition-colors duration-200 ${isDragging ? 'text-blue-500' : 'text-gray-300'}`} />
                      <h3 className={`text-lg font-semibold mb-2 transition-colors duration-200 ${isDragging ? 'text-blue-600' : 'text-gray-700'}`}>
                        {isDragging ? '여기에 놓아주세요' : '피부 분석을 시작하세요'}
                      </h3>
                      <p className={`text-sm transition-colors duration-200 ${isDragging ? 'text-blue-500' : 'text-gray-500'}`}>
                        {isDragging ? '사진을 놓으면 자동으로 업로드됩니다' : '사진을 드래그하거나 업로드하세요'}
                      </p>
                      <p className="text-xs mt-2 text-gray-500">정면 얼굴이 명확히 보이는 사진을 사용해주세요</p>
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {capturedImage && !cameraActive && (
                <div className="space-y-3 max-w-xs mx-auto">
                  <button
                    onClick={analyzeSkin}
                    disabled={apiStatus !== 'connected' || isLoading}
                    className="w-full bg-blue-500 text-white py-4 px-6 rounded-2xl font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    <Brain size={24} />
                    <span>AI 피부 분석 시작</span>
                  </button>
                  
                  <button
                    onClick={resetAnalysis}
                    disabled={isLoading}
                    className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-gray-200 transition-all disabled:opacity-50 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  >
                    <RotateCw size={20} />
                    <span>다시 촬영</span>
                  </button>
                </div>
              )}

              {!cameraActive && !capturedImage && (
                <div className="space-y-3 max-w-xs mx-auto">
                  <button
                    onClick={() => {
                      console.log('카메라 버튼 클릭됨');
                      console.log('API 상태:', apiStatus);
                      console.log('카메라 활성 상태:', cameraActive);
                      setCameraActive(true);
                    }}
                    disabled={apiStatus !== 'connected'}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    <Camera size={24} />
                    <span>AI 카메라로 촬영</span>
                  </button>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={apiStatus !== 'connected'}
                    className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  >
                    <Upload size={24} />
                    <span>갤러리에서 선택</span>
                  </button>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* 2단계: 분석 중 (2025년 향상된 UI) */}
          {currentStep === 'analyzing' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <Brain className="absolute inset-0 w-8 h-8 m-auto text-blue-500" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI가 피부를 분석하고 있어요
                <Sparkles className="w-5 h-5 text-purple-500" />
              </h3>
              
              {/* 2025년 프로그레스 바 */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${analysisProgress}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 mb-4">{Math.round(analysisProgress)}% 완료</div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>고해상도 얼굴 감지 중...</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  <span>AI 피부 분할 및 텍스처 분석 중...</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                  <span>피부 타입 및 상태 분류 중...</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
                  <span>맞춤형 제품 추천 생성 중...</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-6">2025년 최신 AI 기술로 정밀 분석 중...</p>
            </div>
          )}

          {/* 3단계: 분석 결과 (2025년 향상된 UI) */}
          {currentStep === 'result' && analysisResult && (
            <div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                  AI 분석 완료!
                </h3>
                <p className="text-gray-600 mb-3">
                  당신의 피부 타입은 <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 text-lg">{analysisResult.skin_type}</span>입니다
                </p>
                
                {/* 분석 신뢰도 (2025년 디자인) */}
                {analysisResult.confidence && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-sm text-gray-500">AI 분석 신뢰도:</span>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${getConfidenceLevel(analysisResult.confidence).bg} ${getConfidenceLevel(analysisResult.confidence).color}`}>
                      {getConfidenceLevel(analysisResult.confidence).level} ({Math.round(analysisResult.confidence * 100)}%)
                    </span>
                  </div>
                )}
              </div>

              {/* 피부색 표시 (2025년 개선) */}
              {analysisResult.avg_skin_color && (
                <div className="text-center mb-6">
                  <div 
                    className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-white shadow-lg"
                    style={{ 
                      backgroundColor: `rgb(${Math.floor(analysisResult.avg_skin_color.r)}, ${Math.floor(analysisResult.avg_skin_color.g)}, ${Math.floor(analysisResult.avg_skin_color.b)})` 
                    }}
                  ></div>
                  <p className="text-sm text-gray-600 font-medium">AI가 분석한 당신의 피부색</p>
                  <p className="text-xs text-gray-500">{analysisResult.skin_tone}</p>
                </div>
              )}

              {/* 분석된 이미지와 여드름 위치 표시 */}
              <div className="relative mb-6 rounded-2xl overflow-hidden shadow-lg">
                <img 
                  ref={imageRef}
                  src={capturedImage}
                  alt="분석된 이미지"
                  className="w-full h-auto"
                  onLoad={handleImageLoad}
                />
                {analysisResult.acne_lesions && analysisResult.acne_lesions.map((lesion, index) => (
                  <div
                    key={index}
                    className="absolute border-2 border-red-500 rounded-sm"
                    style={{
                      left: `${lesion.x * scale.x}px`,
                      top: `${lesion.y * scale.y}px`,
                      width: `${lesion.width * scale.x}px`,
                      height: `${lesion.height * scale.y}px`,
                      backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    }}
                  >
                    <div className="absolute -top-5 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      {Math.round(lesion.confidence * 100)}%
                    </div>
                  </div>
                ))}
              </div>

              {/* 여드름 감지 요약 */}
              {analysisResult.acne_lesions && analysisResult.acne_lesions.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4 mb-6">
                  <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    여드름 감지 결과
                  </h4>
                  <p className="text-sm text-red-700">
                    총 {analysisResult.acne_lesions.length}개의 여드름이 감지되었습니다.
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    * 빨간색 박스는 AI가 감지한 여드름 위치를 나타냅니다.
                  </p>
                </div>
              )}

              {/* 분석 결과 상세 (2025년 카드 디자인) */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-4 text-center">
                  <div className="text-3xl font-bold text-pink-600 mb-1">{analysisResult.moisture_level}%</div>
                  <div className="text-sm text-gray-700 mb-2">수분도</div>
                  <div className="w-full bg-pink-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-pink-400 to-pink-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${analysisResult.moisture_level}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">{analysisResult.oil_level}%</div>
                  <div className="text-sm text-gray-700 mb-2">유분도</div>
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${analysisResult.oil_level}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1">{analysisResult.blemish_count}</div>
                  <div className="text-sm text-gray-700">잡티 개수</div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{analysisResult.overall_score}</div>
                  <div className="text-sm text-gray-700">종합 점수</div>
                </div>
              </div>

              {/* 상세 정보 (2025년 디자인) */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 mb-6">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-500" />
                  AI 상세 분석 결과
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">피부톤</span>
                    <span className="font-semibold text-gray-800">{analysisResult.skin_tone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">예상 연령대</span>
                    <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                      {analysisResult.age_range}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">연령 분석 신뢰도</span>
                    <span className="font-semibold text-gray-800">
                      {Math.round(analysisResult.age_confidence * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">주름 정도</span>
                    <span className="font-semibold text-gray-800">{analysisResult.wrinkle_level}/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">모공 크기</span>
                    <span className="font-semibold text-gray-800">{analysisResult.pore_size}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">피부 면적</span>
                    <span className="font-semibold text-gray-800">{Math.round(analysisResult.skin_area_percentage)}%</span>
                  </div>
                </div>
              </div>

              {/* 2025년 최신 제품 추천 */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">{analysisResult.skin_type}</span>
                  피부를 위한 AI 맞춤 추천
                </h4>
                <div className="space-y-3">
                  {getRecommendations(analysisResult.skin_type).map((rec, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full font-semibold">
                            {rec.type}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getPriorityColor(rec.priority)}`}>
                            {rec.priority}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-800 mb-1">{rec.product}</div>
                      <div className="text-xs text-gray-600">{rec.reason}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 피부 관리 팁 (2025년 추가) */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-6">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  {analysisResult.skin_type} 피부 전문 관리법
                </h4>
                <div className="text-sm text-gray-700 space-y-2">
                  {analysisResult.skin_type === '건성' && (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 text-xs mt-1">💧</span>
                        <span>하루 8잔 이상의 물을 마시고, 실내 습도를 50-60%로 유지하세요</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 text-xs mt-1">🌡️</span>
                        <span>미지근한 물(32-37°C)로 세안하고, 세안 후 3분 이내 보습제를 발라주세요</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 text-xs mt-1">🥑</span>
                        <span>오메가-3가 풍부한 견과류, 아보카도 등을 섭취하세요</span>
                      </div>
                    </>
                  )}
                  {analysisResult.skin_type === '지성' && (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 text-xs mt-1">🧼</span>
                        <span>하루 2회 이상 세안하지 말고, 과도한 세정은 피지 분비를 증가시킵니다</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 text-xs mt-1">🥬</span>
                        <span>기름진 음식을 줄이고, 녹색 채소와 비타민 B 복합체를 섭취하세요</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 text-xs mt-1">❄️</span>
                        <span>논코메도제닉 제품을 사용하고, 주 1-2회 클레이 마스크를 활용하세요</span>
                      </div>
                    </>
                  )}
                  {analysisResult.skin_type === '복합성' && (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 text-xs mt-1">⚖️</span>
                        <span>T존과 U존을 구분해서 관리하세요 (T존: 유분 조절, U존: 수분 공급)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 text-xs mt-1">🌿</span>
                        <span>균형 잡힌 식단과 충분한 수면(7-8시간)을 유지하세요</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 text-xs mt-1">🎯</span>
                        <span>부위별 맞춤 제품을 사용하거나 듀얼 기능 제품을 선택하세요</span>
                      </div>
                    </>
                  )}
                  {analysisResult.skin_type === '민감성' && (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 text-xs mt-1">🧪</span>
                        <span>새로운 제품 사용 전 48시간 패치 테스트를 필수로 진행하세요</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 text-xs mt-1">☀️</span>
                        <span>SPF 30 이상의 자외선 차단제를 매일 사용하세요</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 text-xs mt-1">😌</span>
                        <span>스트레스 관리와 충분한 휴식을 취하고, 자극적인 성분을 피하세요</span>
                      </div>
                    </>
                  )}
                  {(analysisResult.skin_type === '완벽' || analysisResult.skin_type === '정상') && (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 text-xs mt-1">✨</span>
                        <span>현재 상태를 유지하기 위해 꾸준한 기본 관리를 지속하세요</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 text-xs mt-1">🔄</span>
                        <span>계절 변화에 맞춰 제품을 조정하고, 정기적인 피부 체크를 하세요</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 text-xs mt-1">🍃</span>
                        <span>항산화 성분이 풍부한 음식과 규칙적인 운동으로 건강을 유지하세요</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 재분석 버튼 */}
              <button
                onClick={resetAnalysis}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 px-6 rounded-2xl font-bold hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <RotateCw size={20} />
                다시 분석하기
              </button>
            </div>
          )}
        </div>

        {/* 하단 정보 (2025년 디자인) */}
        <div className="text-center text-xs text-gray-500 space-y-1 bg-white/50 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Brain className="w-4 h-4" />
            <span className="font-semibold">2025년 최신 AI 기술 적용</span>
          </div>
          <p>* AI 분석 결과는 참고용이며, 정확한 진단은 피부과 전문의와 상담하세요</p>
          <p>* 개인정보는 분석 후 즉시 삭제되며, 어떠한 데이터도 저장되지 않습니다</p>
          <p>* 고해상도 정면 사진을 사용하면 더 정확한 분석이 가능합니다</p>
          <div className="flex items-center justify-center gap-4 text-xs pt-2 border-t border-gray-200 mt-3">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Advanced AI
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Real-time
            </span>
            <span className="flex items-center gap-1">
              <Brain className="w-3 h-3" />
              95%+ Accuracy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkinAnalyzer2025;