# 🚀 Deployment Guide - Vocal Coach AI Backend

This guide will help you deploy your FastAPI backend to Google Cloud Run and connect it to your React frontend.

## 📋 Prerequisites

1. **Google Cloud Account**: Set up a Google Cloud Platform account
2. **Google Cloud SDK**: Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
3. **Docker**: Install [Docker](https://docs.docker.com/get-docker/) for local testing
4. **GitHub Repository**: Your code should be in a GitHub repository

## 🛠️ Local Development Setup

### 1. Test Backend Locally

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

### 2. Test API Endpoints

```bash
# Test health endpoint
curl http://localhost:8080/health

# Run the test script
python test_api.py
```

### 3. Test with Docker

```bash
# Build Docker image
docker build -t vocal-coach-ai-api .

# Run container
docker run -p 8080:8080 vocal-coach-ai-api

# Test in another terminal
curl http://localhost:8080/health
```

## 🚀 Quick Deployment to Google Cloud Run

### Prerequisites
- Google Cloud Project with billing enabled
- Google Cloud CLI installed and configured
- Docker installed locally (for testing)

### 1. Environment Variables Setup

You need to set these environment variables in Google Cloud Run:

#### Required Variables:
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Fetch AI Configuration
ASI_1_API_KEY=your_asi_1_api_key  # Get from https://asi1.ai/

# Letta Configuration
LETTA_API_KEY=your_letta_api_key  # Get from https://app.letta.com/api-keys
LETTA_AGENT_ID=your_letta_agent_id  # Get from https://app.letta.com

# Frontend Configuration (Set in Netlify)
VITE_FASTAPI_URL=https://your-cloud-run-service-url
```

#### How to Get API Keys:
1. **Fetch AI**: Visit [https://asi1.ai/](https://asi1.ai/), sign up, and create an API key
2. **Letta**: Visit [https://app.letta.com/api-keys](https://app.letta.com/api-keys), create an account, and generate an API key

### 2. Deploy to Google Cloud Run

#### Option A: Using Cloud Build (Recommended)
```bash
# Navigate to backend directory
cd backend

# Deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml
```

#### Option B: Manual Deployment
```bash
# Build and push Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/vocal-coach-ai-api .
docker push gcr.io/YOUR_PROJECT_ID/vocal-coach-ai-api

# Deploy to Cloud Run
gcloud run deploy vocal-coach-ai-api \
  --image gcr.io/YOUR_PROJECT_ID/vocal-coach-ai-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 300 \
  --concurrency 80 \
  --set-env-vars "SUPABASE_URL=your_url,SUPABASE_SERVICE_ROLE_KEY=your_key,ASI_1_API_KEY=your_key,LETTA_API_KEY=your_key,LETTA_AGENT_ID=your_agent_id"
```

### 3. Set Environment Variables in Cloud Run

After deployment, set the environment variables:

```bash
gcloud run services update vocal-coach-ai-api \
  --region us-central1 \
  --set-env-vars "SUPABASE_URL=your_url,SUPABASE_SERVICE_ROLE_KEY=your_key,ASI_1_API_KEY=your_key,LETTA_API_KEY=your_key,LETTA_AGENT_ID=your_agent_id"
```

### 4. Update Frontend Configuration

In your Netlify dashboard:
1. Go to Site Settings > Environment Variables
2. Add: `VITE_FASTAPI_URL=https://your-cloud-run-service-url`

## 🧪 Testing the Deployment

### 1. Health Check
```bash
curl https://your-service-url/
# Should return: {"message": "Vocal Coach AI Backend is running!", "status": "healthy"}
```

### 2. Test Fetch AI Agent Status
```bash
curl https://your-service-url/api/agent/status
# Should return agent status information
```

### 3. Test Voice Analysis
```bash
# Create a test audio file (you can record a short voice clip)
curl -X POST https://your-service-url/analyze-voice \
  -F "audio=@test_audio.wav" \
  -F "user_id=test_user" \
  -F "session_id=test_session"
```

### 4. Test Fetch AI Reports
```bash
curl https://your-service-url/api/vocal-reports/test_user/2024-01-15
# Should return a Fetch AI report (may be mock data if no real sessions)
```

## 🔧 Local Development Testing

### 1. Run Backend Locally
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

### 2. Test Fetch AI Integration
```bash
# Set environment variables
export SUPABASE_URL=your_url
export SUPABASE_SERVICE_ROLE_KEY=your_key
export ASI_1_API_KEY=your_key

# Run the application
python main.py
```

### 3. Test Letta Integration
```bash
# Set Letta environment variables
export LETTA_API_KEY=your_key
export LETTA_AGENT_ID=your_agent_id

# Test Letta service
python test_letta_integration.py
```

## 🎯 Hackathon Demo Testing

### 1. Pre-Demo Setup
1. **Deploy backend** to Google Cloud Run
2. **Set environment variables** (especially API keys)
3. **Update frontend** with correct `VITE_FASTAPI_URL`
4. **Test voice recording** and analysis
5. **Verify Fetch AI reports** are generating
6. **Test Letta conversations** work properly

### 2. Demo Flow Testing
1. **Record a practice session** (15 seconds)
2. **Wait 2 minutes** for Fetch AI agent to process
3. **Navigate to Progress page** to see AI-generated insights
4. **Start a conversation** with the Letta AI coach
5. **Verify context-aware responses** from the AI

### 3. Expected Demo Results
- ✅ Voice analysis completes successfully
- ✅ Practice session saved to database
- ✅ Fetch AI agent generates reports every 2 minutes
- ✅ Progress page shows real-time agent status
- ✅ AI insights and recommendations appear
- ✅ Letta conversations are context-aware
- ✅ 2-minute countdown timer works

## 🚨 Troubleshooting

### Common Issues:

#### 1. Fetch AI Agent Not Starting
```bash
# Check logs
gcloud logs read --service=vocal-coach-ai-api --limit=50

# Common causes:
# - Missing ASI_1_API_KEY
# - Network connectivity issues
# - Port conflicts
```

#### 2. Letta Integration Issues
```bash
# Check if Letta service is initialized
curl https://your-service-url/health

# Common causes:
# - Missing LETTA_API_KEY or LETTA_AGENT_ID
# - Invalid agent ID
# - Network connectivity issues
```

#### 3. Reports Not Generating
```bash
# Check if agent is running
curl https://your-service-url/api/agent/status

# Check database connectivity
# Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

#### 4. Frontend Can't Connect
```bash
# Verify VITE_FASTAPI_URL is correct
# Check CORS settings
# Test API endpoints directly
```

#### 5. Mock Data Mode
If API integrations fail, the system falls back to mock data:
- Reports will still generate
- Insights will be generic but functional
- Agent status will show "running"
- Perfect for demo if API key issues occur

## 📊 Monitoring

### Cloud Run Metrics
- CPU and Memory usage
- Request count and latency
- Error rates

### AI Service Monitoring
- Agent status endpoint: `/api/agent/status`
- Logs: `gcloud logs read --service=vocal-coach-ai-api`
- Database: Check `fetch_ai_reports` and `letta_conversations` tables

## 🎪 Demo Script

### 2-Minute Demo Flow:
1. **Introduction** (30 sec)
   - "This is Vocal Coach AI with dual AI integration"
   - "The system analyzes your voice and provides AI-powered insights"

2. **Practice Session** (45 sec)
   - Record a 15-second voice clip
   - Show real-time pitch detection
   - Demonstrate voice analysis

3. **AI Processing** (30 sec)
   - Show agent status: "Next update in 1:30"
   - Explain: "Fetch AI agent processes data every 2 minutes"
   - Point out agent address and status

4. **AI Coaching** (15 sec)
   - Navigate to Progress page
   - Show AI-generated insights and recommendations
   - Start a conversation with the Letta AI coach
   - Demonstrate context-aware responses

### Key Talking Points:
- "Fetch AI agent runs autonomously every 2 minutes"
- "AI-powered insights using Fetch AI's ASI-1 model"
- "Letta provides stateful, context-aware conversations"
- "Real-time vocal analysis with machine learning"
- "Personalized coaching recommendations"

## 🔐 Security Notes

- Keep API keys secure
- Use service role keys for Supabase (not anon keys)
- Monitor API usage and costs
- Set up proper CORS for production

## 📈 Scaling Considerations

- Cloud Run auto-scales based on demand
- Fetch AI agent runs in background
- Letta conversations are stateful and cached
- Database queries are optimized
- Caching reduces API calls

Your deployment is ready! The system will work with mock data even if API keys are missing, making it perfect for hackathon demos.

## 📞 Support

If you encounter issues:

1. Check the [Google Cloud Run documentation](https://cloud.google.com/run/docs)
2. Review the [FastAPI documentation](https://fastapi.tiangolo.com/)
3. Check the Cloud Build and Cloud Run logs
4. Verify your configuration files

---

**Happy Deploying! 🚀** 