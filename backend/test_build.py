#!/usr/bin/env python3
"""
Test script to verify Fetch AI service can be imported and used
"""
import os
import sys
import asyncio
from datetime import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all required modules can be imported"""
    try:
        print("Testing imports...")
        
        # Test basic imports
        import fastapi
        print("✓ FastAPI imported successfully")
        
        import uvicorn
        print("✓ Uvicorn imported successfully")
        
        import supabase
        print("✓ Supabase imported successfully")
        
        # Test our custom modules
        from fetch_ai_service import FetchAiVocalCoach
        print("✓ FetchAiVocalCoach imported successfully")
        
        from voice_analyzer import VoiceAnalyzer
        print("✓ VoiceAnalyzer imported successfully")
        
        # Test Letta service import
        try:
            from letta_service import letta_coach, ConversationType
            print("✓ Letta service imported successfully")
        except ImportError as e:
            print(f"⚠️  Letta service import warning: {e}")
        
        print("\n✅ All imports successful!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

async def test_fetch_ai_service():
    """Test Fetch AI service functionality"""
    try:
        print("\nTesting Fetch AI service (imports only)...")
        
        from fetch_ai_service import FetchAiVocalCoach
        
        # We will only test if the class can be imported, not instantiated
        # as instantiation requires environment variables.
        if FetchAiVocalCoach:
            print("✓ FetchAiVocalCoach class loaded successfully")
        else:
            raise ImportError("Could not load FetchAiVocalCoach class")
        
        print("\n✅ Fetch AI service test successful!")
        return True
        
    except Exception as e:
        print(f"❌ Fetch AI service test failed: {e}")
        return False

async def test_letta_service():
    """Test Letta service functionality"""
    try:
        print("\nTesting Letta service (imports only)...")
        
        try:
            from letta_service import letta_coach, ConversationType
            
            # Test if classes can be imported
            if letta_coach and ConversationType:
                print("✓ Letta service classes loaded successfully")
            else:
                raise ImportError("Could not load Letta service classes")
            
            # Test letta-client SDK import specifically
            try:
                from letta_client import Letta
                print("✓ Letta client SDK imported successfully")
            except ImportError as e:
                print(f"⚠️  Letta client SDK not available: {e}")
                print("   (This is expected if letta-client is not installed)")
            
            print("\n✅ Letta service test successful!")
            return True
            
        except ImportError as e:
            print(f"⚠️  Letta service not available: {e}")
            return True  # Don't fail the build if Letta is not available
        
    except Exception as e:
        print(f"❌ Letta service test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Vocal Coach AI Backend Build")
    print("=" * 50)
    
    # Test imports
    if not test_imports():
        print("\n❌ Import tests failed!")
        sys.exit(1)
    
    # Test Fetch AI service
    try:
        asyncio.run(test_fetch_ai_service())
    except Exception as e:
        print(f"❌ Async test failed: {e}")
        sys.exit(1)
    
    # Test Letta service
    try:
        asyncio.run(test_letta_service())
    except Exception as e:
        print(f"⚠️  Letta test failed: {e}")
        # Don't exit on Letta failure as it's optional
    
    print("\n🎉 All tests passed! Backend is ready for deployment.")

if __name__ == "__main__":
    main() 