#!/usr/bin/env python3
"""
백엔드 API 직접 테스트
"""

import requests
import base64
from PIL import Image
import io

def create_test_image():
    """테스트용 간단한 이미지 생성"""
    # 200x200 RGB 이미지 생성
    img = Image.new('RGB', (200, 200), color='pink')
    
    # 바이트로 변환
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes = img_bytes.getvalue()
    
    # base64 인코딩
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')
    
    return img_base64

def test_skin_analysis():
    """피부 분석 API 테스트"""
    print("🧪 피부 분석 API 테스트 시작...")
    
    # 테스트 이미지 생성
    test_image = create_test_image()
    
    # API 요청 데이터
    data = {
        "image": test_image,
        "analysisType": "comprehensive"
    }
    
    # API 호출
    try:
        print("📤 API 요청 중...")
        response = requests.post(
            "http://localhost:8001/analyze-skin-base64",
            json=data,
            timeout=60
        )
        
        print(f"📥 응답 상태: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            print("✅ API 호출 성공!")
            
            # 제품 추천 확인
            recommendations = result.get('analysis', {}).get('product_recommendations', [])
            print(f"🎯 제품 추천 개수: {len(recommendations)}")
            
            for i, product in enumerate(recommendations, 1):
                print(f"\n--- 제품 {i} ---")
                print(f"이름: {product.get('product_name')}")
                print(f"브랜드: {product.get('brand')}")
                print(f"URL: {product.get('url')}")
                print(f"이미지: {product.get('image_url')}")
                
                # 화해 검색 결과인지 확인
                image_url = product.get('image_url', '')
                if 'img.hwahae.co.kr' in image_url or 'localhost:8001/proxy-image' in image_url:
                    print("✅ 실제 화해 데이터 성공!")
                elif 'image.hwahae.co.kr' in image_url:
                    print("❌ 아직 가짜 OpenAI 데이터")
                else:
                    print("❓ 알 수 없는 이미지 소스")
        else:
            print(f"❌ API 호출 실패: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")

if __name__ == "__main__":
    test_skin_analysis()