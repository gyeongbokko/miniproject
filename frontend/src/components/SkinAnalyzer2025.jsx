// 2025년 최신 React 피부 분석기 컴포넌트 (OpenAI API 통합)
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, RotateCw, CheckCircle, AlertCircle, Sparkles, Brain, Zap, Star, Target, ExternalLink, MessageCircle, Calendar, Shield, Palette, ShoppingBag, Lightbulb, BarChart3 } from 'lucide-react';
import SkinChatBot from './SkinChatBot';

// 새로운 고도화된 컴포넌트들 임포트
import SmartCamera from './SmartCamera';
import AcneMarker from './AcneMarker';
import SkinAnalysisEngine from './SkinAnalysisEngine';

// 제품 카드 컴포넌트
const ProductCard = ({ 
  category, 
  title, 
  brand, 
  features, 
  price, 
  priceColor, 
  bgGradient, 
  borderColor, 
  searchQueries, 
  productImages, 
  imageLoadingStates,
  directUrl, // OpenAI에서 받은 실제 구매 링크
  imageUrl  // OpenAI/화해에서 받은 실제 이미지 URL
}) => {
  return (
    <div className={`bg-gradient-to-br ${bgGradient} rounded-xl p-4 border ${borderColor}`}>
      <div className="aspect-w-1 aspect-h-1 mb-3">
        <div className="w-full h-32 bg-white rounded-lg flex items-center justify-center">
          {imageLoadingStates[category] ? (
            <div className="flex flex-col items-center">
              <RotateCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="text-xs text-gray-500 mt-1">로딩 중...</span>
            </div>
          ) : (
            <>
              {imageUrl ? (
                <img 
                  src={imageUrl}
                  alt={title}
                  className="w-20 h-20 object-contain rounded"
                  onError={(e) => {
                    console.error(`❌ 이미지 로딩 실패: ${category}`, {
                      url: e.target.src,
                      error: e.target.error,
                      naturalWidth: e.target.naturalWidth,
                      naturalHeight: e.target.naturalHeight
                    });
                    
                    // CORS 문제 확인
                    fetch(e.target.src, { method: 'HEAD', mode: 'no-cors' })
                      .then(() => console.log(`✅ 이미지 URL은 접근 가능: ${e.target.src}`))
                      .catch(err => console.log(`🚫 이미지 URL 접근 불가: ${e.target.src}`, err));
                    
                    if (e.target) {
                      e.target.style.display = 'none';
                    }
                    if (e.target && e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-2 text-3xl">
                    🧴
                  </div>
                  <span className="text-xs text-gray-500 text-center">{category}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <h5 className="font-bold text-gray-800">{title}</h5>
        <p className="text-xs text-gray-600">브랜드: {brand}</p>
        <div className="bg-white rounded-lg p-2">
          {features.map((feature, index) => (
            <p key={index} className="text-xs text-gray-700 mb-1">{feature}</p>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className={`font-bold ${priceColor}`}>{price}</span>
          <div className="flex gap-1">
            {/* 실제 구매 링크가 있으면 우선 표시 */}
            {directUrl && directUrl !== '#' ? (
              <a 
                href={directUrl}
                target="_blank" 
                rel="noopener noreferrer"
                className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                바로구매
              </a>
            ) : (
              <a 
                href={`https://www.hwahae.co.kr/search?q=${searchQueries[0]}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="px-2 py-1 bg-pink-500 text-white text-xs rounded hover:bg-pink-600 transition-colors"
              >
                화해
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SkinAnalyzer2025 = () => {
  const [currentStep, setCurrentStep] = useState('capture');
  const [capturedImage, setCapturedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [productImages, setProductImages] = useState({});
  const [imageLoadingStates, setImageLoadingStates] = useState({});

  // 화해 이미지 설정 (Unsplash 제거됨)
  
  // 제품 카테고리별 검색 키워드 매핑
  const productSearchTerms = {
    cleanser: 'facial cleanser skincare bottle',
    toner: 'skincare toner serum bottle',
    serum: 'serum dropper skincare vitamin c',
    moisturizer: 'face cream moisturizer jar skincare',
    sunscreen: 'sunscreen skincare spf bottle',
    treatment: 'skincare treatment essence bottle'
  };

  // 분석 결과에서 실제 AI 추천 제품 추출
  const getProductRecommendations = (analysisResult) => {
    // 백엔드에서 받은 화해 제품 추천 사용 (OpenAI + 화해 연동)
    const aiRecommendations = analysisResult?.analysis?.product_recommendations || analysisResult?.ai_analysis?.product_recommendations || [];
    
    if (aiRecommendations.length > 0) {
      console.log('🤖 OpenAI에서 받은 실제 제품 추천:', aiRecommendations);
      
      // OpenAI 추천을 프론트엔드 형식에 맞게 변환
      return aiRecommendations.map((product, index) => {
        // 제품명에서 카테고리 추정
        const productName = product.product_name?.toLowerCase() || '';
        let category = 'moisturizer'; // 기본값
        
        if (productName.includes('클렌징') || productName.includes('세안') || productName.includes('cleanser')) {
          category = 'cleanser';
        } else if (productName.includes('토너') || productName.includes('toner')) {
          category = 'toner';
        } else if (productName.includes('세럼') || productName.includes('serum') || productName.includes('에센스')) {
          category = 'serum';
        } else if (productName.includes('크림') || productName.includes('로션') || productName.includes('moisturizer')) {
          category = 'moisturizer';
        } else if (productName.includes('선크림') || productName.includes('자외선') || productName.includes('spf')) {
          category = 'sunscreen';
        } else if (productName.includes('필링') || productName.includes('각질') || productName.includes('트리트먼트')) {
          category = 'treatment';
        }

        // 가격 색상 결정
        let priceColor = 'text-gray-600';
        const price = product.price || '';
        if (price.includes('10000') || price.includes('20000')) {
          priceColor = 'text-green-600';
        } else if (price.includes('30000') || price.includes('40000')) {
          priceColor = 'text-blue-600';
        } else if (price.includes('50000')) {
          priceColor = 'text-purple-600';
        }

        console.log(`🔍 제품 ${index + 1} 프론트 데이터:`, {
          name: product.product_name,
          brand: product.brand,
          url: product.url,
          image_url: product.image_url
        });

        return {
          category: category,
          title: product.product_name || '추천 제품',
          brand: product.brand || '브랜드 정보 없음',
          features: [
            product.short_summary?.split('.')[0] || '효과적인 스킨케어',
            product.short_summary?.split('.')[1] || '피부에 적합한 제품'
          ].filter(Boolean),
          price: product.price || '가격 정보 없음',
          priceColor: priceColor,
          reason: product.reason || '분석 결과에 따른 맞춤 추천',
          url: product.url || '#',
          imageUrl: product.image_url, // 이미지 URL 추가
          searchQueries: [
            product.product_name?.replace(/ /g, '+') || 'skincare',
            `${product.brand}+${category}`.replace(/ /g, '+')
          ]
        };
      });
    }
    
    // OpenAI 추천이 없는 경우 기본 추천 (폴백)
    console.log('⚠️ OpenAI 제품 추천이 없어 기본 추천을 사용합니다.');
    return [
      {
        category: 'cleanser',
        title: '순한 클렌징폼',
        brand: '추천 브랜드',
        features: ['🧴 순한 저자극', '💧 수분 보호'],
        price: '15,000 - 25,000원',
        priceColor: 'text-green-600',
        reason: '기본 클렌징 제품이 필요합니다.',
        searchQueries: ['클렌징폼', 'cleanser']
      },
      {
        category: 'moisturizer',
        title: '보습 크림',
        brand: '추천 브랜드',
        features: ['🛡️ 피부 보호', '🌙 지속 보습'],
        price: '20,000 - 30,000원',
        priceColor: 'text-amber-600',
        reason: '기본 보습이 필요합니다.',
        searchQueries: ['보습크림', 'moisturizer']
      }
    ];
  };


  // 화해 제품 이미지는 백엔드에서 함께 받아옴 (분석 후에만 로드)
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [countDown, setCountDown] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [useAdvancedCamera, setUseAdvancedCamera] = useState(false); // 기존 카메라 시스템 사용
  const [showChatBot, setShowChatBot] = useState(false);
  const [chatBotData, setChatBotData] = useState(null); // 챗봇 설문조사 결과 저장
  const [isChatBotCompleted, setIsChatBotCompleted] = useState(false); // 챗봇 상담 완료 상태
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0, positioning: 'top' });
  const [hasScrolledToChatBot, setHasScrolledToChatBot] = useState(false); // 챗봇으로 스크롤 완료 여부
  const [isModalHovered, setIsModalHovered] = useState(false); // 모달 hover 상태
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const faceCheckInterval = useRef(null);
  const countDownIntervalRef = useRef(null);
  const dropZoneRef = useRef(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const imageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const API_BASE_URL = 'http://localhost:8000';

  // SmartCamera 콜백 함수들
  const handleSmartCameraCapture = useCallback((imageData, metadata) => {
    console.log('📸 SmartCamera 촬영 완료:', metadata);
    setCapturedImage(imageData);
    setCurrentStep('capture');
    setCameraActive(false);
  }, []);

  const handleSmartCameraError = useCallback((error) => {
    console.error('📹 SmartCamera 오류:', error);
    setError(`카메라 오류: ${error.message}`);
    setCameraActive(false);
  }, []);

  // 모달창 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (hoveredProduct !== null) {
        // 모달창이 열려있을 때만 외부 클릭 감지
        const modal = document.querySelector('[data-modal="product-hover"]');
        const productCard = document.querySelector(`[data-product-card="${hoveredProduct}"]`);
        
        if (modal && !modal.contains(event.target) && 
            productCard && !productCard.contains(event.target)) {
          setHoveredProduct(null);
          setIsModalHovered(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hoveredProduct]);

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
        
        // 이미지가 정상적으로 로드된 경우에만 카메라 정지 및 인터벌 정리
        if (testImage.width > 0 && testImage.height > 0) {
          // 모든 얼굴 감지 관련 인터벌과 타임아웃 정리
          if (faceCheckInterval.current) {
            clearInterval(faceCheckInterval.current);
            faceCheckInterval.current = null;
            console.log('🛑 사진 촬영 성공으로 얼굴 감지 인터벌 정리');
          }
          
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
    console.log('⏰ 카운트다운 시작 시도');
    
    // 비디오 준비 상태 확인 (더 엄격하게)
    if (!videoRef.current || 
        videoRef.current.videoWidth === 0 || 
        videoRef.current.videoHeight === 0 ||
        videoRef.current.paused ||
        videoRef.current.ended ||
        videoRef.current.readyState < 3) {
      console.log('❌ 비디오가 아직 준비되지 않아 카운트다운을 시작하지 않습니다.', {
        videoWidth: videoRef.current?.videoWidth || 0,
        videoHeight: videoRef.current?.videoHeight || 0,
        paused: videoRef.current?.paused || true,
        ended: videoRef.current?.ended || true,
        readyState: videoRef.current?.readyState || 0
      });
      return;
    }

    console.log('✅ 비디오 준비 완료, 카운트다운 시작:', {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight,
      readyState: videoRef.current.readyState,
      paused: videoRef.current.paused
    });

    if (countDownInterval.current) {
      clearInterval(countDownInterval.current);
    }
    
    setCountDown(3);
    countDownInterval.current = setInterval(() => {
      setCountDown(prev => {
        if (prev <= 1) {
          clearInterval(countDownInterval.current);
          // 카운트다운이 시작된 후에는 얼굴 감지 상태에 관계없이 촬영 진행
          console.log('📸 카운트다운 완료 - 얼굴 감지 상태에 관계없이 촬영 진행');
          
          if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
            console.log('✅ 모든 조건 만족: 얼굴 감지됨, 비디오 준비됨 - 촬영 시작');
            capturePhoto();
          } else {
            console.error('❌ 캡처 시점에 비디오가 준비되지 않음');
            setError('카메라가 준비되지 않았습니다. 다시 시도해주세요.');
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [capturePhoto, faceDetected]);

  // 안정적인 얼굴 감지 함수 (참고 프로젝트 기반)
  const checkFaceDetection = useCallback(async () => {
    // 기본 조건 확인
    if (!videoRef.current || !canvasRef.current || !cameraActive) {
      return;
    }

    const video = videoRef.current;
    
    // 비디오 상태 엄격 검증
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }
    
    if (video.paused || video.ended || video.readyState < 3) {
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
      
      const response = await fetch(`${API_BASE_URL}/detect-faces`, {
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
      
      const newFaceDetected = data.face_detected && data.face_count > 0;
      
      // 얼굴 감지 상태 업데이트
      setFaceDetected(newFaceDetected);
      
    } catch (error) {
      console.error('얼굴 감지 오류:', error);
      setFaceDetected(false);
      
      // 에러 발생 시 인터벌 정리 후 재시도
      if (faceCheckInterval.current) {
        clearInterval(faceCheckInterval.current);
        faceCheckInterval.current = null;
        
        setTimeout(() => {
          if (cameraActive) {
            faceCheckInterval.current = setInterval(checkFaceDetection, 1000);
          }
        }, 3000);
      }
    }
  }, [API_BASE_URL, cameraActive]);

  // 2025년 API 상태 확인
  const checkApiHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        setApiStatus('connected');
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

  // 카메라 시작 (2025년 최신 웹캠 API) - 향상된 비디오 초기화
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      console.log('🚀 카메라 시작 시도...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30 }
        }
      });
      
      console.log('✅ 카메라 스트림 획득 성공:', {
        tracks: stream.getTracks().length,
        active: stream.active
      });
      
      // 먼저 스트림 저장
      streamRef.current = stream;
      
      // 비디오 요소가 렌더링될 때까지 대기하고 강제로 초기화
      const initVideo = async () => {
        // 비디오 요소가 존재하지 않으면 카메라 활성화 후 대기
        if (!videoRef.current) {
          setCameraActive(true);
          
          // 더 긴 대기 시간과 더 빈번한 체크
          let retryCount = 0;
          const maxRetries = 100; // 10초 대기
          
          const waitForVideo = () => {
            return new Promise((resolve, reject) => {
              const checkVideo = () => {
                console.log(`🔍 비디오 요소 체크 ${retryCount + 1}/${maxRetries}`);
                if (videoRef.current) {
                  console.log('✅ 비디오 요소 발견');
                  resolve(videoRef.current);
                } else if (retryCount < maxRetries) {
                  retryCount++;
                  setTimeout(checkVideo, 100);
                } else {
                  reject(new Error('비디오 요소 대기 시간 초과'));
                }
              };
              checkVideo();
            });
          };
          
          const video = await waitForVideo();
          console.log('📹 비디오 요소 준비됨, 스트림 연결 시작');
        } else {
          console.log('✅ 비디오 요소 이미 존재함');
        }
        
        try {
          const video = videoRef.current;
          console.log('📹 비디오 요소 준비됨, 스트림 연결 시작');
          
          // 스트림 연결
          video.srcObject = stream;
          video.style.transform = 'scaleX(-1)';
          video.muted = true;
          video.playsInline = true;
          video.autoplay = true;

          // 메타데이터 로드 대기
          await new Promise((resolve, reject) => {
            let metadataTimeout;
            
            const onLoadedMetadata = () => {
              clearTimeout(metadataTimeout);
              video.removeEventListener('loadedmetadata', onLoadedMetadata);
              console.log('📊 비디오 메타데이터 로드 완료:', {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState
              });
              resolve();
            };

            video.addEventListener('loadedmetadata', onLoadedMetadata);
            
            // 10초 타임아웃
            metadataTimeout = setTimeout(() => {
              video.removeEventListener('loadedmetadata', onLoadedMetadata);
              reject(new Error('메타데이터 로드 시간 초과'));
            }, 10000);
          });

          // 비디오 재생 시작
          console.log('▶️ 비디오 재생 시작 시도');
          try {
            await video.play();
            console.log('🎬 비디오 재생 성공');
          } catch (playError) {
            console.error('재생 오류:', playError);
            // 재생 실패 시 사용자 상호작용 대기
            console.log('🖱️ 사용자 상호작용이 필요할 수 있습니다');
          }

          // 비디오가 완전히 준비될 때까지 강제 대기
          const waitForPlayback = () => {
            return new Promise((resolve, reject) => {
              let checkCount = 0;
              const maxChecks = 100; // 10초 대기
              
              const checkPlayback = () => {
                const {
                  videoWidth,
                  videoHeight,
                  paused,
                  ended,
                  readyState,
                  currentTime
                } = video;
                
                console.log(`🔍 비디오 상태 체크 ${checkCount + 1}:`, {
                  videoWidth,
                  videoHeight,
                  paused,
                  ended,
                  readyState,
                  currentTime: currentTime.toFixed(2)
                });

                // 완전히 준비된 조건: 크기가 있고, 일시정지되지 않았으며, readyState가 충분함
                if (videoWidth > 0 && 
                    videoHeight > 0 && 
                    !paused && 
                    !ended && 
                    readyState >= 2 && // HAVE_CURRENT_DATA 이상
                    currentTime > 0) { // 실제로 재생 중
                  console.log('🎯 비디오 완전 준비됨!');
                  resolve();
                  return;
                }

                // 재시도
                checkCount++;
                if (checkCount < maxChecks) {
                  // 일시정지된 경우 다시 재생 시도
                  if (paused && !ended) {
                    console.log('⏯️ 비디오가 일시정지됨, 재생 재시도');
                    video.play().catch(e => console.log('재생 재시도 실패:', e));
                  }
                  setTimeout(checkPlayback, 100);
                } else {
                  console.error('❌ 비디오 준비 시간 초과');
                  reject(new Error('비디오 재생 상태 대기 시간 초과'));
                }
              };
              
              checkPlayback();
            });
          };

          // 재생 상태 대기
          await waitForPlayback();
          
          console.log('🎉 비디오 초기화 완전 성공!');
          
          // 비디오 초기화 완료 후 얼굴 감지 시작
          setTimeout(() => {
            console.log('🔍 얼굴 감지 시작 조건 확인:', {
              cameraActive,
              hasVideoRef: !!videoRef.current,
              currentStep,
              hasInterval: !!faceCheckInterval.current
            });
            
            if (cameraActive && videoRef.current && currentStep === 'camera') {
              console.log('🎯 얼굴 감지 인터벌 시작');
              if (!faceCheckInterval.current) {
                // 얼굴 감지 간격을 1초로 증가하여 백엔드 부하 줄이기
                faceCheckInterval.current = setInterval(checkFaceDetection, 1000);
                console.log('✅ 얼굴 감지 인터벌 설정 완료 (1초)');
              }
            } else {
              console.log('❌ 얼굴 감지 시작 조건 불만족');
            }
          }, 1000);
          
        } catch (initError) {
          console.error('🚨 비디오 초기화 실패:', initError);
          setError(`비디오 초기화 실패: ${initError.message}`);
          stopCamera();
        }
      };

      // 비디오 초기화 실행
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
      if (countDownIntervalRef.current) {
        clearInterval(countDownIntervalRef.current);
      }
    };
  }, []);

  // 카메라 시작 시 얼굴 감지 시작 (비디오가 완전히 준비된 후)
  useEffect(() => {
    // 분석이 완료되면 얼굴 감지 중단 및 카메라 정리
    if (currentStep === 'result') {
      console.log('🎯 분석 완료, 얼굴 감지 중단 및 카메라 정리');
      if (faceCheckInterval.current) {
        clearInterval(faceCheckInterval.current);
        faceCheckInterval.current = null;
      }
      
      // 카메라 스트림 정리
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('📹 카메라 트랙 정지:', track.kind);
        });
        videoRef.current.srcObject = null;
        console.log('🛑 카메라 스트림 정리 완료');
      }
      
      return;
    }

    if (cameraActive && videoRef.current && currentStep === 'camera') {
      // 비디오가 실제로 재생되고 있는지 확인 후 얼굴 감지 시작 (개선된 조건)
      const startFaceDetection = () => {
        // 카메라가 비활성화되었거나 currentStep이 변경되면 재귀 호출 중단
        if (!cameraActive || currentStep !== 'camera') {
          console.log('🛑 얼굴 감지 재귀 호출 중단:', { cameraActive, currentStep });
          return;
        }
        
        if (videoRef.current) {
          const {
            videoWidth,
            videoHeight,
            paused,
            ended,
            readyState,
            currentTime
          } = videoRef.current;
          
          console.log('🔍 얼굴 감지 시작 조건 체크:', {
            videoWidth,
            videoHeight,
            paused,
            ended,
            readyState,
            currentTime: currentTime.toFixed(2)
          });
          
          // 더 유연한 조건: 비디오 크기가 있고, 끝나지 않았으며, readyState가 2 이상이면 충분
          if (videoWidth > 0 && 
              videoHeight > 0 && 
              !ended && 
              readyState >= 2) { // HAVE_CURRENT_DATA 이상이면 충분
            
            console.log('🎯 얼굴 감지 인터벌 시작 (조건 만족)');
            if (!faceCheckInterval.current) {
              // 얼굴 감지 간격을 1초로 증가하여 백엔드 부하 줄이기
              faceCheckInterval.current = setInterval(checkFaceDetection, 1000);
            }
          } else {
            console.log('⏳ 비디오 아직 준비되지 않음, 1초 후 재시도');
            console.log('  - 필요 조건: videoWidth > 0, videoHeight > 0, !ended, readyState >= 2');
            
            // 일시정지된 경우 재생 시도
            if (paused && !ended && readyState >= 2) {
              console.log('⏯️ 비디오가 일시정지됨, 재생 시도');
              videoRef.current.play().catch(e => {
                console.log('재생 시도 실패:', e);
              });
            }
            
            // 다시 조건 체크 (카메라 상태 재확인)
            setTimeout(() => {
              if (cameraActive && currentStep === 'camera') {
                startFaceDetection();
              }
            }, 1000);
          }
        } else {
          console.log('❌ 비디오 요소 없음, 1초 후 재시도');
          // 다시 조건 체크 (카메라 상태 재확인)
          setTimeout(() => {
            if (cameraActive && currentStep === 'camera') {
              startFaceDetection();
            }
          }, 1000);
        }
      };

      // 약간의 지연 후 시작
      setTimeout(startFaceDetection, 2000); // 2초로 증가

      return () => {
        if (faceCheckInterval.current) {
          console.log('🛑 얼굴 감지 인터벌 정리');
          clearInterval(faceCheckInterval.current);
          faceCheckInterval.current = null;
        }
        // 참고 프로젝트처럼 정리 시 카운트다운 확실히 초기화
        setCountDown(null);
      };
    }
  }, [cameraActive, checkFaceDetection, currentStep]);

  // 카운트다운 로직 (중단-재시작 방식)
  useEffect(() => {
    // 얼굴이 감지되었고, 카운트다운이 아직 시작되지 않았다면
    if (faceDetected && countDownIntervalRef.current === null) {
      setCountDown(3);
      countDownIntervalRef.current = setInterval(() => {
        setCountDown(prev => {
          if (prev && prev > 1) {
            return prev - 1;
          }
          clearInterval(countDownIntervalRef.current);
          countDownIntervalRef.current = null;
          capturePhoto();
          return null;
        });
      }, 1000);
    } 
    // 얼굴 인식이 끊겼다면 카운트다운 중단
    else if (!faceDetected) {
      if (countDownIntervalRef.current) {
        clearInterval(countDownIntervalRef.current);
        countDownIntervalRef.current = null;
      }
      setCountDown(null);
    }
  }, [faceDetected, capturePhoto]);

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
      
      {/* 얼굴 인식 상태 표시 (참고 프로젝트와 동일한 버전) */}
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

  // 드래그 앤 드롭 영역 렌더링 (사용하지 않음)
  /*
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
  */

  // 2025년 최신 AI 피부 분석
  const analyzeSkin = async () => {
    // 스크롤을 최상단으로 이동
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

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
          image: capturedImage,
          chatbot_data: chatBotData // 챗봇 설문조사 결과 추가
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
        
        // 백엔드에서 받은 화해 제품 정보 처리
        if (data.result.analysis && data.result.analysis.product_recommendations) {
          console.log('📦 받은 제품 추천 데이터:', data.result.analysis.product_recommendations);
          
          const productImageMap = {};
          data.result.analysis.product_recommendations.forEach((product, index) => {
            console.log(`제품 ${index + 1} 처리 중:`, {
              name: product.product_name,
              brand: product.brand,
              url: product.url,
              image_url: product.image_url
            });
            
            if (product.image_url && product.image_url !== 'Unknown') {
              // 카테고리별로 이미지 저장 (첫 번째 제품부터 순서대로)
              const categories = ['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'treatment'];
              const category = categories[index] || `product_${index}`;
              productImageMap[category] = product.image_url;
              console.log(`✅ 카테고리 ${category}에 이미지 설정: ${product.image_url}`);
            } else {
              console.log(`❌ 제품 ${index + 1}에 유효한 이미지 URL 없음:`, product.image_url);
            }
          });
          setProductImages(productImageMap);
          console.log('🛍️ 최종 제품 이미지 맵:', productImageMap);
        } else {
          console.log('❌ 제품 추천 데이터 없음');
        }
        
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

  // 2025년 최신 제품 추천 (더 세분화됨) - 사용하지 않음
  /*
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
  */

  // 신뢰도 및 품질 표시
  const getConfidenceLevel = (confidence) => {
    if (confidence >= 0.9) return { level: '매우 높음', color: 'text-green-600', bg: 'bg-green-100' };
    if (confidence >= 0.8) return { level: '높음', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (confidence >= 0.7) return { level: '보통', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: '낮음', color: 'text-red-600', bg: 'bg-red-100' };
  };

  // 우선순위별 색상 (사용하지 않음)
  /*
  const getPriorityColor = (priority) => {
    switch (priority) {
      case '필수': return 'bg-red-100 text-red-700 border-red-200';
      case '높음': return 'bg-orange-100 text-orange-700 border-orange-200';
      case '보통': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // 중요도별 색상 (사용하지 않음)
  const getImportanceColor = (importance) => {
    switch (importance) {
      case '높음': return 'bg-red-100 text-red-700 border-red-200';
      case '보통': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case '낮음': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  */

  const resetAnalysis = () => {
    // 이전 분석의 임시 이미지들 정리
    if (analysisResult?.analysis?.session_id) {
      cleanupImages(analysisResult.analysis.session_id);
    }
    
    setCurrentStep('capture');
    setCapturedImage(null);
    setAnalysisResult(null);
    setIsLoading(false);
    setError(null);
    setAnalysisProgress(0);
    setShowChatBot(false);
    setChatBotData(null);
    setIsChatBotCompleted(false);
    setHasScrolledToChatBot(false);
  };

  // 이미지 정리 함수
  const cleanupImages = async (sessionId) => {
    try {
      await fetch(`${API_BASE_URL}/cleanup-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      console.log('🗑️ 임시 이미지 정리 완료');
    } catch (error) {
      console.error('이미지 정리 오류:', error);
    }
  };

  useEffect(() => {
    console.log('컴포넌트가 마운트되었습니다');
    
    return () => {
      console.log('컴포넌트가 언마운트됩니다');
      stopCamera();
    };
  }, [stopCamera]);

  // 제품 이미지는 백엔드 분석 결과와 함께 받아옴


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

    // 여드름 위치 표시 - 정규화된 좌표 사용
    analysisResult.acne_lesions.forEach(lesion => {
      let x, y, width, height;
      
      // 정규화된 좌표가 있으면 사용, 없으면 픽셀 좌표를 스케일링
      if (lesion.normalized_x !== undefined && lesion.normalized_y !== undefined && analysisResult.image_size?.original) {
        // 정규화된 좌표를 캔버스 크기로 변환
        x = lesion.normalized_x * canvas.width;
        y = lesion.normalized_y * canvas.height;
        width = (lesion.normalized_width || 0.02) * canvas.width;
        height = (lesion.normalized_height || 0.02) * canvas.height;
      } else {
        // 기존 방식 (픽셀 좌표 스케일링)
        x = lesion.x * scale.x;
        y = lesion.y * scale.y;
        width = lesion.width * scale.x;
        height = lesion.height * scale.y;
      }

      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, Math.max(width, 8), Math.max(height, 8));

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
  }, [imageLoaded, analysisResult?.acne_lesions, scale.x, scale.y]);

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

  // 챗봇 활성화 시 이미지 영역으로 한 번만 스크롤
  useEffect(() => {
    if (showChatBot && capturedImage && !isChatBotCompleted && !hasScrolledToChatBot) {
      // 약간의 지연을 주어 DOM이 렌더링된 후 스크롤
      setTimeout(() => {
        const imageSection = document.getElementById('image-section');
        if (imageSection) {
          imageSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
          setHasScrolledToChatBot(true); // 스크롤 완료 표시
        }
      }, 100);
    }
  }, [showChatBot, capturedImage, isChatBotCompleted, hasScrolledToChatBot]);

  // 챗봇 상담 완료 시 분석 버튼으로 스크롤
  useEffect(() => {
    if (isChatBotCompleted && capturedImage) {
      setTimeout(() => {
        const analysisSection = document.getElementById('analysis-button-section');
        if (analysisSection) {
          analysisSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        } else {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      }, 500);
    }
  }, [isChatBotCompleted, capturedImage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
      <div className="max-w-sm mx-auto sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl">
        {/* 2025년 최신 헤더 (OpenAI 통합) */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Brain className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              AI 피부 분석기
            </h1>
            <Sparkles className="w-6 h-6 text-pink-500" />
          </div>
          <p className="text-gray-600 mb-2">
            2025년 최신 AI 기술 + OpenAI 전문가 분석으로 피부 상태를 정밀 분석합니다
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
                  AI 서버 연결됨 + OpenAI API
                </>
              ) : 
               apiStatus === 'error' ? 'AI 서버 연결 실패' : 'AI 서버 확인 중...'}
            </span>
          </div>
          
          <div className="text-xs text-gray-400">
            Advanced AI • OpenAI GPT-4 • Real-time Analysis • 2025 Technology
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
          {(currentStep === 'capture' || currentStep === 'camera') && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-80 h-80 bg-white rounded-3xl mx-auto relative overflow-hidden shadow-xl">
                  {cameraActive ? (
                    useAdvancedCamera ? (
                      <SmartCamera
                        onCapture={handleSmartCameraCapture}
                        onError={handleSmartCameraError}
                        isActive={cameraActive}
                        autoCapture={true}
                        qualityChecks={true}
                      />
                    ) : (
                      <>
                        {/* 카메라 비디오 스트림 */}
                        <div className="relative w-full h-full">
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
                                  얼굴 감지됨
                                </span>
                              )
                            ) : (
                              <span className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
                                얼굴을 화면에 맞춰주세요
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* 2025년 얼굴 가이드라인 */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-1/2 left-1/2 w-48 h-60 border-2 border-white/60 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg"></div>
                        </div>
                      </>
                    )
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
                        {isDragging ? '여기에 놓아주세요' : 'AI 피부 분석을 시작하세요'}
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

              {capturedImage && !cameraActive && !showChatBot && (
                <div className="space-y-4 sm:space-y-6 max-w-xs sm:max-w-sm md:max-w-md mx-auto text-center">
                  {/* 설문조사 안내 메시지 */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MessageCircle className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        개인 맞춤 분석을 위한 상담
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        정확한 피부 분석을 위해 간단한 설문조사를 진행해주세요. 
                        <br />
                        <span className="font-semibold text-purple-600">개인화된 솔루션</span>을 제공합니다.
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setShowChatBot(true)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      <Sparkles size={20} />
                      <span>피부 상담 시작하기</span>
                      <Brain size={20} />
                    </button>
                  </div>
                  
                  {/* 다시 촬영 버튼 */}
                  <button
                    onClick={resetAnalysis}
                    disabled={isLoading}
                    className="w-full bg-gray-100 text-gray-600 py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition-all disabled:opacity-50 text-sm"
                  >
                    <RotateCw size={16} />
                    <span>다시 촬영하기</span>
                  </button>
                </div>
              )}

              {/* 챗봇 UI - 상담이 완료되지 않았을 때만 표시 */}
              {showChatBot && !isChatBotCompleted && (
                <div className="max-w-sm mx-auto sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mt-8 space-y-6" id="chatbot-section">
                  {/* 사진 표시 영역 - 사진이 있을 때만 표시 */}
                  {capturedImage && (
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden" id="image-section">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4">
                        <h3 className="text-xl font-bold text-center">📸 분석한 사진</h3>
                      </div>
                      <div className="p-6">
                        <div className="relative max-w-md mx-auto">
                          <img
                            src={capturedImage}
                            alt="분석한 피부 사진"
                            className="w-full rounded-xl shadow-lg"
                          />
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            분석 완료 ✓
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 챗봇 영역 */}
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <SkinChatBot 
                      capturedImage={capturedImage} 
                      onSurveyComplete={(data) => {
                        setChatBotData(data);
                        setIsChatBotCompleted(true);
                      }}
                    />
                  </div>
                </div>
              )}

              {!cameraActive && !capturedImage && (
                <div className="space-y-3 max-w-xs sm:max-w-sm md:max-w-md mx-auto px-4">
                  <button
                    onClick={() => {
                      console.log('카메라 버튼 클릭됨');
                      console.log('API 상태:', apiStatus);
                      console.log('카메라 활성 상태:', cameraActive);
                      setCameraActive(true);
                      setCurrentStep('camera');
                      console.log('currentStep을 camera로 변경');
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
              {/* 고급 분석 애니메이션 */}
              <div className="relative w-32 h-32 mx-auto mb-8">
                {/* 외부 회전 링 */}
                <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                
                {/* 중앙 펄스 효과 */}
                <div className="absolute inset-8 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-10 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full animate-ping"></div>
                
                {/* AI 브레인 아이콘 */}
                <Brain className="absolute inset-0 w-12 h-12 m-auto text-white animate-pulse" />
                
                {/* 분석 입자 효과 */}
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                <div className="absolute top-1/4 right-0 w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                <div className="absolute bottom-1/4 left-0 w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.6s'}}></div>
                <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.9s'}}></div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-6 animate-pulse">
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  AI 전문가가 피부를 분석중입니다
                </span>
              </h3>
              
              {/* 고급 프로그레스 바 */}
              <div className="w-full bg-gray-200 rounded-full h-4 mb-6 overflow-hidden relative">
                <div 
                  className="h-4 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                  style={{ 
                    width: `${analysisProgress}%`,
                    background: 'linear-gradient(90deg, #8B5CF6, #EC4899, #3B82F6)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
              </div>
              <div className="text-lg font-semibold text-gray-700 mb-6">
                {Math.round(analysisProgress)}% 완료
              </div>
              
              {/* 분석 단계 표시 */}
              <div className="space-y-4 text-base text-gray-700">
                <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-ping"></div>
                  <span className="font-medium">🔍 고해상도 피부 스캔</span>
                </div>
                <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50">
                  <div className="w-3 h-3 bg-pink-500 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                  <span className="font-medium">🧠 AI 딥러닝 분석</span>
                </div>
                <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-pink-50">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                  <span className="font-medium">✨ 개인화 솔루션 생성</span>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 rounded-2xl">
                <p className="text-sm text-gray-600 font-medium">
                  🚀 설문조사 데이터와 함께 최고 정밀도 분석 진행중...
                </p>
              </div>
            </div>
          )}

          {/* 3단계: 분석 결과 (2025년 향상된 UI + OpenAI 통합) */}
          {currentStep === 'result' && analysisResult && (
            <div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                  AI 전문가 분석 완료!
                </h3>
                {/* LLM 전문가 진단이 있으면 그걸 우선 표시, 없으면 기본 분석 */}
                {analysisResult.ai_analysis?.expert_diagnosis ? (
                  <p className="text-gray-600 mb-3 text-lg leading-relaxed">
                    <span className="font-medium text-gray-700">AI 전문가 요약:</span> 
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 ml-2">
                      {analysisResult.ai_analysis.expert_diagnosis}
                    </span>
                  </p>
                ) : (
                  <p className="text-gray-600 mb-3">
                    당신의 피부 타입은 <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 text-lg">{analysisResult.skin_type}</span>입니다
                  </p>
                )}
                
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

              {/* OpenAI 분석이 실패한 경우에만 기본 분석 결과 표시 */}
              {!analysisResult.ai_analysis && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 mb-6 text-center">
                  <div className="text-2xl mb-2">⚠️</div>
                  <h4 className="font-bold text-gray-800 mb-2">AI 전문가 분석 처리 중</h4>
                  <p className="text-sm text-gray-600">
                    OpenAI API를 통한 전문가 분석이 진행 중이거나 일시적으로 사용할 수 없습니다.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    잠시 후 다시 시도해주세요. 모든 분석 결과는 AI 전문가의 해석을 통해 제공됩니다.
                  </p>
                </div>
              )}

              {/* 피부색 표시 (2025년 개선) - 기존 위치에서 제거하고 위에 통합됨 */}

              {/* 📸 분석된 이미지 카드 */}
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 mb-8">
                <div className="text-center mb-4">
                  <h4 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
                    <Target className="w-6 h-6 text-blue-600" />
                    분석된 이미지
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">AI가 분석한 당신의 피부 사진</p>
                </div>
                <div className="relative rounded-2xl overflow-hidden shadow-lg bg-gray-100 max-w-sm mx-auto" style={{ aspectRatio: '3/4' }}>
                  <img 
                    ref={imageRef}
                    src={capturedImage}
                    alt="분석된 이미지"
                    className="w-full h-full object-cover"
                    onLoad={handleImageLoad}
                  />
                  
                  {/* cho-2 스타일 여드름 마킹 (정확한 좌표 + 호버 툴팁) */}
                  {analysisResult.acne_lesions && analysisResult.acne_lesions.map((lesion, index) => {
                    const imgElement = imageRef.current;
                    if (!imgElement) return null;

                    // 이미지 컨테이너와 실제 이미지 크기 정보
                    const containerRect = imgElement.getBoundingClientRect();
                    const displayedWidth = imgElement.clientWidth;
                    const displayedHeight = imgElement.clientHeight;
                    const originalWidth = imgElement.naturalWidth;
                    const originalHeight = imgElement.naturalHeight;
                    
                    // object-cover로 인한 이미지 크롭 계산
                    const imageAspect = originalWidth / originalHeight;
                    const containerAspect = displayedWidth / displayedHeight;
                    
                    let scaleX, scaleY, offsetX = 0, offsetY = 0;
                    
                    if (imageAspect > containerAspect) {
                      // 이미지가 컨테이너보다 넓음 - 상하 크롭
                      scaleY = displayedHeight / originalHeight;
                      scaleX = scaleY;
                      offsetX = (displayedWidth - originalWidth * scaleX) / 2;
                    } else {
                      // 이미지가 컨테이너보다 높음 - 좌우 크롭
                      scaleX = displayedWidth / originalWidth;
                      scaleY = scaleX;
                      offsetY = (displayedHeight - originalHeight * scaleY) / 2;
                    }
                    
                    // 정확한 마킹 위치 계산
                    const left = lesion.x * scaleX + offsetX;
                    const top = lesion.y * scaleY + offsetY;
                    const width = lesion.width * scaleX;
                    const height = lesion.height * scaleY;

                    return (
                    <div
                      key={index}
                      className="group absolute border-2 border-red-500 rounded-sm cursor-pointer transition-all duration-300 ease-out hover:shadow-lg"
                      style={{
                        left: `${left}px`,
                        top: `${top}px`,
                        width: `${Math.max(width, 8)}px`,
                        height: `${Math.max(height, 8)}px`,
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      }}
                      onClick={() => console.log('여드름 클릭:', lesion)}
                    >
                      {/* cho-2 스타일 호버 툴팁 */}
                      <div className="absolute -top-36 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out group-hover:scale-100 scale-75 pointer-events-none z-50">
                        <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-3">
                          {/* 이미지 크롭 미리보기 */}
                          <div className="w-32 h-32 overflow-hidden rounded-lg relative bg-gray-100 mb-2">
                            <canvas
                              width="128"
                              height="128"
                              className="w-full h-full"
                              ref={(canvas) => {
                                if (canvas && imgElement) {
                                  const ctx = canvas.getContext('2d');
                                  
                                  // 여드름 영역 중심점 계산
                                  const centerX = lesion.x + lesion.width / 2;
                                  const centerY = lesion.y + lesion.height / 2;
                                  
                                  // 크롭할 영역 크기 (여드름 크기의 3배)
                                  const cropSize = Math.max(lesion.width, lesion.height) * 3;
                                  const halfCrop = cropSize / 2;
                                  
                                  // 크롭 영역 경계 확인 및 조정
                                  const cropX = Math.max(0, Math.min(originalWidth - cropSize, centerX - halfCrop));
                                  const cropY = Math.max(0, Math.min(originalHeight - cropSize, centerY - halfCrop));
                                  const actualCropWidth = Math.min(cropSize, originalWidth - cropX);
                                  const actualCropHeight = Math.min(cropSize, originalHeight - cropY);
                                  
                                  // 캔버스 초기화
                                  ctx.fillStyle = '#f3f4f6';
                                  ctx.fillRect(0, 0, 128, 128);
                                  
                                  // 이미지 크롭 및 확대 그리기
                                  ctx.drawImage(
                                    imgElement,
                                    cropX, cropY, actualCropWidth, actualCropHeight,
                                    0, 0, 128, 128
                                  );
                                  
                                  // 여드름 영역 표시를 위한 사각형 그리기
                                  const relativeX = (lesion.x - cropX) * (128 / actualCropWidth);
                                  const relativeY = (lesion.y - cropY) * (128 / actualCropHeight);
                                  const relativeWidth = lesion.width * (128 / actualCropWidth);
                                  const relativeHeight = lesion.height * (128 / actualCropHeight);
                                  
                                  // 여드름 영역 하이라이트
                                  ctx.strokeStyle = '#ef4444';
                                  ctx.lineWidth = 2;
                                  ctx.strokeRect(relativeX, relativeY, relativeWidth, relativeHeight);
                                  
                                  // 반투명 오버레이
                                  ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
                                  ctx.fillRect(relativeX, relativeY, relativeWidth, relativeHeight);
                                }
                              }}
                            />
                          </div>
                          
                          {/* 신뢰도 배지 */}
                          <div className="bg-red-500 text-white text-xs font-medium px-3 py-2 rounded-lg text-center flex items-center justify-center gap-2">
                            <span>{Math.round(lesion.confidence * 100)}% 확신도</span>
                          </div>
                          
                          {/* 화살표 */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-white"></div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
                
                {/* 여드름 감지 요약 - 이미지 카드 내부로 이동 */}
                {analysisResult.acne_lesions && analysisResult.acne_lesions.length > 0 && (
                  <div className="bg-red-50 rounded-xl p-4 mt-4 max-w-2xl mx-auto">
                    <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      여드름 감지 결과
                    </h4>
                    <p className="text-sm text-red-700">
                      총 {analysisResult.acne_lesions.length}개의 여드름이 감지되었습니다.
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      * 빨간색 박스는 AI가 감지한 여드름 위치를 나타냅니다. <br />
                      * 마우스 호버링시 여드름 영역 확대 미리보기 가능.
                    </p>
                  </div>
                )}
              </div>


              {/* 📊 분석 대시보드 카드 */}
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 mb-8">
                <div className="text-center mb-6">
                  <h4 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                    상세 분석 대시보드
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">정밀한 피부 분석 차트와 통계</p>
                </div>
                
                {/* 분석 도구들 그리드 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 정밀 여드름 마킹 시스템 */}
                  {analysisResult.acne_lesions && analysisResult.acne_lesions.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-red-100">
                      <div className="p-4 border-b bg-gradient-to-r from-red-50 to-pink-50 rounded-t-2xl">
                        <h5 className="font-bold text-gray-800 flex items-center gap-2">
                          <Target className="w-5 h-5 text-red-600" />
                          정밀 여드름 마킹
                        </h5>
                        <p className="text-sm text-gray-600 mt-1">
                          {analysisResult.acne_lesions.length}개 감지 • 상세 분석 및 분류
                        </p>
                      </div>
                      <div className="overflow-visible">
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
                    </div>
                  )}

                  {/* 다중 피부 영역 분석 */}
                  <div className="bg-white rounded-2xl shadow-lg border border-purple-100">
                    <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-2xl">
                      <h5 className="font-bold text-gray-800 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-purple-600" />
                        다중 피부 영역 분석
                      </h5>
                      <p className="text-sm text-gray-600 mt-1">
                        수분도, 유분도, 모공, 색소침착 분석
                      </p>
                    </div>
                    <div className="overflow-visible">
                      <SkinAnalysisEngine
                        imageUrl={capturedImage}
                        analysisData={analysisResult}
                        enabledAnalyses={['moisture', 'oil', 'pores', 'pigmentation']}
                        interactive={true}
                        exportable={false}
                      />
                    </div>
                  </div>
                </div>
              </div>






              {/* OpenAI 전문가 분석 결과 - 사용자 친화적 구조 */}
              {analysisResult.ai_analysis && (
                <div className="mb-6 space-y-6">
                  
                  {/* 1. 핵심 지표 카드 (키워드 + 수치) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4">
                    {/* 예측 피부나이 */}
                    {analysisResult.ai_analysis.predicted_skin_age && (
                      <div className="bg-white rounded-xl p-5 shadow-lg border border-blue-100">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="w-6 h-6 text-blue-600" />
                          </div>
                          <h6 className="text-sm font-bold text-gray-600 mb-1">예측 피부나이</h6>
                          <p className="text-lg font-bold text-blue-600">
                            {analysisResult.ai_analysis.predicted_skin_age}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 예측 피부 민감도 */}
                    {analysisResult.ai_analysis.predicted_skin_sensitivity && (
                      <div className="bg-white rounded-xl p-5 shadow-lg border border-green-100">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Shield className="w-6 h-6 text-green-600" />
                          </div>
                          <h6 className="text-sm font-bold text-gray-600 mb-1">피부 민감도</h6>
                          <p className="text-lg font-bold text-green-600">
                            {analysisResult.ai_analysis.predicted_skin_sensitivity}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 기본 분석 지표 */}
                    <div className="bg-white rounded-xl p-5 shadow-lg border border-purple-100">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Zap className="w-6 h-6 text-purple-600" />
                        </div>
                        <h6 className="text-sm font-bold text-gray-600 mb-1">피부 타입</h6>
                        <p className="text-lg font-bold text-purple-600">
                          {analysisResult.skin_type}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. 피부 색상 파레트 (시각적 그라데이션) */}
                  {analysisResult.ai_analysis.skin_tone_palette && analysisResult.ai_analysis.skin_tone_palette.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-lg border">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                        <Palette className="w-5 h-5 text-pink-500" />
                        내 피부 색상 파레트
                      </h4>
                      
                      {/* 그라데이션 파레트 바 */}
                      <div className="mb-6">
                        <div 
                          className="h-20 rounded-xl shadow-inner relative overflow-hidden"
                          style={{
                            background: `linear-gradient(45deg, ${analysisResult.ai_analysis.skin_tone_palette
                              .map(color => {
                                const colorCode = color.match(/#[A-Fa-f0-9]{6}/);
                                return colorCode ? colorCode[0] : '#F5E6D3';
                              })
                              .join(', ')
                            })`
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                        </div>
                        <p className="text-center text-sm text-gray-500 mt-2">
                          ✨ 당신의 피부톤 스펙트럼
                        </p>
                      </div>

                      {/* 색상 상세 정보 */}
                      <div className="grid gap-3">
                        {analysisResult.ai_analysis.skin_tone_palette.map((colorInfo, index) => {
                          const colorCode = colorInfo.match(/#[A-Fa-f0-9]{6}/);
                          const colorName = colorInfo.split('(')[0].trim();
                          const description = colorInfo.split(': ')[1] || '';
                          
                          return (
                            <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                              <div 
                                className="w-12 h-12 rounded-full shadow-md border-2 border-white"
                                style={{ backgroundColor: colorCode ? colorCode[0] : '#F5E6D3' }}
                              ></div>
                              <div className="flex-1">
                                <h6 className="font-semibold text-gray-800">{colorName}</h6>
                                <p className="text-sm text-gray-600">{colorCode ? colorCode[0] : ''}</p>
                                {description && (
                                  <p className="text-sm text-gray-500 mt-1">{description}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. 상세 분석 */}
                  {analysisResult.ai_analysis.detailed_analysis && (
                    <div className="bg-white rounded-2xl p-6 shadow-lg border">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                        <Target className="w-5 h-5 text-indigo-500" />
                        상세 분석
                      </h4>
                      <div className="space-y-4">
                        {analysisResult.ai_analysis.detailed_analysis.skin_condition && (
                          <div className="bg-gray-50 rounded-xl p-4">
                            <h6 className="font-semibold text-gray-800 mb-2">피부 상태</h6>
                            <p className="text-gray-700 leading-relaxed">
                              {analysisResult.ai_analysis.detailed_analysis.skin_condition}
                            </p>
                          </div>
                        )}
                        {analysisResult.ai_analysis.detailed_analysis.key_points && (
                          <div className="bg-yellow-50 rounded-xl p-4 border-l-4 border-yellow-400">
                            <h6 className="font-semibold text-yellow-800 mb-2">주요 포인트</h6>
                            <p className="text-yellow-800">
                              {analysisResult.ai_analysis.detailed_analysis.key_points}
                            </p>
                          </div>
                        )}
                        {analysisResult.ai_analysis.detailed_analysis.improvement_direction && (
                          <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-400">
                            <h6 className="font-semibold text-blue-800 mb-2">개선 방향</h6>
                            <p className="text-blue-800">
                              {analysisResult.ai_analysis.detailed_analysis.improvement_direction}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 4. AI 맞춤 제품 추천 */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border">
                    <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2 text-lg">
                      <ShoppingBag className="w-5 h-5 text-blue-500" />
                      AI 맞춤 제품 추천
                    </h4>
                    
                    {/* 분석 기반 추천 카테고리 */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-blue-800">분석 결과 기반 추천</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        현재 피부 상태에 맞는 제품들을 엄선하여 추천드립니다
                      </p>
                    </div>

                    {/* 제품 카드 그리드 - AI 분석 결과 기반 동적 추천 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {getProductRecommendations(analysisResult).map((product, index) => {
                        // 카테고리별 배경 색상 매핑
                        const categoryStyles = {
                          cleanser: { bgGradient: 'from-green-50 to-emerald-50', borderColor: 'border-green-200' },
                          toner: { bgGradient: 'from-blue-50 to-cyan-50', borderColor: 'border-blue-200' },
                          serum: { bgGradient: 'from-purple-50 to-pink-50', borderColor: 'border-purple-200' },
                          moisturizer: { bgGradient: 'from-amber-50 to-orange-50', borderColor: 'border-amber-200' },
                          sunscreen: { bgGradient: 'from-yellow-50 to-orange-50', borderColor: 'border-yellow-200' },
                          treatment: { bgGradient: 'from-rose-50 to-pink-50', borderColor: 'border-rose-200' }
                        };

                        const style = categoryStyles[product.category] || categoryStyles.moisturizer;
                        
                        // 검색 쿼리 생성 (브랜드명 + 제품 타입)
                        const searchQueries = [
                          `${product.brand.split(' / ')[0]}+${product.category}`,
                          `${product.brand.split(' / ')[0]}+${product.category}`
                        ];

                        return (
                          <div key={`${product.category}-${index}`} className="relative">
                            <ProductCard
                              category={product.category}
                              title={product.title}
                              brand={product.brand}
                              features={product.features}
                              price={product.price}
                              priceColor={product.priceColor}
                              bgGradient={style.bgGradient}
                              borderColor={style.borderColor}
                              searchQueries={searchQueries}
                              productImages={productImages}
                              imageLoadingStates={imageLoadingStates}
                              directUrl={product.url}
                              imageUrl={product.imageUrl}
                            />
                            
                            {/* AI 추천 이유 배지 */}
                            <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                              <Brain className="w-3 h-3" />
                              AI 추천
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* AI 추천 상세 이유 */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-blue-800">개인 맞춤 추천 이유</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {getProductRecommendations(analysisResult).map((product, index) => (
                          <div key={index} className="bg-white/60 rounded-lg p-3">
                            <h6 className="font-medium text-gray-800 mb-1">{product.title}</h6>
                            <p className="text-gray-700 text-xs">{product.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI 추천 이유 */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span className="font-semibold text-indigo-800">AI 추천 이유</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="bg-white/60 rounded-lg p-3">
                          <h6 className="font-medium text-gray-800 mb-1">🔍 분석 결과 기반</h6>
                          <p className="text-gray-700 text-xs">현재 피부 상태와 문제점을 정확히 분석하여 맞춤형 제품을 선별했습니다</p>
                        </div>
                        <div className="bg-white/60 rounded-lg p-3">
                          <h6 className="font-medium text-gray-800 mb-1">💰 가성비 고려</h6>
                          <p className="text-gray-700 text-xs">효과 대비 합리적인 가격의 제품들로 구성된 루틴을 제안합니다</p>
                        </div>
                        <div className="bg-white/60 rounded-lg p-3">
                          <h6 className="font-medium text-gray-800 mb-1">🛡️ 안전성 검증</h6>
                          <p className="text-gray-700 text-xs">피부과 전문의 추천 성분과 임상 테스트를 거친 안전한 제품들입니다</p>
                        </div>
                        <div className="bg-white/60 rounded-lg p-3">
                          <h6 className="font-medium text-gray-800 mb-1">📊 데이터 기반</h6>
                          <p className="text-gray-700 text-xs">수천 건의 리뷰와 평점을 분석하여 실제 효과가 검증된 제품들입니다</p>
                        </div>
                      </div>
                    </div>

                    {/* 구매 가이드 */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-emerald-800">스마트 구매 가이드</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="text-emerald-700">
                          <strong>1단계:</strong> 클렌징과 토너부터 시작
                        </div>
                        <div className="text-emerald-700">
                          <strong>2단계:</strong> 2주 후 세럼과 크림 추가
                        </div>
                        <div className="text-emerald-700">
                          <strong>3단계:</strong> 4주 후 트리트먼트 제품 도입
                        </div>
                      </div>
                    </div>
                  </div>




                  
                </div>
              )}

              {/* 재분석 버튼 */}
              <div className="space-y-3">
                <button
                  onClick={resetAnalysis}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 px-6 rounded-2xl font-bold hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <RotateCw size={20} />
                  다시 분석하기
                </button>
              </div>
            </div>
          )}

          {/* 챗봇 상담 완료 후 분석 버튼 영역 - 분석 시작 전에만 표시 */}
          {isChatBotCompleted && capturedImage && currentStep === 'capture' && (
            <div className="max-w-sm sm:max-w-md md:max-w-lg mx-auto mt-8 sm:mt-12 text-center px-4" id="analysis-button-section">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  상담이 완료되었습니다! 🎉
                </h3>
                <p className="text-gray-600">
                  이제 AI가 당신의 피부를 정밀 분석해드릴게요
                </p>
              </div>
              
              {/* Liquid Glass 스타일 분석 버튼 */}
              <button
                onClick={analyzeSkin}
                className="liquid-glass-btn w-full py-6 px-8 rounded-3xl font-bold text-lg text-white 
                         bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500
                         relative overflow-hidden transform transition-all duration-500 
                         hover:scale-105 hover:shadow-2xl active:scale-95 group"
                style={{
                  background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.8) 0%, rgba(236, 72, 153, 0.8) 50%, rgba(99, 102, 241, 0.8) 100%)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px rgba(147, 51, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent 
                               transform -skew-x-12 -translate-x-full group-hover:translate-x-full 
                               transition-transform duration-1000"></div>
                <div className="relative flex items-center justify-center gap-3">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                  AI 피부 분석 시작하기
                  <Brain className="w-6 h-6 animate-bounce" />
                </div>
              </button>
              
              <p className="text-xs text-gray-500 mt-4">
                설문조사 데이터와 함께 개인화된 분석을 진행합니다
              </p>
            </div>
          )}
        </div>

        {/* 하단 정보 (2025년 디자인) */}
        <div className="text-center text-xs text-gray-500 space-y-1 bg-white/50 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Brain className="w-4 h-4" />
            <span className="font-semibold">2025년 최신 AI 기술 + OpenAI GPT-4 통합</span>
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
              OpenAI GPT-4
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

// Hover 모달 애니메이션을 위한 스타일
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-100%) translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(-100%) translateY(0);
    }
  }
  
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  @keyframes fadeInLeft {
    from {
      opacity: 0;
      transform: translateY(-50%) translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(-50%) translateX(0);
    }
  }
  
  @keyframes fadeInRight {
    from {
      opacity: 0;
      transform: translateX(-100%) translateY(-50%) translateX(10px);
    }
    to {
      opacity: 1;
      transform: translateX(-100%) translateY(-50%) translateX(0);
    }
  }
  
  .animate-fadeInUp {
    animation: fadeInUp 0.2s ease-out;
  }
  
  .animate-fadeInDown {
    animation: fadeInDown 0.2s ease-out;
  }
  
  .animate-fadeInLeft {
    animation: fadeInLeft 0.2s ease-out;
  }
  
  .animate-fadeInRight {
    animation: fadeInRight 0.2s ease-out;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

if (!document.querySelector('style[data-hover-modal]')) {
  style.setAttribute('data-hover-modal', 'true');
  document.head.appendChild(style);
}