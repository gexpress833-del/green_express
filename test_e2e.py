#!/usr/bin/env python3
"""
Test E2E Script - Menu creation with image upload
"""
import requests
import json
import os
import sys
from pathlib import Path

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

API_BASE = "http://127.0.0.1:8000/api"
TEST_EMAIL = "cuisinier@test.com"
TEST_PASSWORD = "password"

def log(msg, color='white'):
    """Log with color"""
    colors = {
        'cyan': '\033[36m',
        'green': '\033[32m',
        'yellow': '\033[33m',
        'red': '\033[31m',
        'reset': '\033[0m'
    }
    print(f"{colors.get(color, '')}{msg}{colors['reset']}")

def test_login():
    """Test login endpoint"""
    log("\n[1] Testing login endpoint...", 'cyan')
    try:
        response = requests.post(
            f"{API_BASE}/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if 'token' in data:
                log(f"   ✓ Token received", 'green')
                return data['token']
            else:
                log(f"   ✗ No token in response: {data}", 'red')
                return None
        else:
            log(f"   ✗ Login failed: {response.status_code}", 'red')
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        log(f"   ✗ Error: {str(e)}", 'red')
        return None

def test_upload_config(token):
    """Test upload config endpoint"""
    log("\n[2] Testing upload config endpoint...", 'cyan')
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }
        response = requests.get(
            f"{API_BASE}/upload/config",
            headers=headers,
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if 'cloud_name' in data:
                log(f"   ✓ Config received - Cloud: {data['cloud_name']}", 'green')
                return True
            else:
                log(f"   ✗ No cloud_name in response", 'red')
                return False
        else:
            log(f"   ✗ Config fetch failed: {response.status_code}", 'red')
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        log(f"   ✗ Error: {str(e)}", 'red')
        return False

def test_upload_image(token):
    """Test image upload"""
    log("\n[3] Testing image upload...", 'cyan')
    try:
        # Create a test image
        test_img_path = Path(os.environ['TEMP']) / f"test_upload_{os.getpid()}.jpg"
        
        if HAS_PIL:
            # Create a real 10x10 pixel red JPEG with PIL
            img = Image.new('RGB', (10, 10), color='red')
            img.save(str(test_img_path), 'JPEG', quality=85)
            log(f"   - Created valid JPEG with PIL", 'yellow')
        else:
            # Fallback: use minimal valid JPEG hex (1x1 pixel)
            jpeg_hex = (
                "ffd8ffe000104a46494600010100000100010000ffdb004300080606070605"
                "080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e"
                "2720222c231c1c2837292c30313434341f27393d38323c2e333432ffc00011"
                "080001000101011100021101031101ffc4001f0000010501010101010100"
                "0000000000000102030405060708090a0bffc40039100002010303020403050"
                "5040400010277000102031104052131061241510761711322328108"
                "144291a1b1082342b1c11552d1f02433627282090a161718191a25262728"
                "292a3031323334353637383939ffc4001f110002010204040403040705050404"
                "00010203110405214306124151076171"
                "13223287114281a109212213341451f0156272d10862717281919a108291"
                "8a2b3b3c323428207122232425262728292a3031323334353637383939"
                "ffda000c03010002110311003f00f2ffd9"
            )
            jpeg_bytes = bytes.fromhex(jpeg_hex)
            test_img_path.write_bytes(jpeg_bytes)
            log(f"   - Created JPEG from hex fallback", 'yellow')
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Open file and send
        with open(test_img_path, 'rb') as f:
            files = {
                'image': ('test_upload.jpg', f, 'image/jpeg'),
                'public_id': (None, 'test_menu_image'),
                'folder': (None, 'menus')  # Use simple folder name, service maps it to green-express/menus
            }
            response = requests.post(
                f"{API_BASE}/upload-image",
                headers=headers,
                files=files,
                timeout=30
            )
        
        print(f"   Status: {response.status_code}")
        
        # Delete temp file after upload
        try:
            test_img_path.unlink()
        except:
            pass
        
        if response.status_code == 200:
            data = response.json()
            if 'url' in data:
                log(f"   ✓ Image uploaded - URL: {data['url'][:60]}...", 'green')
                return data['url']
            else:
                log(f"   ✗ No URL in response: {data}", 'red')
                return None
        else:
            log(f"   ✗ Upload failed: {response.status_code}", 'red')
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        log(f"   ✗ Error: {str(e)}", 'red')
        import traceback
        traceback.print_exc()
        return None

def test_create_menu(token, image_url):
    """Test menu creation"""
    log("\n[4] Testing menu creation...", 'cyan')
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        menu_data = {
            "title": f"Test Menu {os.getenv('USERNAME')}",
            "description": "Automatic test menu with image",
            "image": image_url,
            "price": 1500.00,
            "currency": "USD"
        }
        
        response = requests.post(
            f"{API_BASE}/menus",
            headers=headers,
            json=menu_data,
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response text: {response.text[:200]}")
        
        if response.status_code in [200, 201]:
            # Check if response is valid JSON
            if response.text:
                data = response.json()
                if 'id' in data:
                    log(f"   ✓ Menu created - ID: {data['id']}", 'green')
                    return data['id']
                else:
                    log(f"   ✓ Menu created (no ID in response)", 'green')
                    return True
            else:
                log(f"   ✓ Menu created (empty response)", 'green')
                return True
        else:
            log(f"   ✗ Menu creation failed: {response.status_code}", 'red')
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        log(f"   ✗ Error: {str(e)}", 'red')
        return None

def main():
    """Main test flow"""
    log("\n╔════════════════════════════════════════════════════════════╗", 'cyan')
    log("║ E2E Integration Test: Menu Creation with Image Upload     ║", 'cyan')
    log("╚════════════════════════════════════════════════════════════╝", 'cyan')
    
    # Step 1: Login
    token = test_login()
    if not token:
        log("\n✗ TEST FAILED: Could not obtain authentication token", 'red')
        sys.exit(1)
    
    # Step 2: Check config
    if not test_upload_config(token):
        log("\n✗ TEST FAILED: Could not fetch upload config", 'red')
        sys.exit(1)
    
    # Step 3: Upload image
    image_url = test_upload_image(token)
    if not image_url:
        log("\n✗ TEST FAILED: Could not upload image", 'red')
        sys.exit(1)
    
    # Step 4: Create menu
    menu_id = test_create_menu(token, image_url)
    if not menu_id:
        log("\n✗ TEST FAILED: Could not create menu", 'red')
        sys.exit(1)
    
    log("\n╔════════════════════════════════════════════════════════════╗", 'green')
    log("║✓ ALL TESTS PASSED - Integration successful!              ║", 'green')
    log("╚════════════════════════════════════════════════════════════╝", 'green')

if __name__ == "__main__":
    main()
