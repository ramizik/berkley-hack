#!/usr/bin/env python3
"""
Test script to verify Groq SDK compatibility fix
"""

import os
import sys

def test_groq_import():
    """Test if Groq SDK can be imported and initialized"""
    try:
        from groq import Groq
        print("✓ Groq SDK imported successfully")
        
        # Test initialization (without API key for now)
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            try:
                client = Groq(api_key=api_key)
                print("✓ Groq client initialized successfully")
                return True
            except Exception as e:
                print(f"✗ Groq client initialization failed: {e}")
                return False
        else:
            print("⚠ GROQ_API_KEY not set, skipping client initialization test")
            return True
            
    except ImportError as e:
        print(f"✗ Failed to import Groq SDK: {e}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False

def test_dependencies():
    """Test if all required dependencies are available"""
    try:
        import httpx
        print(f"✓ httpx version: {httpx.__version__}")
        
        import requests
        print(f"✓ requests version: {requests.__version__}")
        
        return True
    except ImportError as e:
        print(f"✗ Missing dependency: {e}")
        return False

if __name__ == "__main__":
    print("Testing Groq SDK compatibility fix...")
    print("=" * 50)
    
    deps_ok = test_dependencies()
    groq_ok = test_groq_import()
    
    print("=" * 50)
    if deps_ok and groq_ok:
        print("✓ All tests passed! Groq SDK should work correctly.")
        sys.exit(0)
    else:
        print("✗ Some tests failed. Check the errors above.")
        sys.exit(1) 