#!/usr/bin/env python3
"""
화해 검색 로직 직접 테스트
"""

import asyncio
import logging
from hwahae_scraper import search_openai_products_on_hwahae

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_hwahae_search():
    """OpenAI 가짜 제품 목록으로 화해 검색 테스트"""
    
    # OpenAI가 주는 가짜 제품 목록 시뮬레이션
    fake_openai_products = [
        {
            "reason": "건조한 피부에 좋은 보습제입니다",
            "product_name": "일리윤 세라마이드 아토 집중 크림",
            "brand": "일리윤",
            "price": "₩25,000",
            "url": "https://www.hwahae.co.kr/app/products/1000000",  # 가짜 URL
            "image_url": "https://image.hwahae.co.kr/product/1000000.jpg",  # 가짜 이미지
            "short_summary": "건조한 피부를 위한 집중 보습 크림"
        },
        {
            "reason": "민감한 피부 진정에 효과적입니다",
            "product_name": "닥터자르트 시카페어 세럼",
            "brand": "닥터자르트",
            "price": "₩35,000",
            "url": "https://www.hwahae.co.kr/app/products/1000001",  # 가짜 URL
            "image_url": "https://image.hwahae.co.kr/product/1000001.jpg",  # 가짜 이미지
            "short_summary": "시카 성분으로 피부 진정"
        },
        {
            "reason": "자외선 차단이 중요합니다",
            "product_name": "라운드랩 365 안심 선크림",
            "brand": "라운드랩",
            "price": "₩18,000",
            "url": "https://www.hwahae.co.kr/app/products/1000002",  # 가짜 URL
            "image_url": "https://image.hwahae.co.kr/product/1000002.jpg",  # 가짜 이미지
            "short_summary": "매일 사용하기 좋은 순한 선크림"
        }
    ]
    
    print("=" * 60)
    print("🔍 가짜 OpenAI 제품 목록으로 화해 검색 테스트")
    print("=" * 60)
    
    print(f"📝 가짜 OpenAI 제품 수: {len(fake_openai_products)}")
    for i, product in enumerate(fake_openai_products, 1):
        print(f"  {i}. {product['brand']} - {product['product_name']}")
        print(f"     가짜 URL: {product['url']}")
        print(f"     가짜 이미지: {product['image_url']}")
    
    print("\n🔍 화해에서 실제 제품 검색 중...")
    
    # 화해 검색 실행
    real_products = await search_openai_products_on_hwahae(fake_openai_products)
    
    print(f"\n✅ 검색 완료: {len(real_products)}개 제품 처리")
    
    # 결과 비교
    for i, real_product in enumerate(real_products, 1):
        fake_product = fake_openai_products[i-1]
        
        print(f"\n--- 제품 {i} 비교 ---")
        print(f"🤖 OpenAI 가짜: {fake_product['product_name']}")
        print(f"🔍 화해 실제: {real_product.get('product_name')}")
        print(f"🤖 가짜 URL: {fake_product['url']}")
        print(f"🔍 실제 URL: {real_product.get('url')}")
        print(f"🤖 가짜 이미지: {fake_product['image_url']}")
        print(f"🔍 실제 이미지: {real_product.get('image_url')}")
        
        # 검증
        if 'img.hwahae.co.kr' in real_product.get('image_url', ''):
            print("✅ 실제 화해 이미지 성공")
        else:
            print("❌ 아직 가짜 이미지")
            
        if '/goods/' in real_product.get('url', ''):
            print("✅ 실제 화해 제품 페이지 성공")
        else:
            print("❌ 아직 가짜 URL")

if __name__ == "__main__":
    asyncio.run(test_hwahae_search())