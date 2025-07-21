#!/usr/bin/env python3
"""
화해-OpenAI 통합 시스템 최종 테스트
"""

import asyncio
import logging
from hwahae_scraper import search_openai_products_on_hwahae

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_complete_workflow():
    """완전한 워크플로우 테스트"""
    print("=" * 60)
    print("🧪 화해-OpenAI 통합 시스템 최종 테스트")
    print("=" * 60)
    
    # 1. OpenAI 추천 제품 시뮬레이션 (실제 OpenAI 응답과 유사한 형태)
    openai_recommendations = [
        {
            "reason": "민감한 피부에 적합한 저자극 토너로, 독도 해수를 사용해 진정 효과가 뛰어납니다.",
            "product_name": "1025 독도 토너",
            "brand": "라운드랩",
            "price": "₩20,000",
            "short_summary": "민감 피부를 위한 진정 토너"
        },
        {
            "reason": "5종 히알루론산으로 깊은 수분 공급이 가능하여 건조한 피부에 효과적입니다.",
            "product_name": "다이브인 히알루론산 세럼",
            "brand": "토리든",
            "price": "₩25,000",
            "short_summary": "고농축 수분 공급 세럼"
        },
        {
            "reason": "모든 피부타입에 안전하며 세안 후에도 촉촉함을 유지해줍니다.",
            "product_name": "하이드레이팅 포밍 클렌저",
            "brand": "세타필",
            "price": "₩24,000",
            "short_summary": "저자극 폼 클렌저"
        }
    ]
    
    print(f"📝 OpenAI 추천 제품 수: {len(openai_recommendations)}")
    for i, product in enumerate(openai_recommendations, 1):
        print(f"  {i}. {product['brand']} - {product['product_name']}")
    
    print("\n🔍 화해에서 실제 제품 정보 검색 중...")
    
    # 2. 화해에서 실제 제품 검색
    real_products = await search_openai_products_on_hwahae(openai_recommendations)
    
    print(f"\n✅ 검색 완료: {len(real_products)}/{len(openai_recommendations)}개 제품 처리")
    
    # 3. 결과 검증
    success_count = 0
    for i, product in enumerate(real_products, 1):
        print(f"\n--- 제품 {i} 결과 ---")
        print(f"추천 이유: {product.get('reason')}")
        print(f"제품명: {product.get('product_name')}")
        print(f"브랜드: {product.get('brand')}")
        print(f"가격: {product.get('price')}")
        print(f"URL: {product.get('url')}")
        
        # 이미지 URL 검증
        image_url = product.get('image_url', '')
        if 'placeholder' not in image_url and 'hwahae.co.kr' in image_url:
            print(f"이미지: ✅ 실제 화해 이미지")
            success_count += 1
        else:
            print(f"이미지: ❌ 플레이스홀더 이미지")
        
        # URL 검증
        url = product.get('url', '')
        if '/goods/' in url or '/products/' in url:
            print(f"URL: ✅ 실제 화해 제품 페이지")
        else:
            print(f"URL: ❌ 검색 페이지 또는 기타")
    
    # 4. 최종 평가
    print(f"\n" + "=" * 60)
    print(f"🎯 최종 결과")
    print(f"=" * 60)
    print(f"총 제품 수: {len(openai_recommendations)}")
    print(f"성공적으로 처리된 제품: {len(real_products)}")
    print(f"실제 화해 이미지를 찾은 제품: {success_count}")
    print(f"성공률: {(len(real_products)/len(openai_recommendations)*100):.1f}%")
    
    if len(real_products) == len(openai_recommendations):
        print("✅ 모든 제품이 성공적으로 처리되었습니다!")
    else:
        print("⚠️  일부 제품 처리에 실패했습니다.")
    
    return real_products

if __name__ == "__main__":
    asyncio.run(test_complete_workflow())