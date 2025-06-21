import os
import logging
import tempfile
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Path, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import asyncio
import requests

# Import our custom voice analyzer and Fetch AI service
from voice_analyzer import VoiceAnalyzer
from fetch_ai_service import FetchAiVocalCoach
from fetch_ai_agent import vocal_agent

# Supabase client for database access
from supabase import create_client, Client

# Import Letta service with error handling
try:
    from letta_service import letta_coach, ConversationType
    LETTA_AVAILABLE = True
    logging.info("Letta service imported successfully")
except ImportError as e:
    logging.warning(f"Letta service not available: {str(e)}")
    LETTA_AVAILABLE = False
    letta_coach = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Vocal Coach AI Backend", version="1.0.0")

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Optional[Client] = None

if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)
    logger.info("Supabase client initialized successfully")
else:
    logger.warning("Supabase credentials not found. Some features may not work.")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
voice_analyzer = VoiceAnalyzer()
fetch_ai_coach: Optional[FetchAiVocalCoach] = None

# In-memory cache for conversation contexts
# In a production environment, this should be replaced with a more robust solution like Redis
conversation_contexts: Dict[str, Any] = {}

# Background task to start Fetch AI agent
@app.on_event("startup")
async def startup_event():
    """Initialize services and start background tasks on startup"""
    global fetch_ai_coach
    fetch_ai_coach = FetchAiVocalCoach()
    logger.info("Fetch AI Vocal Coach service initialized.")
    
    try:
        # Start agent background task
        asyncio.create_task(vocal_agent.start_background_task())
        logger.info("Fetch AI agent started successfully")
    except Exception as e:
        logger.error(f"Failed to start Fetch AI agent: {str(e)}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Vocal Coach AI Backend is running!", "status": "healthy"}