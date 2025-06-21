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

@app.post("/analyze-voice")
async def analyze_voice(
    audio: UploadFile = File(...),
    mean_pitch: Optional[float] = Form(None),
    user_id: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None)
):
    """
    Analyze voice recording and return vocal metrics
    
    Args:
        audio: Audio file (WAV, MP3, etc.)
        mean_pitch: Optional mean pitch from frontend analysis
        user_id: Optional user ID for tracking
        session_id: Optional session ID for tracking
        
    Returns:
        JSON with vocal analysis results
    """
    try:
        logger.info(f"Received voice analysis request: {audio.filename}")
        if user_id:
            logger.info(f"User ID: {user_id}")
        if session_id:
            logger.info(f"Session ID: {session_id}")
        
        # Validate file type
        if not audio.filename.lower().endswith(('.wav', '.mp3', '.m4a', '.webm')):
            raise HTTPException(status_code=400, detail="Unsupported audio format")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{audio.filename.split('.')[-1]}") as temp_file:
            # Write uploaded file to temporary location
            content = await audio.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Analyze the audio file
            logger.info(f"Starting analysis of {temp_file_path}")
            analysis_results = await voice_analyzer.analyze_audio_file(temp_file_path, mean_pitch)
            
            # Log the results
            logger.info(f"Analysis completed successfully: {analysis_results}")
            
            # Save to database if user_id is provided
            if user_id and supabase:
                try:
                    session_data = {
                        'id': session_id or f"session_{int(datetime.now().timestamp())}",
                        'user_id': user_id,
                        'created_at': datetime.now().isoformat(),
                        'username': 'User',  # Default username
                        'voice_recorded': True,
                        'voice_type': analysis_results.get('voice_type'),
                        'lowest_note': analysis_results.get('lowest_note'),
                        'highest_note': analysis_results.get('highest_note'),
                        'mean_pitch': analysis_results.get('mean_pitch'),
                        'vibrato_rate': analysis_results.get('vibrato_rate'),
                        'jitter': analysis_results.get('jitter'),
                        'shimmer': analysis_results.get('shimmer'),
                        'dynamics': analysis_results.get('dynamics'),
                    }
                    
                    # Insert into vocal_analysis_history
                    result = supabase.table('vocal_analysis_history').insert(session_data).execute()
                    logger.info(f"Session saved to database: {session_data['id']}")
                    
                except Exception as db_error:
                    logger.error(f"Failed to save session to database: {str(db_error)}")
                    # Don't fail the request if database save fails
            
            # Return in format expected by frontend
            return JSONResponse(content={
                "success": True,
                "message": "Voice analysis completed successfully",
                "data": analysis_results,
                "file_name": audio.filename,
                "file_size": len(content),
                "file_type": audio.content_type,
                "user_id": user_id,
                "session_id": session_id
            })
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                logger.info(f"Cleaned up temporary file: {temp_file_path}")
    
    except Exception as e:
        logger.error(f"Error in voice analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
