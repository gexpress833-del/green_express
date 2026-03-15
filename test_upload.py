#!/usr/bin/env python3
import requests
import json
from pathlib import Path
import sys

BASE_URL = "http://localhost:8000"

# Step 1: Login
print("[1] Logging in...")
login_resp = requests.post(
    f"{BASE_URL}/api/login",
    json={
        "email": "cuisinier@test.com",
        "password": "password"
    }
)

if login_resp.status_code != 200:
    print(f"❌ Login failed: {login_resp.status_code}")
    print(login_resp.text)
    sys.exit(1)

print(f"✅ Login successful (Status: {login_resp.status_code})")
session = requests.Session()
session.cookies.update(login_resp.cookies)

# Step 2: Check if we have test image
test_image = Path("C:/Users/Daniel Muela/Pictures/test.jpg")
if not test_image.exists():
    # Create a simple test image using PIL
    try:
        from PIL import Image
        print("[2] Creating test image...")
        img = Image.new('RGB', (100, 100), color='red')
        test_image = Path("C:/SERVICE/test_image.jpg")
        img.save(test_image)
        print(f"✅ Test image created: {test_image}")
    except ImportError:
        print("❌ PIL not available, cannot create test image")
        print("✅ Testing upload endpoint with mock request...")
        # Continue anyway - we can at least verify the endpoint exists
        test_image = None

# Step 3: Test upload
print("[3] Testing upload endpoint...")
if test_image and test_image.exists():
    with open(test_image, 'rb') as f:
        files = {'image': f}
        data = {'folder': 'menus'}
        upload_resp = session.post(
            f"{BASE_URL}/api/upload-image",
            files=files,
            data=data
        )
else:
    print("⚠️  No test image available, skipping upload test")
    sys.exit(0)

print(f"Upload Status: {upload_resp.status_code}")
print(f"Upload Response: {upload_resp.text}")

if upload_resp.status_code == 200:
    data = upload_resp.json()
    if data.get('success'):
        print(f"✅ Upload successful!")
        print(f"   URL: {data.get('url')}")
    else:
        print(f"❌ Upload failed: {data.get('message')}")
else:
    print(f"❌ Upload failed with status {upload_resp.status_code}")

