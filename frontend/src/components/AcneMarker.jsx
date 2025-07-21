// 의료진 수준의 정밀 여드름 마킹 시스템
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Zap, Info, Eye, EyeOff, ZoomIn, ZoomOut, RotateCw, Target, 
  MapPin, AlertTriangle, CheckCircle, Download, Settings,
  Layers, Palette, Move, Square, Circle
} from 'lucide-react';

const AcneMarker = ({ 
  imageUrl, 
  acneLesions = [], 
  imageSize = { width: 0, height: 0 },
  onMarkerClick,
  showConfidence = true,
  showTypes = true,
  interactive = true,
  exportable = true
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const overlayRef = useRef(null);
  
  const [displayState, setDisplayState] = useState({
    showMarkers: true,
    showConfidence: true,
    showLabels: true,
    showGrid: false,
    showMeasurements: false
  });
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  
  const [filterOptions, setFilterOptions] = useState({
    minConfidence: 0.3,
    maxConfidence: 1.0,
    types: ['all'],
    sizes: ['all']
  });

  // 여드름 타입별 색상 및 스타일 정의
  const acneStyles = {
    'acne_0': { color: '#EF4444', name: '염증성 여드름', shape: 'circle' },
    'acne_1': { color: '#F97316', name: '비염증성 여드름', shape: 'square' },
    'acne_2': { color: '#8B5CF6', name: '낭포성 여드름', shape: 'diamond' },
    'acne_3': { color: '#EC4899', name: '결절성 여드름', shape: 'triangle' },
    'default': { color: '#DC2626', name: '여드름', shape: 'circle' }
  };

  // 신뢰도별 색상 계산
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return '#10B981'; // 초록
    if (confidence >= 0.7) return '#3B82F6'; // 파랑
    if (confidence >= 0.5) return '#F59E0B'; // 노랑
    return '#EF4444'; // 빨강
  };

  // 크기별 분류
  const getSizeCategory = (width, height) => {
    const area = width * height;
    if (area < 25) return 'small';
    if (area < 100) return 'medium';
    return 'large';
  };

  // 필터링된 여드름 목록
  const filteredLesions = acneLesions.filter(lesion => {
    const confidence = lesion.confidence || 0;
    const type = lesion.class || 'default';
    const size = getSizeCategory(lesion.width, lesion.height);
    
    return (
      confidence >= filterOptions.minConfidence &&
      confidence <= filterOptions.maxConfidence &&
      (filterOptions.types.includes('all') || filterOptions.types.includes(type)) &&
      (filterOptions.sizes.includes('all') || filterOptions.sizes.includes(size))
    );
  });

  // 이미지 로드 처리
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;
      
      // 컨테이너에 맞춰 초기 줌 설정
      const scaleX = container.clientWidth / img.naturalWidth;
      const scaleY = container.clientHeight / img.naturalHeight;
      const initialZoom = Math.min(scaleX, scaleY, 1);
      
      setZoom(initialZoom);
      setPan({ x: 0, y: 0 });
      
      // 이미지 크기 변화 감지를 위한 ResizeObserver 설정
      const resizeObserver = new ResizeObserver(() => {
        // 이미지 크기가 변경될 때 마커 위치 재계산 트리거
        forceUpdate();
      });
      
      resizeObserver.observe(img);
      resizeObserver.observe(container);
      
      // cleanup 함수로 observer 제거
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);
  
  // 강제 리렌더링을 위한 state
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const forceUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
  }, []);

  // 줌 제어
  const handleZoom = useCallback((delta, centerX = null, centerY = null) => {
    setZoom(prevZoom => {
      const newZoom = Math.max(0.1, Math.min(5, prevZoom + delta));
      
      if (centerX !== null && centerY !== null) {
        // 줌 중심점 기준으로 팬 조정
        const zoomRatio = newZoom / prevZoom;
        setPan(prevPan => ({
          x: centerX - (centerX - prevPan.x) * zoomRatio,
          y: centerY - (centerY - prevPan.y) * zoomRatio
        }));
      }
      
      return newZoom;
    });
  }, []);

  // 마커 클릭 처리
  const handleMarkerClick = useCallback((lesion, index) => {
    setSelectedMarker(selectedMarker === index ? null : index);
    if (onMarkerClick) {
      onMarkerClick(lesion, index);
    }
  }, [selectedMarker, onMarkerClick]);

  // 마커 렌더링
  const renderMarker = useCallback((lesion, index) => {
    if (!imageRef.current || !imageSize?.original) return null;
    
    const img = imageRef.current;
    
    // 이미지의 실제 표시 크기와 원본 크기 비율 계산
    const displayedWidth = img.clientWidth || img.offsetWidth || img.naturalWidth;
    const displayedHeight = img.clientHeight || img.offsetHeight || img.naturalHeight;
    
    // 원본 이미지 크기 대비 표시 크기 비율
    const scaleX = displayedWidth / imageSize.original.width;
    const scaleY = displayedHeight / imageSize.original.height;
    
    // 정규화된 좌표가 있으면 사용, 없으면 픽셀 좌표를 정규화해서 사용
    let normalizedX, normalizedY, normalizedWidth, normalizedHeight;
    
    if (lesion.normalized_x !== undefined && lesion.normalized_y !== undefined) {
      // 백엔드에서 제공한 정규화된 좌표 사용
      normalizedX = lesion.normalized_x;
      normalizedY = lesion.normalized_y;
      normalizedWidth = lesion.normalized_width || 0.02; // 기본 크기
      normalizedHeight = lesion.normalized_height || 0.02;
    } else {
      // 픽셀 좌표를 정규화
      normalizedX = lesion.x / imageSize.original.width;
      normalizedY = lesion.y / imageSize.original.height;
      normalizedWidth = lesion.width / imageSize.original.width;
      normalizedHeight = lesion.height / imageSize.original.height;
    }
    
    // 간단하고 정확한 좌표 계산
    const actualWidth = img.clientWidth || img.offsetWidth || img.naturalWidth;
    const actualHeight = img.clientHeight || img.offsetHeight || img.naturalHeight;
    
    // 정규화된 좌표를 직접 픽셀 좌표로 변환
    const x = (normalizedX * actualWidth * zoom) + pan.x;
    const y = (normalizedY * actualHeight * zoom) + pan.y;
    const width = Math.max(normalizedWidth * actualWidth * zoom, 8); // 최소 8px
    const height = Math.max(normalizedHeight * actualHeight * zoom, 8);
    
    const style = acneStyles[lesion.class] || acneStyles.default;
    const confidence = lesion.confidence || 0;
    const isSelected = selectedMarker === index;
    const isHovered = hoveredMarker === index;
    
    return (
      <div key={index} className="absolute pointer-events-auto">
        {/* 메인 마커 */}
        <div
          className={`absolute cursor-pointer transition-all duration-200 ${
            isSelected ? 'z-20' : isHovered ? 'z-10' : 'z-0'
          }`}
          style={{
            left: x,
            top: y,
            width: width,
            height: height,
            transform: isSelected ? 'scale(1.2)' : isHovered ? 'scale(1.1)' : 'scale(1)'
          }}
          onClick={() => handleMarkerClick(lesion, index)}
          onMouseEnter={() => setHoveredMarker(index)}
          onMouseLeave={() => setHoveredMarker(null)}
        >
          {/* 마커 모양 */}
          {style.shape === 'circle' && (
            <div
              className="w-full h-full rounded-full border-2"
              style={{
                borderColor: getConfidenceColor(confidence),
                backgroundColor: `${getConfidenceColor(confidence)}20`
              }}
            />
          )}
          
          {style.shape === 'square' && (
            <div
              className="w-full h-full border-2"
              style={{
                borderColor: getConfidenceColor(confidence),
                backgroundColor: `${getConfidenceColor(confidence)}20`
              }}
            />
          )}
          
          {style.shape === 'diamond' && (
            <div
              className="w-full h-full border-2 transform rotate-45"
              style={{
                borderColor: getConfidenceColor(confidence),
                backgroundColor: `${getConfidenceColor(confidence)}20`
              }}
            />
          )}
          
          {/* 중앙 점 */}
          <div
            className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{ backgroundColor: getConfidenceColor(confidence) }}
          />
        </div>
        
        {/* 신뢰도 라벨 */}
        {displayState.showConfidence && (
          <div
            className="absolute text-xs font-bold px-1 py-0.5 rounded text-white pointer-events-none"
            style={{
              left: x + width + 4,
              top: y - 4,
              backgroundColor: getConfidenceColor(confidence),
              fontSize: Math.max(8, 10 * zoom)
            }}
          >
            {Math.round(confidence * 100)}%
          </div>
        )}
        
        {/* 타입 라벨 */}
        {displayState.showLabels && (
          <div
            className="absolute text-xs bg-black bg-opacity-75 text-white px-1 py-0.5 rounded pointer-events-none"
            style={{
              left: x,
              top: y + height + 2,
              fontSize: Math.max(8, 10 * zoom)
            }}
          >
            {style.name}
          </div>
        )}
        
        {/* 선택된 마커의 상세 정보 */}
        {isSelected && (
          <div
            className="absolute bg-white rounded-lg shadow-lg p-3 border-2 z-30 min-w-48"
            style={{
              left: x + width + 8,
              top: y,
              borderColor: getConfidenceColor(confidence)
            }}
          >
            <div className="space-y-2 text-sm">
              <div className="font-bold text-gray-800 flex items-center gap-2">
                <Target className="w-4 h-4" />
                여드름 #{index + 1}
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>타입:</span>
                  <span className="font-medium">{style.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>신뢰도:</span>
                  <span className="font-medium" style={{ color: getConfidenceColor(confidence) }}>
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>크기:</span>
                  <span className="font-medium">{lesion.width}×{lesion.height}px</span>
                </div>
                <div className="flex justify-between">
                  <span>위치:</span>
                  <span className="font-medium">({lesion.x}, {lesion.y})</span>
                </div>
                <div className="flex justify-between">
                  <span>면적:</span>
                  <span className="font-medium">{lesion.width * lesion.height}px²</span>
                </div>
              </div>
              
              {/* 심각도 표시 */}
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2">
                  {confidence >= 0.8 ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : confidence >= 0.6 ? (
                    <Info className="w-4 h-4 text-blue-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-xs text-gray-600">
                    {confidence >= 0.8 ? '높은 확신도' : 
                     confidence >= 0.6 ? '보통 확신도' : '낮은 확신도'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }, [
    zoom, pan, selectedMarker, hoveredMarker, displayState, 
    handleMarkerClick, getConfidenceColor, acneStyles, imageSize, updateTrigger
  ]);

  // 통계 정보 계산
  const statistics = {
    total: filteredLesions.length,
    byType: {},
    byConfidence: {
      high: filteredLesions.filter(l => l.confidence >= 0.8).length,
      medium: filteredLesions.filter(l => l.confidence >= 0.6 && l.confidence < 0.8).length,
      low: filteredLesions.filter(l => l.confidence < 0.6).length
    },
    bySize: {
      small: filteredLesions.filter(l => getSizeCategory(l.width, l.height) === 'small').length,
      medium: filteredLesions.filter(l => getSizeCategory(l.width, l.height) === 'medium').length,
      large: filteredLesions.filter(l => getSizeCategory(l.width, l.height) === 'large').length
    }
  };

  // 타입별 통계
  filteredLesions.forEach(lesion => {
    const type = lesion.class || 'default';
    statistics.byType[type] = (statistics.byType[type] || 0) + 1;
  });

  return (
    <div className="w-full flex flex-col bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
      {/* 이미지 컨테이너 */}
      <div className="flex-1 relative" style={{ minHeight: '300px' }}>
        <div
          ref={containerRef}
          className="w-full h-full relative overflow-hidden"
          style={{ minHeight: '300px' }}
        >
          {imageUrl && (
            <img
              ref={imageRef}
              src={imageUrl}
              alt="분석 대상 이미지"
              className="w-full h-full object-contain"
              onLoad={handleImageLoad}
              draggable={false}
            />
          )}
          
          {/* 마커 오버레이 */}
          {imageLoaded && displayState.showMarkers && (
            <div className="absolute inset-0 pointer-events-none">
              {filteredLesions.map((lesion, index) => 
                renderMarker(lesion, index)
              )}
            </div>
          )}
        </div>
        
        {/* 로딩 상태 */}
        {!imageLoaded && imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="text-center">
              <RotateCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">이미지 로딩 중...</p>
            </div>
          </div>
        )}
      </div>

      {/* 컨트롤 패널들 - 이미지 아래 */}
      <div className="bg-white border-t p-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 컨트롤 패널 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="space-y-3">
              {/* 표시 옵션 */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4" />
                  표시 옵션
                </h4>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={displayState.showMarkers}
                      onChange={(e) => setDisplayState(prev => ({ ...prev, showMarkers: e.target.checked }))}
                    />
                    마커 표시
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={displayState.showConfidence}
                      onChange={(e) => setDisplayState(prev => ({ ...prev, showConfidence: e.target.checked }))}
                    />
                    신뢰도 표시
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={displayState.showLabels}
                      onChange={(e) => setDisplayState(prev => ({ ...prev, showLabels: e.target.checked }))}
                    />
                    라벨 표시
                  </label>
                </div>
              </div>
              
              
              {/* 필터 옵션 */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                  <Settings className="w-4 h-4" />
                  필터
                </h4>
                <div>
                  <label className="text-xs text-gray-600">최소 신뢰도</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={filterOptions.minConfidence}
                    onChange={(e) => setFilterOptions(prev => ({ 
                      ...prev, 
                      minConfidence: parseFloat(e.target.value) 
                    }))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500">
                    {Math.round(filterOptions.minConfidence * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 통계 패널 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm">
              <Target className="w-4 h-4" />
              감지 통계
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>총 개수:</span>
                <span className="font-bold text-blue-600">{statistics.total}</span>
              </div>
              
              <div className="pt-2 border-t space-y-1">
                <div className="text-xs font-medium text-gray-600">신뢰도별</div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">높음 (80%+):</span>
                  <span>{statistics.byConfidence.high}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600">보통 (60-80%):</span>
                  <span>{statistics.byConfidence.medium}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-yellow-600">낮음 (60% 미만):</span>
                  <span>{statistics.byConfidence.low}</span>
                </div>
              </div>
              
              <div className="pt-2 border-t space-y-1">
                <div className="text-xs font-medium text-gray-600">크기별</div>
                <div className="flex justify-between text-xs">
                  <span>소형:</span>
                  <span>{statistics.bySize.small}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>중형:</span>
                  <span>{statistics.bySize.medium}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>대형:</span>
                  <span>{statistics.bySize.large}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 범례 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm">
              <Palette className="w-4 h-4" />
              범례
            </h4>
            <div className="space-y-1">
              {Object.entries(acneStyles).filter(([key]) => key !== 'default').map(([key, style]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 border-2"
                    style={{
                      backgroundColor: `${style.color}20`,
                      borderColor: style.color,
                      borderRadius: style.shape === 'circle' ? '50%' : '0'
                    }}
                  />
                  <span>{style.name}</span>
                </div>
              ))}
              
              <div className="pt-2 border-t space-y-1">
                <div className="text-xs font-medium text-gray-600">신뢰도 색상</div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded bg-green-500" />
                  <span>90%+</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded bg-blue-500" />
                  <span>70-90%</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded bg-yellow-500" />
                  <span>50-70%</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded bg-red-500" />
                  <span>50% 미만</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcneMarker;