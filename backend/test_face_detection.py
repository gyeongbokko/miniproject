#!/usr/bin/env python3
import requests
import base64
import json
from PIL import Image
import io
import numpy as np

# 테스트용 작은 이미지 생성
def create_test_image():
    # 간단한 테스트 이미지 생성
    img = Image.new('RGB', (100, 100), color='white')
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode('utf-8')

# 얼굴 감지 API 테스트
def test_face_detection():
    url = "http://localhost:8000/detect-faces"
    
    # 테스트 이미지 생성
    test_image = create_test_image()
    
    payload = {
        "image": f"data:image/jpeg;base64,{test_image}"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ 얼굴 감지 API 정상 작동")
        else:
            print("❌ 얼굴 감지 API 오류")
            
    except Exception as e:
        print(f"❌ 요청 오류: {e}")

if __name__ == "__main__":
    test_face_detection()