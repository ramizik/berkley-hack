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

@app.get("/health")
async def health_check():
    """Health check endpoint for Live Coach integration"""
    return JSONResponse(content={
        "status": "healthy",
        "service": "vocal-coach-ai-backend",
        "endpoints": [
            "/analyze-voice",
            "/api/vocal-reports/{user_id}/{date}",
            "/api/agent/status"
        ],
        "timestamp": datetime.now().isoformat()
    })

@app.get("/api/vocal-reports/{user_id}/{date}")
async def get_vocal_report(
    user_id: str = Path(..., description="User ID"),
    date: str = Path(..., description="Date in YYYY-MM-DD format")
):
    """
    Get Fetch AI vocal analysis report for a specific user and date
    
    Args:
        user_id: User ID
        date: Date in YYYY-MM-DD format
        
    Returns:
        JSON with Fetch AI report data
    """
    try:
        logger.info(f"Fetching vocal report for user {user_id} on {date}")
        
        # Validate date format
        try:
            datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        # First try to get from fetch_ai_reports table
        if supabase:
            try:
                response = supabase.table('fetch_ai_reports').select('*').eq(
                    'user_id', user_id
                ).eq('date', date).execute()
                
                if response.data:
                    # Return cached report
                    report_data = response.data[0]['report_data']
                    logger.info(f"Retrieved cached report for user {user_id}")
                    return JSONResponse(content={
                        "success": True,
                        "message": "Vocal report retrieved from cache",
                        "data": report_data,
                        "source": "cache",
                        "agent_id": response.data[0].get('agent_id'),
                        "processing_status": response.data[0].get('processing_status')
                    })
            except Exception as e:
                logger.warning(f"Error accessing fetch_ai_reports table: {str(e)}")
        
        # If not in cache, generate new report
        logger.info(f"Generating on-demand report for user {user_id}")
        if not fetch_ai_coach:
            raise HTTPException(status_code=503, detail="AI Coach service is not available.")
        report = await fetch_ai_coach.generate_daily_report(user_id, date)
        
        # Convert dataclass to dict for JSON response
        report_dict = {
            "date": report.date,
            "id": report.id,
            "summary": report.summary,
            "metrics": {
                key: {
                    "current": metric.current,
                    "previous": metric.previous,
                    "change": metric.change,
                    "trend": metric.trend,
                    "improvement_percentage": metric.improvement_percentage
                }
                for key, metric in report.metrics.items()
            },
            "insights": report.insights,
            "recommendations": report.recommendations,
            "practice_sessions": report.practice_sessions,
            "total_practice_time": report.total_practice_time,
            "best_time_of_day": report.best_time_of_day
        }
        
        # Save the newly generated report to the cache
        if supabase:
            try:
                supabase.table('fetch_ai_reports').insert({
                    "user_id": user_id,
                    "date": date,
                    "report_data": report_dict,
                    "agent_id": vocal_agent.get_status().get("agent_address"),
                    "processing_status": "completed_on_demand"
                }).execute()
                logger.info(f"Saved on-demand report to cache for user {user_id} on {date}")
            except Exception as e:
                logger.error(f"Failed to save on-demand report to cache: {str(e)}")

        return JSONResponse(content={
            "success": True,
            "message": "Vocal report generated on-demand",
            "data": report_dict,
            "source": "generated"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating vocal report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@app.get("/api/vocal-reports/{user_id}/recent")
async def get_recent_reports(
    user_id: str = Path(..., description="User ID"),
    days: int = 7
):
    """
    Get recent vocal reports for a user
    
    Args:
        user_id: User ID
        days: Number of recent days to fetch (default: 7)
        
    Returns:
        JSON with recent reports
    """
    try:
        logger.info(f"Fetching recent reports for user {user_id} (last {days} days)")
        
        reports = []
        current_date = datetime.now()
        
        # Fetch reports for each day
        for i in range(days):
            date = (current_date - timedelta(days=i)).strftime("%Y-%m-%d")
            try:
                # Try to get from cache first
                if supabase:
                    response = supabase.table('fetch_ai_reports').select('*').eq(
                        'user_id', user_id
                    ).eq('date', date).execute()
                    
                    if response.data:
                        report_data = response.data[0]['report_data']
                        reports.append({
                            "date": date,
                            "data": report_data,
                            "source": "cache"
                        })
                        continue
                
                # Generate if not in cache
                report = await fetch_ai_coach.generate_daily_report(user_id, date)
                
                # Convert to dict
                report_dict = {
                    "date": report.date,
                    "id": report.id,
                    "summary": report.summary,
                    "metrics": {
                        key: {
                            "current": metric.current,
                            "previous": metric.previous,
                            "change": metric.change,
                            "trend": metric.trend
                        }
                        for key, metric in report.metrics.items()
                    },
                    "insights": report.insights,
                    "recommendations": report.recommendations
                }
                
                reports.append({
                    "date": date,
                    "data": report_dict,
                    "source": "generated"
                })
                
            except Exception as e:
                logger.warning(f"Failed to get report for {date}: {str(e)}")
                # Add empty report for missing dates
                reports.append({
                    "date": date,
                    "data": None,
                    "source": "error",
                    "error": str(e)
                })
        
        return JSONResponse(content={
            "success": True,
            "message": f"Retrieved {len(reports)} recent reports",
            "data": reports
        })
        
    except Exception as e:
        logger.error(f"Error fetching recent reports: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch recent reports: {str(e)}")


@app.get("/api/agent/status")
async def get_agent_status():
    """
    Get Fetch AI agent status
    
    Returns:
        JSON with agent status information
    """
    try:
        status = vocal_agent.get_status()
        return JSONResponse(content={
            "success": True,
            "message": "Fetch AI agent status",
            "data": status
        })
    except Exception as e:
        logger.error(f"Error getting agent status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get agent status: {str(e)}")

@app.post("/api/letta/conversation/start")
async def start_letta_conversation(
    user_id: str = Form(...),
    conversation_type: str = Form(...),
    date: Optional[str] = Form(None) # Add date parameter
):
    """
    Start a new Letta conversation session
    """
    if not LETTA_AVAILABLE:
        raise HTTPException(status_code=503, detail="Letta service is not available")
    
    try:
        logger.info(f"Starting Letta conversation for user {user_id}")
        
        # Validate conversation type
        try:
            conv_type = ConversationType(conversation_type)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid conversation type")
        
        # Start conversation
        context = await letta_coach.start_conversation(
            user_id=user_id,
            conversation_type=conv_type,
            date=date # Pass date to the service
        )

        # Cache the context
        conversation_contexts[context.conversation_id] = context
        
        return JSONResponse(content={
            "success": True,
            "message": "Letta conversation started",
            "data": {
                "conversation_id": context.conversation_id,
                "user_memory": {
                    "conversation_count": context.user_memory.conversation_count,
                    "common_issues": context.user_memory.common_issues,
                    "successful_exercises": context.user_memory.successful_exercises,
                    "last_conversation": context.user_memory.last_conversation.isoformat() if context.user_memory.last_conversation else None
                },
                "fetch_ai_report_available": context.fetch_ai_report is not None,
                "vocal_context": {
                    "has_report": context.fetch_ai_report is not None,
                    "practice_sessions": context.fetch_ai_report.get("practice_sessions", 0) if context.fetch_ai_report else 0,
                    "total_practice_time": context.fetch_ai_report.get("total_practice_time", 0) if context.fetch_ai_report else 0,
                    "summary": context.fetch_ai_report.get("summary", "") if context.fetch_ai_report else "",
                    "conversation_starter": context.conversation_starter
                }
            }
        })
    except Exception as e:
        logger.error(f"Error starting Letta conversation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start conversation: {str(e)}")