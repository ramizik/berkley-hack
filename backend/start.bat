@echo off
REM Vocal Coach AI Backend - Quick Start Script for Windows

echo 🚀 Starting Vocal Coach AI Backend...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH. Please install Python 3.11+ first.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
pip install -r requirements.txt

REM Check if port 8080 is available (Windows)
netstat -an | findstr :8080 >nul
if not errorlevel 1 (
    echo ⚠️  Port 8080 is already in use. Please stop the service using port 8080 first.
    pause
    exit /b 1
)

echo ✅ Starting FastAPI server on http://localhost:8080
echo 📖 API Documentation: http://localhost:8080/docs
echo 🔍 Health Check: http://localhost:8080/health
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
python main.py

pause 