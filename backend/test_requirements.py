#!/usr/bin/env python3
"""
Test script to verify requirements installation
"""
import sys
import subprocess
import os

def test_requirements():
    """Test if requirements can be installed"""
    print("Testing requirements installation...")
    
    try:
        # Try to install requirements
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ], capture_output=True, text=True, cwd=os.path.dirname(__file__))
        
        if result.returncode == 0:
            print("✅ Requirements installed successfully!")
            return True
        else:
            print("❌ Requirements installation failed:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Error testing requirements: {str(e)}")
        return False

def test_imports():
    """Test if key modules can be imported"""
    print("\nTesting key module imports...")
    
    modules_to_test = [
        "fastapi",
        "uvicorn",
        "supabase",
        "numpy",
        "scipy",
        "librosa",
        "requests",
        "python-dotenv"
    ]
    
    failed_imports = []
    
    for module in modules_to_test:
        try:
            __import__(module.replace("-", "_"))
            print(f"✅ {module}")
        except ImportError as e:
            print(f"❌ {module}: {str(e)}")
            failed_imports.append(module)
    
    # Test uAgents separately
    try:
        import uagents
        print("✅ uagents")
    except ImportError as e:
        print(f"⚠️  uagents: {str(e)} (optional)")
    
    if failed_imports:
        print(f"\n❌ Failed imports: {failed_imports}")
        return False
    else:
        print("\n✅ All required imports successful!")
        return True

if __name__ == "__main__":
    print("Vocal Coach AI - Requirements Test")
    print("=" * 40)
    
    req_success = test_requirements()
    import_success = test_imports()
    
    if req_success and import_success:
        print("\n🎉 All tests passed! Ready to run the application.")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed. Please check the errors above.")
        sys.exit(1) 