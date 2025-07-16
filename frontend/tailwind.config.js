/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        // 2025년 최신 색상 팔레트
        colors: {
          'ai-pink': {
            50: '#fef7ee',
            100: '#fef3e2',
            200: '#fce7ca',
            300: '#f9d5a7',
            400: '#f4b678',
            500: '#ec4899',
            600: '#db2777',
            700: '#be185d',
            800: '#9d174d',
            900: '#831843',
          },
          'ai-purple': {
            50: '#f8f4ff',
            100: '#f1e8ff',
            200: '#e5d4ff',
            300: '#d2b4ff',
            400: '#b888ff',
            500: '#8b5cf6',
            600: '#7c3aed',
            700: '#6d28d9',
            800: '#5b21b6',
            900: '#4c1d95',
          },
          'ai-blue': {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
          },
          'ai-gradient': {
            'start': '#ec4899',
            'middle': '#8b5cf6',
            'end': '#3b82f6',
          }
        },
        
        // 2025년 최신 폰트 패밀리
        fontFamily: {
          'display': ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
          'body': ['Inter', 'SF Pro Text', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
          'mono': ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
        },
        
        // 2025년 최신 애니메이션
        animation: {
          'fade-in': 'fadeIn 0.6s ease-out',
          'fade-in-up': 'fadeInUp 0.6s ease-out',
          'fade-in-down': 'fadeInDown 0.6s ease-out',
          'slide-in-up': 'slideInUp 0.8s ease-out',
          'slide-in-down': 'slideInDown 0.8s ease-out',
          'scale-in': 'scaleIn 0.5s ease-out',
          'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
          'glow': 'glow 2s ease-in-out infinite alternate',
          'shimmer': 'shimmer 2.5s linear infinite',
          'float': 'float 3s ease-in-out infinite',
          'blur-in': 'blurIn 0.8s ease-out',
          'ai-pulse': 'aiPulse 2s ease-in-out infinite',
        },
        
        // 2025년 최신 키프레임
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          fadeInUp: {
            '0%': { opacity: '0', transform: 'translateY(30px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          fadeInDown: {
            '0%': { opacity: '0', transform: 'translateY(-30px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          slideInUp: {
            '0%': { opacity: '0', transform: 'translateY(100px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          slideInDown: {
            '0%': { opacity: '0', transform: 'translateY(-100px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          scaleIn: {
            '0%': { opacity: '0', transform: 'scale(0.9)' },
            '100%': { opacity: '1', transform: 'scale(1)' },
          },
          bounceGentle: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-10px)' },
          },
          glow: {
            '0%': { boxShadow: '0 0 20px rgba(236, 72, 153, 0.3)' },
            '100%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.5)' },
          },
          shimmer: {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' },
          },
          float: {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-20px)' },
          },
          blurIn: {
            '0%': { filter: 'blur(10px)', opacity: '0' },
            '100%': { filter: 'blur(0px)', opacity: '1' },
          },
          aiPulse: {
            '0%, 100%': { 
              transform: 'scale(1)', 
              boxShadow: '0 0 0 0 rgba(139, 92, 246, 0.7)'
            },
            '50%': { 
              transform: 'scale(1.05)', 
              boxShadow: '0 0 0 10px rgba(139, 92, 246, 0)'
            },
          },
        },
        
        // 2025년 최신 배경 이미지
        backgroundImage: {
          'ai-gradient': 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
          'ai-gradient-soft': 'linear-gradient(135deg, #fef7ee 0%, #f8f4ff 50%, #eff6ff 100%)',
          'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)',
          'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(28,100%,74%,1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,100%,93%,1) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(340,100%,76%,1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(22,100%,77%,1) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(242,100%,70%,1) 0px, transparent 50%), radial-gradient(at 0% 0%, hsla(343,100%,76%,1) 0px, transparent 50%)',
          'neural-network': 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        },
        
        // 2025년 최신 박스 섀도우
        boxShadow: {
          'ai-soft': '0 4px 6px -1px rgba(139, 92, 246, 0.1), 0 2px 4px -1px rgba(139, 92, 246, 0.06)',
          'ai-medium': '0 10px 15px -3px rgba(139, 92, 246, 0.1), 0 4px 6px -2px rgba(139, 92, 246, 0.05)',
          'ai-large': '0 20px 25px -5px rgba(139, 92, 246, 0.1), 0 10px 10px -5px rgba(139, 92, 246, 0.04)',
          'ai-glow': '0 0 20px rgba(139, 92, 246, 0.3)',
          'ai-glow-lg': '0 0 40px rgba(139, 92, 246, 0.4)',
          'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          'glass-lg': '0 25px 45px 0 rgba(31, 38, 135, 0.25)',
          'neumorphism': '12px 12px 20px #d1d9e6, -12px -12px 20px #ffffff',
          'inner-glow': 'inset 0 2px 4px 0 rgba(139, 92, 246, 0.1)',
        },
        
        // 2025년 최신 블러 효과
        backdropBlur: {
          'xs': '2px',
          'sm': '4px',
          'md': '8px',
          'lg': '16px',
          'xl': '24px',
          '2xl': '40px',
          '3xl': '64px',
        },
        
        // 2025년 최신 보더 라디우스
        borderRadius: {
          'xl': '1rem',
          '2xl': '1.5rem',
          '3xl': '2rem',
          '4xl': '2.5rem',
          '5xl': '3rem',
          'full': '9999px',
        },
        
        // 2025년 최신 스페이싱
        spacing: {
          '18': '4.5rem',
          '88': '22rem',
          '100': '25rem',
          '112': '28rem',
          '128': '32rem',
          '144': '36rem',
        },
        
        // 2025년 최신 z-index
        zIndex: {
          '60': '60',
          '70': '70',
          '80': '80',
          '90': '90',
          '100': '100',
          'modal': '1000',
          'popover': '1010',
          'tooltip': '1020',
          'toast': '1030',
        },
        
        // 2025년 최신 필터
        filter: {
          'none': 'none',
          'blur': 'blur(4px)',
          'brightness': 'brightness(1.25)',
          'contrast': 'contrast(1.25)',
          'drop-shadow': 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
          'grayscale': 'grayscale(1)',
          'hue-rotate': 'hue-rotate(90deg)',
          'invert': 'invert(1)',
          'saturate': 'saturate(1.5)',
          'sepia': 'sepia(1)',
        },
        
        // 2025년 최신 그라데이션 정의
        gradientColorStops: {
          'ai-start': '#ec4899',
          'ai-middle': '#8b5cf6',
          'ai-end': '#3b82f6',
        },
      },
    },
    plugins: [
      // 2025년 최신 커스텀 유틸리티
      function({ addUtilities, addComponents, theme }) {
        const newUtilities = {
          // 글래스모피즘 효과
          '.glass': {
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          },
          
          // 2025년 AI 그라데이션 텍스트
          '.ai-gradient-text': {
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
          },
          
          // 2025년 뉴모피즘 효과
          '.neumorphism': {
            background: '#f0f0f3',
            boxShadow: '12px 12px 20px #d1d9e6, -12px -12px 20px #ffffff',
            borderRadius: '20px',
          },
          
          // 2025년 호버 리프트 효과
          '.hover-lift': {
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-8px) scale(1.02)',
              boxShadow: '0 20px 40px rgba(139, 92, 246, 0.2)',
            },
          },
          
          // 2025년 맥스 플로팅 효과
          '.float-animation': {
            animation: 'float 3s ease-in-out infinite',
          },
          
          // 2025년 AI 펄스 효과
          '.ai-pulse': {
            animation: 'aiPulse 2s ease-in-out infinite',
          },
          
          // 2025년 그라데이션 보더
          '.gradient-border': {
            background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)',
            padding: '2px',
            borderRadius: '16px',
            '& > *': {
              background: 'white',
              borderRadius: '14px',
            },
          },
          
          // 2025년 텍스트 셰도우
          '.text-shadow': {
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          },
          
          '.text-shadow-lg': {
            textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          },
          
          // 2025년 스크롤바 숨김
          '.scrollbar-hide': {
            '-ms-overflow-style': 'none',
            'scrollbar-width': 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
          },
          
          // 2025년 커스텀 스크롤바
          '.scrollbar-custom': {
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: 'linear-gradient(135deg, #db2777, #7c3aed)',
            },
          },
        }
        
        addUtilities(newUtilities)
        
        // 2025년 최신 컴포넌트
        const newComponents = {
          '.btn-ai': {
            background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
            color: '#ffffff',
            fontWeight: '600',
            padding: '12px 24px',
            borderRadius: '16px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.2)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(139, 92, 246, 0.3)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          
          '.card-ai': {
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
            padding: '24px',
          },
          
          '.input-ai': {
            background: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '16px',
            transition: 'all 0.3s ease',
            '&:focus': {
              outline: 'none',
              borderColor: '#8b5cf6',
              boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.1)',
            },
          },
        }
        
        addComponents(newComponents)
      }
    ],
  }