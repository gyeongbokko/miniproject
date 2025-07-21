// 확장 가능한 피부 영역 분석 엔진
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Layers, Thermometer, Droplets, Zap, Eye, Map, 
  BarChart3, TrendingUp, Grid, Palette, Target,
  Settings, Download, Share2, Info, AlertCircle
} from 'lucide-react';

const SkinAnalysisEngine = ({ 
  imageUrl, 
  analysisData = {}, 
  enabledAnalyses = ['moisture', 'oil', 'pores', 'pigmentation'],
  onAnalysisUpdate,
  interactive = true,
  exportable = false
}) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  
  const [activeLayer, setActiveLayer] = useState('moisture');
  const [displayOptions, setDisplayOptions] = useState({
    showHeatmap: true,
    showGrid: false,
    showValues: true,
    opacity: 0.6,
    smoothing: true
  });
  
  const [analysisResults, setAnalysisResults] = useState({
    moisture: { regions: [], stats: {}, heatmap: null },
    oil: { regions: [], stats: {}, heatmap: null },
    pores: { regions: [], stats: {}, heatmap: null },
    pigmentation: { regions: [], stats: {}, heatmap: null },
    elasticity: { regions: [], stats: {}, heatmap: null },
    texture: { regions: [], stats: {}, heatmap: null }
  });
  
  const [regionSelection, setRegionSelection] = useState({
    selectedRegion: null,
    hoveredRegion: null,
    customRegions: []
  });

  // 분석 타입별 설정
  const analysisConfig = {
    moisture: {
      name: '수분도',
      icon: Droplets,
      color: '#3B82F6',
      unit: '%',
      ranges: { low: [0, 30], medium: [30, 70], high: [70, 100] },
      colorMap: ['#FEF3C7', '#FDE68A', '#F59E0B', '#3B82F6', '#1E40AF']
    },
    oil: {
      name: '유분도',
      icon: Zap,
      color: '#F59E0B',
      unit: '%',
      ranges: { low: [0, 30], medium: [30, 70], high: [70, 100] },
      colorMap: ['#FEF3C7', '#FDE68A', '#F59E0B', '#EA580C', '#DC2626']
    },
    pores: {
      name: '모공',
      icon: Grid,
      color: '#8B5CF6',
      unit: 'count/cm²',
      ranges: { fine: [0, 20], normal: [20, 40], enlarged: [40, 100] },
      colorMap: ['#F3E8FF', '#DDD6FE', '#C4B5FD', '#8B5CF6', '#7C3AED']
    },
    pigmentation: {
      name: '색소침착',
      icon: Palette,
      color: '#EC4899',
      unit: 'index',
      ranges: { light: [0, 3], medium: [3, 7], dark: [7, 10] },
      colorMap: ['#FDF2F8', '#FCE7F3', '#FBCFE8', '#EC4899', '#BE185D']
    },
    elasticity: {
      name: '탄력',
      icon: TrendingUp,
      color: '#10B981',
      unit: 'score',
      ranges: { poor: [0, 30], fair: [30, 70], good: [70, 100] },
      colorMap: ['#FEF3C7', '#D1FAE5', '#6EE7B7', '#10B981', '#047857']
    },
    texture: {
      name: '텍스처',
      icon: Map,
      color: '#F97316',
      unit: 'roughness',
      ranges: { smooth: [0, 2], moderate: [2, 5], rough: [5, 10] },
      colorMap: ['#FFF7ED', '#FFEDD5', '#FED7AA', '#F97316', '#EA580C']
    }
  };

  // 히트맵 생성
  const generateHeatmap = useCallback((analysisType, data) => {
    if (!imageRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const img = imageRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    const config = analysisConfig[analysisType];
    if (!config) return;
    
    // 분석 데이터를 히트맵으로 변환
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // 가상 데이터 생성 (실제로는 백엔드에서 받아와야 함)
    for (let y = 0; y < canvas.height; y += 4) {
      for (let x = 0; x < canvas.width; x += 4) {
        // 노이즈를 포함한 가상 데이터
        let value;
        
        switch (analysisType) {
          case 'moisture':
            value = 40 + Math.sin(x * 0.01) * 20 + Math.cos(y * 0.01) * 15 + Math.random() * 10;
            break;
          case 'oil':
            value = 30 + Math.sin(x * 0.02) * 25 + Math.cos(y * 0.015) * 20 + Math.random() * 15;
            break;
          case 'pores':
            value = 25 + Math.sin(x * 0.03) * 15 + Math.random() * 20;
            break;
          case 'pigmentation':
            value = 3 + Math.sin(x * 0.05) * 2 + Math.cos(y * 0.04) * 2 + Math.random() * 2;
            break;
          default:
            value = Math.random() * 100;
        }
        
        value = Math.max(0, Math.min(100, value));
        
        // 색상 계산
        const colorIndex = Math.floor((value / 100) * (config.colorMap.length - 1));
        const color = hexToRgb(config.colorMap[colorIndex]);
        
        if (color) {
          for (let dy = 0; dy < 4 && y + dy < canvas.height; dy++) {
            for (let dx = 0; dx < 4 && x + dx < canvas.width; dx++) {
              const index = ((y + dy) * canvas.width + (x + dx)) * 4;
              pixels[index] = color.r;
              pixels[index + 1] = color.g;
              pixels[index + 2] = color.b;
              pixels[index + 3] = Math.floor(displayOptions.opacity * 255);
            }
          }
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    if (displayOptions.smoothing) {
      ctx.filter = 'blur(2px)';
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
    }
    
    return canvas.toDataURL();
  }, [displayOptions]);

  // 색상 변환 유틸리티
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // 영역별 통계 계산
  const calculateRegionStats = useCallback((analysisType, regions) => {
    const config = analysisConfig[analysisType];
    if (!config || !regions.length) return {};
    
    const values = regions.map(r => r.value || 0);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length);
    
    // 범위별 분포
    const distribution = {};
    Object.entries(config.ranges).forEach(([range, [minVal, maxVal]]) => {
      distribution[range] = values.filter(v => v >= minVal && v < maxVal).length;
    });
    
    return {
      average: parseFloat(average.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      standardDeviation: parseFloat(std.toFixed(2)),
      distribution,
      totalRegions: regions.length
    };
  }, []);

  // 영역 클릭 처리
  const handleRegionClick = useCallback((event) => {
    if (!interactive || !imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 상대 좌표로 변환
    const relativeX = x / rect.width;
    const relativeY = y / rect.height;
    
    console.log('Clicked region:', { x: relativeX, y: relativeY });
    
    // 해당 위치의 분석 값 가져오기 (실제로는 백엔드에서)
    const mockValue = 50 + Math.random() * 40;
    
    setRegionSelection(prev => ({
      ...prev,
      selectedRegion: {
        x: relativeX,
        y: relativeY,
        value: mockValue,
        type: activeLayer
      }
    }));
  }, [interactive, activeLayer]);

  // 분석 실행
  const runAnalysis = useCallback(async (analysisType) => {
    if (!imageRef.current) return;
    
    // 실제로는 백엔드 API 호출
    console.log(`Running ${analysisType} analysis...`);
    
    // 가상 분석 결과 생성
    const mockRegions = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random(),
      y: Math.random(),
      width: 0.02 + Math.random() * 0.03,
      height: 0.02 + Math.random() * 0.03,
      value: Math.random() * 100,
      confidence: 0.7 + Math.random() * 0.3
    }));
    
    const stats = calculateRegionStats(analysisType, mockRegions);
    const heatmap = generateHeatmap(analysisType, mockRegions);
    
    setAnalysisResults(prev => ({
      ...prev,
      [analysisType]: {
        regions: mockRegions,
        stats,
        heatmap
      }
    }));
    
    if (onAnalysisUpdate) {
      onAnalysisUpdate(analysisType, { regions: mockRegions, stats, heatmap });
    }
  }, [calculateRegionStats, generateHeatmap, onAnalysisUpdate]);

  // 이미지 로드 시 초기 분석 실행
  useEffect(() => {
    if (imageUrl && enabledAnalyses.length > 0) {
      enabledAnalyses.forEach(analysisType => {
        runAnalysis(analysisType);
      });
    }
  }, [imageUrl, enabledAnalyses, runAnalysis]);

  // 활성 레이어 변경 시 히트맵 업데이트
  useEffect(() => {
    if (analysisResults[activeLayer]?.regions.length > 0) {
      generateHeatmap(activeLayer, analysisResults[activeLayer].regions);
    }
  }, [activeLayer, displayOptions, generateHeatmap, analysisResults]);

  const activeConfig = analysisConfig[activeLayer];
  const activeResults = analysisResults[activeLayer];

  return (
    <div className="w-full flex flex-col bg-gray-50 rounded-lg overflow-hidden">
      {/* 이미지 및 오버레이 */}
      <div className="flex-1 relative">
        {imageUrl && (
          <>
            <img
              ref={imageRef}
              src={imageUrl}
              alt="피부 분석 이미지"
              className="w-full h-full object-contain"
              onClick={handleRegionClick}
            />
            
            {/* 히트맵 오버레이 */}
            {displayOptions.showHeatmap && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{ opacity: displayOptions.opacity }}
              />
            )}
            
            {/* 선택된 영역 표시 */}
            {regionSelection.selectedRegion && (
              <div
                className="absolute w-4 h-4 border-2 border-white bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${regionSelection.selectedRegion.x * 100}%`,
                  top: `${regionSelection.selectedRegion.y * 100}%`
                }}
              >
                {displayOptions.showValues && (
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {regionSelection.selectedRegion.value.toFixed(1)}{activeConfig?.unit}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 컨트롤 패널들 - 이미지 아래 */}
      <div className="bg-white border-t p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* 레이어 선택 패널 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4" />
              분석 레이어
            </h4>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              {enabledAnalyses.map(analysisType => {
                const config = analysisConfig[analysisType];
                const Icon = config.icon;
                const isActive = activeLayer === analysisType;
                
                return (
                  <button
                    key={analysisType}
                    onClick={() => setActiveLayer(analysisType)}
                    className={`p-2 rounded-lg border-2 transition-all text-xs ${
                      isActive 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mx-auto mb-1 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                    <div className="font-medium">{config.name}</div>
                  </button>
                );
              })}
            </div>
            
            {/* 표시 옵션 */}
            <div className="space-y-2">
              <h5 className="font-medium text-gray-700 text-xs">표시 옵션</h5>
              
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={displayOptions.showHeatmap}
                  onChange={(e) => setDisplayOptions(prev => ({ 
                    ...prev, 
                    showHeatmap: e.target.checked 
                  }))}
                />
                히트맵 표시
              </label>
              
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={displayOptions.showValues}
                  onChange={(e) => setDisplayOptions(prev => ({ 
                    ...prev, 
                    showValues: e.target.checked 
                  }))}
                />
                수치 표시
              </label>
              
              <div>
                <label className="text-xs text-gray-600 block mb-1">
                  투명도: {Math.round(displayOptions.opacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={displayOptions.opacity}
                  onChange={(e) => setDisplayOptions(prev => ({ 
                    ...prev, 
                    opacity: parseFloat(e.target.value) 
                  }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* 통계 패널 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4" />
              {activeConfig?.name} 분석 결과
            </h4>
            
            {activeResults?.stats && (
              <div className="space-y-3">
                {/* 기본 통계 */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded">
                    <div className="text-gray-600">평균값</div>
                    <div className="font-bold text-blue-600">
                      {activeResults.stats.average}{activeConfig.unit}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <div className="text-gray-600">표준편차</div>
                    <div className="font-bold text-gray-800">
                      {activeResults.stats.standardDeviation}{activeConfig.unit}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <div className="text-gray-600">최솟값</div>
                    <div className="font-bold text-red-600">
                      {activeResults.stats.min}{activeConfig.unit}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <div className="text-gray-600">최댓값</div>
                    <div className="font-bold text-green-600">
                      {activeResults.stats.max}{activeConfig.unit}
                    </div>
                  </div>
                </div>
                
                {/* 분포 차트 */}
                <div>
                  <h6 className="font-medium text-gray-700 mb-2 text-xs">분포</h6>
                  <div className="space-y-1">
                    {Object.entries(activeResults.stats.distribution || {}).map(([range, count]) => {
                      const percentage = (count / activeResults.stats.totalRegions) * 100;
                      return (
                        <div key={range} className="flex items-center gap-2">
                          <span className="text-xs w-12 capitalize">{range}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-1">
                            <div
                              className="h-1 rounded-full bg-blue-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* 컬러 스케일 범례 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2 text-sm">
              <Palette className="w-4 h-4" />
              {activeConfig?.name} 스케일
            </h5>
            <div className="flex items-center gap-1 mb-2">
              {activeConfig?.colorMap.map((color, index) => (
                <div
                  key={index}
                  className="flex-1 h-3 first:rounded-l last:rounded-r"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>낮음</span>
              <span>높음</span>
            </div>
            
            {/* AI 해석 */}
            {activeResults?.stats && (
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                <div className="flex items-center gap-1 mb-1">
                  <Info className="w-3 h-3 text-blue-600" />
                  <span className="font-medium text-blue-800">AI 해석</span>
                </div>
                <p className="text-blue-700">
                  {activeLayer === 'moisture' && activeResults.stats.average < 40 && 
                    "수분 부족이 감지되었습니다."}
                  {activeLayer === 'oil' && activeResults.stats.average > 60 && 
                    "유분 과다가 관찰됩니다."}
                  {activeLayer === 'pores' && activeResults.stats.average > 30 && 
                    "모공이 확장된 영역이 많습니다."}
                  {(!activeResults.stats.average || 
                    (activeLayer === 'moisture' && activeResults.stats.average >= 40) ||
                    (activeLayer === 'oil' && activeResults.stats.average <= 60) ||
                    (activeLayer === 'pores' && activeResults.stats.average <= 30)) &&
                    "전반적으로 양호한 상태입니다."}
                </p>
              </div>
            )}
            
            {/* 액션 버튼 */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => runAnalysis(activeLayer)}
                className="flex-1 p-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                title="분석 새로고침"
              >
                <Target className="w-3 h-3" />
                새로고침
              </button>
              
              {exportable && (
                <button
                  onClick={() => {
                    const data = {
                      layer: activeLayer,
                      results: activeResults,
                      timestamp: new Date().toISOString()
                    };
                    console.log('Exporting analysis:', data);
                  }}
                  className="flex-1 p-2 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                  title="결과 내보내기"
                >
                  <Download className="w-3 h-3" />
                  내보내기
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkinAnalysisEngine;