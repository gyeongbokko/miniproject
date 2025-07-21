// 피부 상담 챗봇 컴포넌트
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader } from 'lucide-react';

const SkinChatBot = ({ capturedImage, onSurveyComplete }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStage, setChatStage] = useState(1);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null); // 입력창 자동 포커스용

  const API_BASE_URL = 'http://localhost:8000';

  // 자동 스크롤 - 챗봇 컨테이너 내부에서만 스크롤
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 자동 포커스 - 실시간 채팅 개선
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current && !isLoading) {
        inputRef.current.focus();
      }
    };
    
    // 메시지 변화 시 약간의 딜레이 후 포커스
    const timer = setTimeout(focusInput, 100);
    
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  // 초기 인사말
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = {
        role: 'assistant',
        content: '안녕하세요! 피부 상담 챗봇이에요😊 업로드하신 사진을 바탕으로 피부 상담을 도와드릴게요.\n\n먼저 연령대를 알려주시면 도움이 될 것 같아요!\n\n1) 10대  2) 20대  3) 30대  4) 40대  5) 50대  6) 60대 이상\n\n주요 피부 고민도 편하게 말씀해 주세요.',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);

  // 메시지 전송
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 대화 히스토리 준비
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          conversation_history: conversationHistory,
          user_stage: chatStage
        }),
      });

      if (!response.ok) {
        throw new Error('챗봇 서비스에 오류가 발생했습니다.');
      }

      const data = await response.json();

      const botMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toLocaleTimeString(),
        is_final: data.is_final
      };

      setMessages(prev => [...prev, botMessage]);
      setChatStage(data.stage);

      // 설문조사 완료 시 부모 컴포넌트에 데이터 전달
      if (data.is_final && data.collected_info && onSurveyComplete) {
        onSurveyComplete(data.collected_info);
      }

    } catch (error) {
      console.error('챗봇 오류:', error);
      const errorMessage = {
        role: 'assistant',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해 주세요.',
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 엔터키 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* 챗봇 헤더 */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-white bg-opacity-20 rounded-full p-2">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">피부 상담 챗봇</h3>
            <p className="text-sm opacity-90">단계 {chatStage}/6 진행 중</p>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div 
        ref={chatContainerRef}
        className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* 아바타 */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.isError
                    ? 'bg-red-500 text-white'
                    : 'bg-purple-500 text-white'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* 메시지 버블 */}
              <div
                className={`px-4 py-2 rounded-lg shadow-sm ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : message.isError
                    ? 'bg-red-100 text-red-800 border border-red-200 rounded-bl-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 opacity-70 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp}
                </p>
                {message.is_final && (
                  <div className="mt-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    상담 완료 ✅
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 rounded-bl-none">
                <div className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">답변 작성 중...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows="2"
            disabled={isLoading}
            autoFocus
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg p-2 transition-colors duration-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Shift + Enter로 줄바꿈, Enter로 전송
        </p>
      </div>
    </div>
  );
};

export default SkinChatBot; 