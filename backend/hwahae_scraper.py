"""
화해(Hwahae) 제품 검색 및 크롤링 모듈 - OpenAI 추천 제품 실시간 검색
"""

import asyncio
import aiohttp
import json
import logging
from typing import Dict, List, Any, Optional
from urllib.parse import quote, urljoin, parse_qs, urlparse
import re
from bs4 import BeautifulSoup
import time
import random
from playwright.async_api import async_playwright

logger = logging.getLogger(__name__)

class HwahaeProductScraper:
    """화해 제품 정보 크롤링 클래스 - 실시간 검색"""
    
    def __init__(self):
        self.base_url = "https://www.hwahae.co.kr"
        self.api_url = "https://www.hwahae.co.kr/api"
        self.session = None
        self.timeout = aiohttp.ClientTimeout(total=5)  # 5초 타임아웃
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.hwahae.co.kr/',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
        }
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(headers=self.headers, timeout=self.timeout)
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def search_product_by_name(self, product_name: str, brand: str = None) -> Optional[Dict[str, Any]]:
        """Playwright로 화해에서 실제 제품 검색"""
        try:
            # 검색 쿼리 준비
            search_query = product_name
            if brand and brand.lower() not in product_name.lower():
                search_query = f"{brand} {product_name}"
            
            logger.info(f"🔍 Playwright로 화해 검색: '{search_query}'")
            
            async with async_playwright() as p:
                # 헤드리스 브라우저 실행
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                )
                page = await context.new_page()
                
                try:
                    # 화해 검색 페이지로 이동
                    search_url = f"https://www.hwahae.co.kr/search?keyword={quote(search_query)}&tab=goods"
                    logger.info(f"검색 URL: {search_url}")
                    
                    await page.goto(search_url, wait_until='domcontentloaded', timeout=30000)
                    
                    # 제품 결과가 로드될 때까지 대기
                    await page.wait_for_timeout(2000)
                    
                    # 화해 사이트 구조에 맞는 제품 요소 찾기
                    await page.wait_for_timeout(3000)  # 더 긴 대기 시간
                    
                    # 다양한 방법으로 제품 찾기
                    product_elements = []
                    
                    # 방법 1: 제품 링크 직접 찾기
                    links = await page.query_selector_all('a[href*="/goods/"], a[href*="/products/"], a[href*="product"]')
                    if links:
                        product_elements = links
                        logger.info(f"방법1: {len(links)}개 제품 링크 발견")
                    
                    # 방법 2: 제품 카드나 아이템 찾기
                    if not product_elements:
                        cards = await page.query_selector_all('[class*="product"], [class*="item"], [class*="card"]')
                        if cards:
                            product_elements = cards
                            logger.info(f"방법2: {len(cards)}개 제품 카드 발견")
                    
                    # 방법 3: 이미지가 있는 요소 찾기 (제품일 가능성 높음)
                    if not product_elements:
                        img_containers = await page.query_selector_all('div:has(img), article:has(img)')
                        if img_containers:
                            product_elements = img_containers
                            logger.info(f"방법3: {len(img_containers)}개 이미지 컨테이너 발견")
                    
                    if product_elements:
                        # 첫 번째 제품 정보 추출
                        first_product = product_elements[0]
                        
                        # 화해 사이트에서 실제 제품 링크 찾기
                        product_url = ""
                        extracted_name = product_name
                        image_url = ""
                        
                        # 화해 사이트의 제품 링크 직접 찾기
                        product_links = await page.query_selector_all('a[href*="goods/"]')
                        if not product_links:
                            product_links = await page.query_selector_all('a[href*="products/"]')
                        
                        logger.info(f"제품 링크 {len(product_links)}개 발견")
                        
                        if product_links:
                            # 검색어와 가장 관련있는 제품 찾기
                            best_match = None
                            best_score = 0
                            
                            for link in product_links[:5]:  # 처음 5개 제품만 확인
                                try:
                                    link_text = await link.inner_text()
                                    if not link_text:
                                        continue
                                    
                                    # 검색어와 매칭 점수 계산
                                    search_words = search_query.lower().split()
                                    link_words = link_text.lower().split()
                                    
                                    score = 0
                                    for search_word in search_words:
                                        for link_word in link_words:
                                            if search_word in link_word or link_word in search_word:
                                                score += 1
                                    
                                    if score > best_score:
                                        best_score = score
                                        best_match = link
                                        
                                except Exception:
                                    continue
                            
                            # 매칭된 제품이 없으면 첫 번째 제품 사용
                            selected_link = best_match if best_match else product_links[0]
                            
                            href = await selected_link.get_attribute('href')
                            if href:
                                # URL에서 불필요한 파라미터 제거
                                clean_href = href.split('?')[0]  # ? 이후 파라미터 제거
                                product_url = f"https://www.hwahae.co.kr/{clean_href}" if not clean_href.startswith('http') else clean_href
                                logger.info(f"선택된 제품 URL: {product_url} (매칭점수: {best_score})")
                                
                                # 제품명을 링크의 텍스트에서 추출
                                link_text = await selected_link.inner_text()
                                if link_text and len(link_text.strip()) > 2:
                                    extracted_name = link_text.strip()
                                else:
                                    # 링크 내부 요소에서 텍스트 찾기
                                    name_elems = await selected_link.query_selector_all('span, div')
                                    for elem in name_elems:
                                        text = await elem.inner_text()
                                        if text and len(text.strip()) > 2:
                                            extracted_name = text.strip()
                                            break
                                
                                # 이미지도 링크 요소에서 추출
                                img_elem = await selected_link.query_selector('img')
                                if img_elem:
                                    src = (await img_elem.get_attribute('src') or 
                                           await img_elem.get_attribute('data-src') or
                                           await img_elem.get_attribute('data-lazy-src'))
                                    if src and not src.startswith('data:'):
                                        image_url = f"https://www.hwahae.co.kr{src}" if src.startswith('/') else src
                                
                                # 검색 결과 페이지에서 가격 미리 추출 시도
                                try:
                                    price_in_search = await selected_link.query_selector('[class*="price"], [class*="cost"], span:has-text("원"), div:has-text("₩")')
                                    if price_in_search:
                                        price_text = await price_in_search.inner_text()
                                        if price_text and any(char.isdigit() for char in price_text):
                                            import re
                                            numbers = re.findall(r'\d+', price_text.replace(',', ''))
                                            if numbers:
                                                price_num = ''.join(numbers)
                                                if len(price_num) >= 3:
                                                    price = f"₩{int(price_num):,}"
                                                    logger.info(f"💰 검색 페이지에서 가격 추출: {price}")
                                except Exception:
                                    pass
                        
                        logger.info(f"최종 URL: {product_url}")
                        logger.info(f"최종 이미지: {image_url}")
                        
                        # 기본 가격 설정
                        price = "₩가격 문의"
                        
                        # 가격 정보 추출 (제품 페이지에서)
                        if product_url:
                            try:
                                await page.goto(product_url, wait_until='domcontentloaded', timeout=10000)
                                await page.wait_for_timeout(1000)
                                
                                # 가격 추출 시도 (다양한 셀렉터 사용)
                                price_selectors = [
                                    '[class*="price"]',
                                    '[class*="cost"]', 
                                    '[class*="amount"]',
                                    '[class*="won"]',
                                    'span:has-text("원")',
                                    'div:has-text("원")',
                                    '[data-testid*="price"]',
                                    '.price',
                                    '.cost',
                                    '*:has-text("₩")'
                                ]
                                
                                for selector in price_selectors:
                                    try:
                                        price_elem = await page.query_selector(selector)
                                        if price_elem:
                                            price_text = await price_elem.inner_text()
                                            if price_text and any(char.isdigit() for char in price_text):
                                                # 숫자만 추출해서 가격 형식으로 변환
                                                import re
                                                numbers = re.findall(r'\d+', price_text.replace(',', ''))
                                                if numbers:
                                                    price_num = ''.join(numbers)
                                                    if len(price_num) >= 3:  # 최소 3자리 이상
                                                        price = f"₩{int(price_num):,}"
                                                        logger.info(f"💰 가격 추출 성공: {price} (셀렉터: {selector})")
                                                        break
                                    except Exception:
                                        continue
                                
                                # 제품명 다시 확인 (상세 페이지에서 더 정확)
                                title_elem = await page.query_selector('h1, [class*="title"], [class*="name"]')
                                if title_elem:
                                    page_title = await title_elem.inner_text()
                                    if page_title:
                                        extracted_name = page_title
                            except Exception as e:
                                logger.warning(f"제품 페이지 접근 실패: {e}")
                        
                        # 제품명에서 별점과 댓글수 제거
                        cleaned_name = self._clean_product_name(extracted_name)
                        
                        logger.info(f"✅ 제품 발견: {cleaned_name}")
                        
                        return {
                            "product_name": cleaned_name.strip(),
                            "brand": brand or cleaned_name.split()[0],
                            "price": price,
                            "url": product_url,
                            "image_url": image_url or "https://via.placeholder.com/200x200/f0f0f0/999999?text=Product",
                            "short_summary": f"{brand or '브랜드'} {cleaned_name} 제품입니다."
                        }
                    
                    else:
                        logger.warning(f"'{search_query}' 검색 결과 없음")
                        return None
                        
                except Exception as e:
                    logger.error(f"Playwright 검색 오류: {e}")
                    return None
                finally:
                    await browser.close()
                    
        except Exception as e:
            logger.error(f"제품 검색 오류: {e}")
            return None
    
    def _clean_product_name(self, product_name: str) -> str:
        """제품명에서 별점, 댓글수, 기타 불필요한 정보 제거"""
        import re
        
        if not product_name:
            return product_name
        
        logger.info(f"🧹 정리 전 제품명: {product_name}")
        
        # 숫자로 시작하는 경우 제거 (예: "3 토리든다이브인..." -> "토리든다이브인...")
        product_name = re.sub(r'^\d+\s*', '', product_name)
        
        # 별점 패턴 제거 (예: "4.66", "4.5점", "★4.5" 등)
        product_name = re.sub(r'\d+\.\d+점?', '', product_name)
        product_name = re.sub(r'★+\d+\.\d+', '', product_name)
        product_name = re.sub(r'☆+\d+\.\d+', '', product_name)
        
        # 댓글수/리뷰수 패턴 제거 (예: "19,924", "20,333", "(1,234개)", "리뷰 123" 등)
        product_name = re.sub(r'\d{1,3}(,\d{3})+', '', product_name)
        product_name = re.sub(r'\d{4,}', '', product_name)  # 4자리 이상 숫자 제거 (댓글수)
        product_name = re.sub(r'\(\d+개?\)', '', product_name)
        product_name = re.sub(r'리뷰\s*\d+', '', product_name)
        product_name = re.sub(r'후기\s*\d+', '', product_name)
        
        # 끝에 오는 별점과 숫자들 제거 (예: "크림 4 58" -> "크림")
        product_name = re.sub(r'\s+\d+\s*$', '', product_name)  # 끝의 숫자
        product_name = re.sub(r'\s+\d+\s+\d+\s*$', '', product_name)  # 끝의 두 숫자
        product_name = re.sub(r'\s+\d+\.\d+\s*$', '', product_name)  # 끝의 소수점 숫자
        
        # "제품입니다" 같은 불필요한 문구 제거
        product_name = re.sub(r'\s+제품입니다\.?$', '', product_name)
        
        # 기타 불필요한 문자 제거
        product_name = re.sub(r'\s+', ' ', product_name)  # 여러 공백을 하나로
        product_name = product_name.strip()
        
        logger.info(f"🧹 정리 후 제품명: {product_name}")
        
        return product_name

    async def _search_in_database(self, product_name: str, brand: str = None) -> Optional[Dict[str, Any]]:
        """내장 데이터베이스 완전 제거 - 항상 None 반환"""
        return None
    
    async def _extract_product_info(self, element, search_query: str) -> Dict[str, Any]:
        """HTML 요소에서 제품 정보 추출"""
        try:
            logger.info(f"요소 추출 시작: {element.name if hasattr(element, 'name') else 'Unknown'}")
            
            # 제품 링크 추출 (화해 제품 페이지만)
            link_elem = element if element.name == 'a' else element.find('a')
            product_url = ""
            if link_elem and link_elem.get('href'):
                href = link_elem.get('href')
                if '/goods/' in href or '/products/' in href:
                    product_url = urljoin(self.base_url, href)
                    logger.info(f"🔗 화해 제품 링크 발견: {product_url}")
                else:
                    logger.warning(f"화해 제품이 아닌 링크: {href}")
            
            # 제품명 추출 (다양한 방법 시도)
            name_elem = (element.find(['h3', 'h4', 'span', 'div'], class_=re.compile(r'name|title|product', re.I)) or
                        element.find(string=re.compile(search_query, re.I)))
            
            if isinstance(name_elem, str):
                product_name = name_elem.strip()
            elif name_elem:
                product_name = name_elem.get_text(strip=True)
            else:
                product_name = search_query
            
            logger.info(f"📝 제품명: {product_name}")
            
            # 브랜드 추출
            brand_elem = element.find(['span', 'div'], class_=re.compile(r'brand|company', re.I))
            brand = brand_elem.get_text(strip=True) if brand_elem else search_query.split()[0]
            
            # 가격 추출
            price_elem = element.find(['span', 'div'], class_=re.compile(r'price|cost|won', re.I))
            price = "₩25,000"  # 기본값
            if price_elem:
                price_text = price_elem.get_text(strip=True)
                if price_text and any(char.isdigit() for char in price_text):
                    price = price_text if price_text.startswith('₩') else f"₩{price_text}"
            
            # 이미지 추출 (다양한 속성 시도)
            img_elem = element.find('img')
            image_url = "https://via.placeholder.com/200x200/f0f0f0/999999?text=Product"  # 기본값
            if img_elem:
                # 여러 이미지 속성 시도
                src = (img_elem.get('src') or 
                       img_elem.get('data-src') or 
                       img_elem.get('data-lazy-src') or
                       img_elem.get('data-original') or
                       img_elem.get('data-srcset'))
                
                if src and 'placeholder' not in src.lower():
                    # 상대 경로면 절대 경로로 변환
                    if src.startswith('/'):
                        image_url = urljoin(self.base_url, src)
                    elif src.startswith('http'):
                        image_url = src
                    else:
                        image_url = urljoin(self.base_url, '/' + src)
                    
                    logger.info(f"📷 이미지 URL 추출: {image_url}")
            
            # 화해 제품 페이지가 있다면 상세 정보 수집 시도
            if product_url and ('/goods/' in product_url or '/products/' in product_url):
                logger.info(f"상세 페이지 정보 수집 시도: {product_url}")
                additional_info = await self._get_product_details(product_url)
                if additional_info and len(additional_info) > 3:
                    return additional_info
            
            return {
                "product_name": product_name,
                "brand": brand,
                "price": price,
                "url": product_url or f"{self.base_url}/search?q={quote(search_query)}",
                "image_url": image_url or "https://via.placeholder.com/200x200/f0f0f0/999999?text=Product",
                "short_summary": f"{brand}의 {product_name}으로 화해에서 인기 있는 제품입니다."
            }
            
        except Exception as e:
            logger.error(f"제품 정보 추출 오류: {e}")
            return {
                "product_name": search_query,
                "brand": "브랜드명",
                "price": "₩25,000",
                "url": f"{self.base_url}/search?q={quote(search_query)}",
                "image_url": "https://via.placeholder.com/200x200/f0f0f0/999999?text=Product",
                "short_summary": f"{search_query} 관련 제품입니다."
            }
    
    async def _get_product_details(self, product_url: str) -> Optional[Dict[str, Any]]:
        """제품 상세 페이지에서 정확한 정보 수집"""
        try:
            async with self.session.get(product_url) as response:
                if response.status != 200:
                    return None
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # 상세 페이지에서 정보 추출
                product_info = {}
                
                # 제품명
                title_elem = soup.find(['h1', 'h2'], class_=re.compile(r'title|name|product'))
                if title_elem:
                    product_info['product_name'] = title_elem.get_text(strip=True)
                
                # 브랜드
                brand_elem = soup.find(['span', 'div', 'a'], class_=re.compile(r'brand|company'))
                if brand_elem:
                    product_info['brand'] = brand_elem.get_text(strip=True)
                
                # 가격
                price_elem = soup.find(['span', 'div'], class_=re.compile(r'price|cost'))
                if price_elem:
                    price_text = price_elem.get_text(strip=True)
                    product_info['price'] = price_text if price_text.startswith('₩') else f"₩{price_text}"
                
                # 메인 이미지
                img_elem = soup.find('img', class_=re.compile(r'main|product|detail'))
                if img_elem:
                    src = img_elem.get('src') or img_elem.get('data-src')
                    if src:
                        product_info['image_url'] = urljoin(self.base_url, src) if src.startswith('/') else src
                
                # 제품 설명
                desc_elem = soup.find(['div', 'p'], class_=re.compile(r'desc|summary|info'))
                if desc_elem:
                    product_info['short_summary'] = desc_elem.get_text(strip=True)[:100] + "..."
                
                product_info['url'] = product_url
                
                return product_info if len(product_info) > 2 else None
                
        except Exception as e:
            logger.error(f"상세 페이지 수집 오류: {e}")
            return None

    async def search_products_by_category(self, skin_type: str, skin_concerns: List[str], limit: int = 3) -> List[Dict[str, Any]]:
        """피부 타입과 고민에 따른 제품 검색"""
        try:
            # 카테고리별 제품 매핑
            category_mapping = {
                "dry": ["moisturizer", "cream", "serum"],
                "oily": ["cleanser", "toner", "serum"], 
                "sensitive": ["gentle", "calm", "sensitive"],
                "acne": ["acne", "pore", "bha"],
                "aging": ["anti-aging", "wrinkle", "firming"],
                "pigmentation": ["whitening", "vitamin-c", "spot"]
            }
            
            products = []
            
            # 미리 정의된 화해 인기 제품 데이터베이스
            hwahae_products = await self._get_popular_products_database()
            
            # 피부 타입에 맞는 제품 필터링
            for product in hwahae_products:
                if self._matches_skin_needs(product, skin_type, skin_concerns):
                    products.append(product)
                    if len(products) >= limit:
                        break
            
            # 추가 검색이 필요한 경우 웹 크롤링 시도
            if len(products) < limit:
                additional_products = await self._crawl_category_products(skin_type, skin_concerns, limit - len(products))
                products.extend(additional_products)
            
            return products[:limit]
            
        except Exception as e:
            logger.error(f"화해 제품 검색 실패: {e}")
            return await self._get_fallback_products()
    
    async def _get_popular_products_database(self) -> List[Dict[str, Any]]:
        """화해 인기 제품 데이터베이스 (비어있음 - 하드코딩 제거)"""
        return []
    
    def _matches_skin_needs(self, product: Dict, skin_type: str, skin_concerns: List[str]) -> bool:
        """제품이 피부 니즈에 맞는지 확인"""
        # 피부 타입 매칭
        if skin_type.lower() not in [t.lower() for t in product.get("skin_types", [])] and "all" not in product.get("skin_types", []):
            return False
        
        # 피부 고민 매칭
        product_categories = [cat.lower() for cat in product.get("categories", [])]
        concern_keywords = {
            "acne": ["acne", "pore", "bha", "salicylic"],
            "dryness": ["hydrating", "moisturizer", "hyaluronic", "oil"],
            "sensitivity": ["sensitive", "gentle", "soothing", "calm"],
            "aging": ["anti-aging", "wrinkle", "firming", "peptide"],
            "pigmentation": ["whitening", "vitamin-c", "brightening", "spot"]
        }
        
        for concern in skin_concerns:
            if concern.lower() in concern_keywords:
                keywords = concern_keywords[concern.lower()]
                if any(keyword in product_categories for keyword in keywords):
                    return True
        
        return len(skin_concerns) == 0  # 특별한 고민이 없으면 모든 제품 가능
    
    async def _crawl_category_products(self, skin_type: str, skin_concerns: List[str], limit: int) -> List[Dict[str, Any]]:
        """실제 화해 웹사이트에서 제품 크롤링 (제한적)"""
        try:
            # 화해의 인기 제품 페이지 크롤링 시도
            url = f"{self.base_url}/ranking"
            
            if not self.session:
                return []
                
            async with self.session.get(url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    products = []
                    # 제품 요소 추출 (실제 화해 HTML 구조에 맞게 조정 필요)
                    product_elements = soup.find_all('div', class_='product-item')[:limit]
                    
                    for element in product_elements:
                        try:
                            product = {
                                "product_name": self._extract_text(element, '.product-name'),
                                "brand": self._extract_text(element, '.brand-name'),
                                "price": self._extract_text(element, '.price'),
                                "url": self._extract_link(element, 'a'),
                                "image_url": self._extract_image(element, 'img'),
                                "short_summary": "화해에서 인기 있는 제품입니다.",
                                "categories": ["popular"],
                                "skin_types": ["all"],
                                "rating": 4.0,
                                "review_count": 1000
                            }
                            products.append(product)
                        except Exception as e:
                            logger.warning(f"제품 정보 추출 실패: {e}")
                            continue
                    
                    return products
                    
        except Exception as e:
            logger.error(f"화해 크롤링 실패: {e}")
            
        return []
    
    def _extract_text(self, element, selector: str) -> str:
        """HTML 요소에서 텍스트 추출"""
        try:
            found = element.select_one(selector)
            return found.get_text(strip=True) if found else ""
        except:
            return ""
    
    def _extract_link(self, element, selector: str) -> str:
        """HTML 요소에서 링크 추출"""
        try:
            found = element.select_one(selector)
            if found and found.get('href'):
                return urljoin(self.base_url, found.get('href'))
            return f"{self.base_url}/goods/product/default"
        except:
            return f"{self.base_url}/goods/product/default"
    
    def _extract_image(self, element, selector: str) -> str:
        """HTML 요소에서 이미지 URL 추출"""
        try:
            found = element.select_one(selector)
            if found and found.get('src'):
                return found.get('src')
            return "https://via.placeholder.com/200x200/f0f0f0/999999?text=Product"
        except:
            return "https://via.placeholder.com/200x200/f0f0f0/999999?text=Product"
    
    async def _get_fallback_products(self) -> List[Dict[str, Any]]:
        """크롤링 실패 시 빈 리스트 반환 - 하드코딩 완전 제거"""
        return []


# OpenAI 추천 제품을 화해에서 검색하는 새로운 함수
async def search_openai_products_on_hwahae(openai_products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """OpenAI가 추천한 제품들을 화해에서 실제 검색해서 실제 정보 수집"""
    
    if not openai_products:
        logger.warning("OpenAI 제품 추천이 없음")
        return []
    
    real_products = []
    
    async with HwahaeProductScraper() as scraper:
        for i, ai_product in enumerate(openai_products):
            try:
                product_name = ai_product.get('product_name', '')
                brand = ai_product.get('brand', '')
                
                if not product_name:
                    logger.warning(f"제품 {i+1}: 제품명이 없음")
                    continue
                
                logger.info(f"🔍 제품 {i+1} 화해 검색: {brand} {product_name}")
                
                # 화해에서 실제 제품 검색
                real_product = await scraper.search_product_by_name(product_name, brand)
                
                if real_product:
                    # 이미지 URL이 화해 사이트인 경우 프록시 처리
                    image_url = real_product.get('image_url', 'https://via.placeholder.com/200x200/f0f0f0/999999?text=Product')
                    if 'hwahae.co.kr' in image_url or 'img.hwahae.co.kr' in image_url:
                        # 프록시를 통해 이미지 제공
                        image_url = f"http://localhost:8000/proxy-image?url={quote(image_url)}"
                    
                    # OpenAI의 추천 이유와 화해의 실제 정보 결합
                    combined_product = {
                        "reason": ai_product.get('reason', f"{product_name} 제품을 추천합니다."),
                        "product_name": real_product.get('product_name', product_name),
                        "brand": real_product.get('brand', brand),
                        "price": real_product.get('price', ai_product.get('price', '₩25,000')),
                        "url": real_product.get('url', f"https://www.hwahae.co.kr/search?q={quote(product_name)}"),
                        "image_url": image_url,
                        "short_summary": real_product.get('short_summary', ai_product.get('short_summary', f'{brand} {product_name} 제품입니다.'))
                    }
                    real_products.append(combined_product)
                    logger.info(f"✅ 제품 {i+1} 검색 성공: {real_product.get('product_name')}")
                else:
                    # 검색 실패 시 건너뛰기 (하드코딩 제거)
                    logger.warning(f"❌ 제품 {i+1} 검색 실패: {product_name} - 건너뛰기")
                
                # 과도한 요청 방지를 위한 딜레이 (단축)
                await asyncio.sleep(0.5)
                
            except Exception as e:
                logger.error(f"제품 {i+1} 처리 오류: {e}")
                continue
    
    logger.info(f"🎯 총 {len(real_products)}/{len(openai_products)}개 제품 처리 완료")
    return real_products

# OpenAI를 사용한 피부 분석 기반 제품 추천 (기존 함수 유지)
async def get_hwahae_recommendations(skin_analysis: Dict[str, Any]) -> Dict[str, Any]:
    """피부 분석 결과를 바탕으로 화해 제품 추천"""
    
    try:
        # 피부 분석에서 주요 정보 추출
        skin_conditions = skin_analysis.get("skin_conditions", {})
        skin_type = "normal"  # 기본값
        concerns = []
        
        # 피부 타입 추정
        if skin_conditions.get("dryness", {}).get("probability", 0) > 0.5:
            skin_type = "dry"
            concerns.append("dryness")
        elif skin_conditions.get("oiliness", {}).get("probability", 0) > 0.5:
            skin_type = "oily"
        
        # 피부 고민 추출
        for condition, data in skin_conditions.items():
            if data.get("probability", 0) > 0.4:
                concerns.append(condition)
        
        # 화해 제품 검색
        async with HwahaeProductScraper() as scraper:
            products = await scraper.search_products_by_category(skin_type, concerns, limit=3)
        
        # 프롬프트에 맞는 형태로 변환
        recommendations = []
        for product in products:
            recommendation = {
                "reason": f"분석 결과 {skin_type} 피부 타입에 {', '.join(concerns)} 고민이 있어서 이 제품이 적합해.",
                "product_name": product["product_name"],
                "brand": product["brand"],
                "price": product["price"],
                "url": product["url"],
                "image_url": product["image_url"],
                "short_summary": product["short_summary"]
            }
            recommendations.append(recommendation)
        
        # 전체 응답 구성
        return {
            "expert_diagnosis": "피부 분석을 통해 맞춤형 제품을 찾았어!",
            "predicted_skin_age": "분석 결과를 바탕으로 계산된 피부나이야",
            "predicted_skin_sensitivity": "현재 피부 민감도 상태야",
            "skin_tone_palette": ["분석된 피부 톤 정보"],
            "detailed_analysis": {
                "skin_condition": f"현재 {skin_type} 타입의 피부로 보이고, {', '.join(concerns) if concerns else '특별한 문제는 없어'} 상태야.",
                "key_points": "분석된 주요 포인트들이야.",
                "improvement_direction": "이런 방향으로 관리하면 좋을 것 같아."
            },
            "purchase_considerations": [
                {
                    "reason": "분석 결과를 바탕으로 한 구매 고려사항이야.",
                    "recommendation": "이런 점을 참고해서 제품을 선택해봐."
                }
            ],
            "product_recommendations": recommendations
        }
        
    except Exception as e:
        logger.error(f"화해 추천 생성 실패: {e}")
        # 기본 제품 반환
        async with HwahaeProductScraper() as scraper:
            fallback_products = await scraper._get_fallback_products()
            
        return {
            "expert_diagnosis": "피부가 전반적으로 건강한 상태야!",
            "predicted_skin_age": "실제 나이와 비슷해 보여",
            "predicted_skin_sensitivity": "보통 수준의 민감도야",
            "skin_tone_palette": ["자연스러운 피부 톤이야"],
            "detailed_analysis": {
                "skin_condition": "전반적으로 양호한 피부 상태를 보이고 있어.",
                "key_points": "꾸준한 관리만 하면 돼.",
                "improvement_direction": "기본적인 스킨케어 루틴을 유지해봐."
            },
            "purchase_considerations": [
                {
                    "reason": "기본적인 관리 제품이 필요해.",
                    "recommendation": "순하고 검증된 제품을 선택해봐."
                }
            ],
            "product_recommendations": [
                {
                    "reason": "검증된 인기 제품으로 모든 피부타입에 적합해.",
                    "product_name": product["product_name"],
                    "brand": product["brand"],
                    "price": product["price"],
                    "url": product["url"],
                    "image_url": product["image_url"],
                    "short_summary": product["short_summary"]
                } for product in fallback_products
            ]
        }