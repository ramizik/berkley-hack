# Vocal Coach AI - FastAPI Backend

This directory contains the FastAPI backend services for the Vocal Coach AI application. The backend is responsible for audio analysis, autonomous report generation, and powering the conversational AI coach.

## 🚀 Core Services

The backend is composed of several key services working together:

1.  **Vocal Analysis (`voice_analyzer.py`)**: A service that accepts audio files and performs a deep analysis using libraries like `librosa` to extract key vocal metrics (pitch, jitter, shimmer, etc.).
2.  **Fetch.ai Agent (`fetch_ai_service.py`)**: An autonomous agent service that runs on a schedule. It analyzes a user's practice history, compares recent performance to past performance to identify trends, and generates a structured JSON report with insights and recommendations.
3.  **Letta Conversational Service (`letta_service.py`)**: Powers the stateful AI coach. It loads the context from the latest Fetch.ai report to have an intelligent, data-driven conversation with the user about their vocal progress.
4.  **Main API (`main.py`)**: The main entry point that exposes all public-facing endpoints and routes requests to the appropriate services. It also manages the in-memory context cache for stateful conversations.

## 📡 API Endpoints

-   `POST /api/vocal-reports`: Triggers on-demand analysis and report generation.
-   `GET /api/vocal-reports/{user_id}/{date}`: Retrieves a specific daily report.
-   `POST /api/letta/conversation/start`: Initializes a stateful conversation with context from a specific report.
-   `POST /api/letta/conversation/chat`: Handles the back-and-forth messaging for a conversation.
-   `GET /health`: Service health monitoring.

## 🛠️ Local Development

### 1. Setup Python Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Variables
Create a `.env` file in the `backend/` directory with the following (replace with your actual credentials):
```
SUPABASE_URL="your_supabase_url"
SUPABASE_KEY="your_supabase_service_role_key"
ASI_API_KEY="your_asi_api_key"
LETTA_API_KEY="your_letta_api_key"
```

### 3. Run Locally

```bash
# Run with uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
The API will be available at `http://localhost:8000`.

## 🧪 Testing

The project includes several test files (`test_*.py`) to validate the functionality of individual services and the overall API integration.

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

## 📚 Related Documentation

- **📖 [Complete Project Overview](../PROJECT_OVERVIEW.md)** - Full project architecture and data flow
- **🚀 [Deployment Guide](./DEPLOYMENT_FIX.md)** - Google Cloud Run deployment with fixes 