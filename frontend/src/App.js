// 2025년 최신 React App 컴포넌트
import React, { useState, useEffect } from 'react';
import SkinAnalyzer2025 from './components/SkinAnalyzer2025';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 온라인/오프라인 상태 감지 (2025년 개선)
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      console.log('🌐 온라인 상태로 전환됨');
    }

    function handleOffline() {
      setIsOnline(false);
      console.log('📡 오프라인 상태로 전환됨');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // PWA 설치 프롬프트 감지 (2025년 최신)
  useEffect(() => {
    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setInstallPrompt(e);
      console.log('📱 PWA 설치 프롬프트 준비됨');
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // 앱 로딩 (2025년 개선)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // PWA 설치 (2025년 개선)
  const handleInstallApp = async () => {
    if (!installPrompt) return;

    try {
      const result = await installPrompt.prompt();
      console.log('PWA 설치 결과:', result.outcome);
      
      if (result.outcome === 'accepted') {
        console.log('✅ 사용자가 앱 설치를 수락했습니다');
      }
    } catch (error) {
      console.error('PWA 설치 오류:', error);
    }
    
    setInstallPrompt(null);
  };

  // 로딩 화면 (2025년 디자인)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🧠</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            AI 피부 분석기
          </h2>
          <p className="text-gray-600 text-sm mb-4">2025년 최신 기술로 준비 중...</p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
            <span>Advanced AI Loading</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* 오프라인 알림 (2025년 디자인) */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-center py-3 z-50 shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
            <span className="text-sm font-medium">
              🌐 인터넷 연결이 끊어졌습니다. AI 분석 기능이 제한됩니다.
            </span>
          </div>
        </div>
      )}

      {/* PWA 설치 배너 (2025년 디자인) */}
      {installPrompt && (
        <div className="fixed bottom-6 left-4 right-4 z-40 animate-slide-in-up">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">📱</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">
                    앱으로 설치하기
                  </h3>
                  <p className="text-xs text-gray-600">
                    홈 화면에 추가하여 더 빠르게 접근하세요
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setInstallPrompt(null)}
                  className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors rounded-lg"
                >
                  나중에
                </button>
                <button
                  onClick={handleInstallApp}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-semibold rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  설치
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <main className="relative">
        <SkinAnalyzer2025 />
      </main>

      {/* 2025년 푸터 */}
      <footer className="bg-white/60 backdrop-blur-sm py-8 mt-8">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="space-y-3 text-xs text-gray-500">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="font-medium">
                서비스 상태: {isOnline ? '🟢 온라인' : '🔴 오프라인'}
              </span>
            </div>
            
            <div className="border-t border-gray-200 pt-3">
              <p className="font-medium text-gray-700 mb-2">
                © 2025 AI 피부 분석기
              </p>
              <p className="text-gray-500 mb-3">
                Made with 🧠 AI & ❤️ by Advanced Technology
              </p>
              
              <div className="flex justify-center gap-6 text-xs">
                <button 
                  onClick={() => {
                    alert('개인정보처리방침\n\n• 사용자의 사진은 분석 즉시 삭제됩니다\n• 어떠한 개인정보도 서버에 저장되지 않습니다\n• 분석 결과는 브라우저에서만 처리됩니다\n• GDPR 및 개인정보보호법을 준수합니다');
                  }}
                  className="text-purple-600 hover:text-purple-700 transition-colors font-medium"
                >
                  개인정보처리방침
                </button>
                <span className="text-gray-300">•</span>
                <button 
                  onClick={() => {
                    alert('이용약관\n\n• 본 서비스는 참고용 분석 도구입니다\n• 정확한 피부 진단은 피부과 전문의와 상담하세요\n• AI 분석 결과는 의학적 진단을 대체하지 않습니다\n• 서비스 이용 시 약관에 동의한 것으로 간주됩니다');
                  }}
                  className="text-purple-600 hover:text-purple-700 transition-colors font-medium"
                >
                  이용약관
                </button>
                <span className="text-gray-300">•</span>
                <button 
                  onClick={() => {
                    alert('고객 지원\n\n📧 이메일: support@skinanalyzer.com\n💬 실시간 채팅: 평일 9:00-18:00\n📞 전화: 1588-0000\n\n2025년 최신 AI 기술로 더 나은 서비스를 제공합니다.');
                  }}
                  className="text-purple-600 hover:text-purple-700 transition-colors font-medium"
                >
                  고객지원
                </button>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  AI Powered
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Real-time Analysis
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  2025 Technology
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;