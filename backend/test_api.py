#!/usr/bin/env python3
"""
Simple test script for the Vocal Coach AI API
Run this to test the API endpoints locally
"""

import requests
import json
import time
import os
from pathlib import Path

# API base URL
BASE_URL = "http://localhost:8080"

def test_health_endpoint():
    """Test the health check endpoint"""
    print("🔍 Testing health endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Health endpoint working correctly!")
            return True
        else:
            print("❌ Health endpoint failed!")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API. Make sure the server is running on localhost:8080")
        return False
    except Exception as e:
        print(f"❌ Error testing health endpoint: {e}")
        return False

def test_root_endpoint():
    """Test the root endpoint"""
    print("\n🔍 Testing root endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Root endpoint working correctly!")
            return True
        else:
            print("❌ Root endpoint failed!")
            return False
            
    except Exception as e:
        print(f"❌ Error testing root endpoint: {e}")
        return False

def test_voice_analysis_endpoint():
    """Test the voice analysis endpoint with a dummy file"""
    print("\n🔍 Testing voice analysis endpoint...")
    
    # Create a dummy audio file for testing
    dummy_audio_path = "test_audio.webm"
    
    try:
        # Create a minimal WebM file (just headers)
        with open(dummy_audio_path, "wb") as f:
            # WebM file header (minimal)
            f.write(b'\x1a\x45\xdf\xa3')  # EBML header
            f.write(b'\x01\x00\x00\x00\x00\x00\x00\x00')  # Some dummy data
        
        print(f"Created dummy audio file: {dummy_audio_path}")
        
        # Test the endpoint
        with open(dummy_audio_path, "rb") as audio_file:
            files = {
                "audio": ("test_audio.webm", audio_file, "audio/webm")
            }
            data = {
                "user_id": "test_user_123",
                "session_id": "test_session_456",
                "mean_pitch": "300.0"
            }
            
            print("Sending request to /analyze-voice...")
            response = requests.post(
                f"{BASE_URL}/analyze-voice",
                files=files,
                data=data,
                timeout=30  # 30 second timeout for analysis
            )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Voice analysis endpoint working correctly!")
            print(f"Analysis Results:")
            print(f"  - Mean Pitch: {result['data']['mean_pitch']} Hz")
            print(f"  - Vibrato Rate: {result['data']['vibrato_rate']} Hz")
            print(f"  - Jitter: {result['data']['jitter']}")
            print(f"  - Shimmer: {result['data']['shimmer']}")
            print(f"  - Dynamics: {result['data']['dynamics']}")
            print(f"  - Voice Type: {result['data']['voice_type']}")
            print(f"  - Lowest Note: {result['data']['lowest_note']}")
            print(f"  - Highest Note: {result['data']['highest_note']}")
            return True
        else:
            print(f"❌ Voice analysis endpoint failed!")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API. Make sure the server is running on localhost:8080")
        return False
    except Exception as e:
        print(f"❌ Error testing voice analysis endpoint: {e}")
        return False
    finally:
        # Clean up dummy file
        if os.path.exists(dummy_audio_path):
            os.remove(dummy_audio_path)
            print(f"Cleaned up dummy file: {dummy_audio_path}")

def test_invalid_file():
    """Test the endpoint with an invalid file type"""
    print("\n🔍 Testing invalid file rejection...")
    
    try:
        # Create a text file (invalid)
        with open("test.txt", "w") as f:
            f.write("This is not an audio file")
        
        with open("test.txt", "rb") as text_file:
            files = {
                "audio": ("test.txt", text_file, "text/plain")
            }
            
            response = requests.post(
                f"{BASE_URL}/analyze-voice",
                files=files,
                timeout=10
            )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ Invalid file type correctly rejected!")
            return True
        else:
            print(f"❌ Expected 400 error, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing invalid file: {e}")
        return False
    finally:
        # Clean up
        if os.path.exists("test.txt"):
            os.remove("test.txt")

def main():
    """Run all tests"""
    print("🚀 Starting Vocal Coach AI API Tests")
    print("=" * 50)
    
    tests = [
        test_root_endpoint,
        test_voice_analysis_endpoint,
        test_invalid_file
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your API is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
    
    print("\n💡 Next steps:")
    print("1. Your frontend should work with this API endpoint")
    print("2. Deploy to Google Cloud Run using the provided configuration")
    print("3. Test with real audio recordings")

if __name__ == "__main__":
    main() 