import os
import logging
import tempfile
import json
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Path, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import asyncio
import requests
import httpx

# Import our custom voice analyzer and Fetch AI service
from voice_analyzer import VoiceAnalyzer
from fetch_ai_service import FetchAiVocalCoach
from fetch_ai_agent import vocal_agent

# Import lesson feedback service
from lesson_feedback_service import lesson_feedback_service

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

# Import Enhanced Letta service
try:
    from enhanced_letta_service import EnhancedLettaService
    from enhanced_api_endpoints import router as enhanced_letta_router
    ENHANCED_LETTA_AVAILABLE = True
    logging.info("Enhanced Letta service imported successfully")
except ImportError as e:
    logging.warning(f"Enhanced Letta service not available: {str(e)}")
    ENHANCED_LETTA_AVAILABLE = False

# Import Groq client for lyrics generation
try:
    from groq import Groq
    GROQ_AVAILABLE = True
    logging.info("Groq SDK imported successfully")
except ImportError as e:
    logging.warning(f"Groq SDK not available: {str(e)}")
    GROQ_AVAILABLE = False
    Groq = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Vocal Coach AI Backend", version="1.0.0")

# Include enhanced Letta routes if available
if ENHANCED_LETTA_AVAILABLE:
    app.include_router(enhanced_letta_router)
    logger.info("Enhanced Letta API endpoints registered")
else:
    logger.warning("Enhanced Letta API endpoints not available")

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

# Initialize Groq client
groq_client: Optional[Groq] = None
groq_api_key = os.getenv("GROQ_API_KEY")

if groq_api_key and GROQ_AVAILABLE:
    groq_client = Groq(api_key=groq_api_key)
    logger.info("Groq client initialized successfully")
else:
    logger.warning("Groq API key not found or SDK not available. Lyrics generation and vocal feedback will use fallback.")

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
            "/api/vocal-feedback",
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
    
@app.post("/api/letta/conversation/chat")
async def letta_chat(
    conversation_id: str = Form(...),
    user_id: str = Form(...),
    message: str = Form(...)
):
    """
    Send a message to Letta and get response
    """
    if not LETTA_AVAILABLE:
        raise HTTPException(status_code=503, detail="Letta service is not available")
    
    try:
        logger.info(f"Letta chat message from user {user_id} in conversation {conversation_id}")
        
        # Retrieve context from cache
        context = conversation_contexts.get(conversation_id)
        
        if not context:
            # If context not found, try to rebuild it (e.g., if server restarted)
            logger.warning(f"Context for conversation {conversation_id} not found in cache. Rebuilding.")
            context = await letta_coach.start_conversation(
                user_id=user_id,
                conversation_type=ConversationType.DAILY_FEEDBACK
                # Note: The specific date context might be lost on rebuild
            )
            conversation_contexts[conversation_id] = context

        # Generate response
        response = await letta_coach.generate_response(context, message)
        
        # Update cache with the latest context state (e.g., conversation history)
        conversation_contexts[conversation_id] = context
        
        return JSONResponse(content={
            "success": True,
            "message": "Letta response generated",
            "data": {
                "conversation_id": conversation_id,
                "response": {
                    "message": response.message,
                    "suggestions": response.suggestions,
                    "follow_up_questions": response.follow_up_questions,
                    "exercise_recommendations": response.exercise_recommendations,
                    "emotional_tone": response.emotional_tone
                },
                "context": {
                    "fetch_ai_report_available": context.fetch_ai_report is not None,
                    "practice_sessions": context.fetch_ai_report.get("practice_sessions", 0) if context.fetch_ai_report else 0,
                    "vocal_insights_available": bool(context.vocal_context)
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Error in Letta chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.get("/api/letta/memory/{user_id}")
async def get_letta_memory(
    user_id: str = Path(..., description="User ID")
):
    """
    Get user's Letta memory profile
    """
    if not LETTA_AVAILABLE:
        raise HTTPException(status_code=503, detail="Letta service is not available")
    
    try:
        logger.info(f"Getting Letta memory for user {user_id}")
        
        memory = await letta_coach.get_user_memory(user_id)
        
        return JSONResponse(content={
            "success": True,
            "message": "Memory profile retrieved",
            "data": {
                "user_id": memory.user_id,
                "vocal_personality": memory.vocal_personality,
                "common_issues": memory.common_issues,
                "successful_exercises": memory.successful_exercises,
                "progress_patterns": memory.progress_patterns,
                "conversation_count": memory.conversation_count,
                "last_conversation": memory.last_conversation.isoformat() if memory.last_conversation else None,
                "created_at": memory.created_at.isoformat(),
                "updated_at": memory.updated_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting Letta memory: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get memory: {str(e)}")

@app.post("/api/generate-lyrics")
async def generate_lyrics(
    genre: str = Form(...),
    mood: str = Form(...),
    theme: str = Form(...),
    difficulty: str = Form(...),
    custom_request: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None)
):
    """
    Generate lyrics using Groq API based on user preferences
    
    Args:
        genre: Music genre (Pop, Rock, Jazz, etc.)
        mood: Emotional mood (Happy, Melancholic, etc.)
        theme: Song theme (Love, Friendship, etc.)
        difficulty: Difficulty level (beginner, intermediate, advanced)
        custom_request: Additional user requirements
        user_id: Optional user ID for tracking
        
    Returns:
        JSON with generated lyrics
    """
    try:
        logger.info(f"Received lyrics generation request: genre={genre}, mood={mood}, theme={theme}, difficulty={difficulty}")
        if user_id:
            logger.info(f"User ID: {user_id}")
        
        # Validate required fields
        if not all([genre, mood, theme, difficulty]):
            raise HTTPException(status_code=400, detail="Missing required fields: genre, mood, theme, difficulty")
        
        # Generate lyrics using Groq
        lyrics = await _generate_lyrics_with_groq(genre, mood, theme, difficulty, custom_request)
        
        # Save to database if user_id is provided
        if user_id and supabase:
            try:
                lyrics_data = {
                    'user_id': user_id,
                    'created_at': datetime.now().isoformat(),
                    'genre': genre,
                    'mood': mood,
                    'theme': theme,
                    'difficulty': difficulty,
                    'custom_request': custom_request,
                    'lyrics': lyrics,
                    'source': 'groq_api'
                }
                
                # Insert into lyrics_history table (create if doesn't exist)
                result = supabase.table('lyrics_history').insert(lyrics_data).execute()
                logger.info(f"Lyrics saved to database for user {user_id}")
                
            except Exception as db_error:
                logger.error(f"Failed to save lyrics to database: {str(db_error)}")
                # Don't fail the request if database save fails
        
        return JSONResponse(content={
            "success": True,
            "message": "Lyrics generated successfully",
            "data": {
                "lyrics": lyrics,
                "metadata": {
                    "genre": genre,
                    "mood": mood,
                    "theme": theme,
                    "difficulty": difficulty,
                    "custom_request": custom_request,
                    "generated_at": datetime.now().isoformat()
                }
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating lyrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lyrics generation failed: {str(e)}")

async def _generate_lyrics_with_groq(genre: str, mood: str, theme: str, difficulty: str, custom_request: Optional[str] = None) -> str:
    """
    Generate lyrics using Groq API with fallback to mock generation
    """
    if not groq_client:
        logger.warning("Groq client not available, using fallback lyrics generation")
        return _generate_fallback_lyrics(genre, mood, theme, difficulty, custom_request)
    
    try:
        # Create a detailed prompt for Groq
        prompt = f"""You are a professional songwriter. Create a 15-second verse (approximately 4 lines) for a {genre} song with the following specifications:

Genre: {genre}
Mood: {mood}
Theme: {theme}
Difficulty Level: {difficulty}

Additional Requirements: {custom_request or 'None'}

Guidelines:
- Create exactly 4 lines that can be sung in about 15 seconds
- Match the emotional tone of the mood
- Use language appropriate for the difficulty level:
  * Beginner: Simple words, basic rhyming patterns
  * Intermediate: Moderate vocabulary, varied rhythm
  * Advanced: Rich vocabulary, complex metaphors
- Include the format: [Verse - 15 seconds] at the beginning
- Make it inspiring and suitable for vocal practice
- Ensure the lyrics flow naturally and are singable

Please provide only the lyrics without any additional commentary or formatting."""

        # Call Groq API
        response = groq_client.chat.completions.create(
            model="llama3-8b-8192",  # Using Llama3 model for better creative output
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.8,  # Higher temperature for more creative output
            max_tokens=200,
            top_p=0.9
        )
        
        lyrics = response.choices[0].message.content.strip()
        
        # Clean up the response
        if lyrics.startswith("[Verse"):
            return lyrics
        else:
            # Add format if not present
            return f"[Verse - 15 seconds]\n{lyrics}"
            
    except Exception as e:
        logger.error(f"Groq API error: {str(e)}")
        logger.warning("Falling back to mock lyrics generation")
        return _generate_fallback_lyrics(genre, mood, theme, difficulty, custom_request)

def _generate_fallback_lyrics(genre: str, mood: str, theme: str, difficulty: str, custom_request: Optional[str] = None) -> str:
    """
    Generate fallback lyrics when Groq API is unavailable
    """
    # Enhanced fallback lyrics with more variety
    lyrics_templates = {
        "pop": {
            "happy": {
                "beginner": "[Verse - 15 seconds]\nIn the morning light, I feel so alive\nEvery step I take, I'm ready to thrive\nWith a heart so full and dreams so bright\nI'm reaching for the stars tonight",
                "intermediate": "[Verse - 15 seconds]\nSunshine breaking through the clouds above\nFilling every corner with your love\nDancing through the day with endless grace\nFinding beauty in this perfect place",
                "advanced": "[Verse - 15 seconds]\nEuphoria cascades like morning dew\nEvery moment feels completely new\nTranscending ordinary time and space\nIn this magical, enchanted place"
            },
            "melancholic": {
                "beginner": "[Verse - 15 seconds]\nIn the quiet hours of the night\nI think about the things that might\nHave been different, have been true\nIf I'd only known what to do",
                "intermediate": "[Verse - 15 seconds]\nShadows dance upon the empty wall\nEchoes of a love that used to call\nMemories like autumn leaves that fall\nSilent whispers, nothing left at all",
                "advanced": "[Verse - 15 seconds]\nMelancholy whispers through the rain\nDrowning out the echoes of our pain\nTime moves forward, but we remain\nTrapped in memories we can't explain"
            }
        },
        "rock": {
            "energetic": {
                "beginner": "[Verse - 15 seconds]\nI can feel the fire burning deep inside\nBreaking through the walls, I'm ready to ride\nNo more holding back, no more fear\nI'm breaking free, the time is here",
                "intermediate": "[Verse - 15 seconds]\nThunder crashing through the midnight sky\nLightning strikes as I begin to fly\nBreaking chains that held me down so long\nNow I'm singing freedom's mighty song",
                "advanced": "[Verse - 15 seconds]\nInferno raging through my very soul\nTaking back the power they once stole\nMetamorphosis of mind and heart\nNow I'm ready for a brand new start"
            }
        },
        "jazz": {
            "romantic": {
                "beginner": "[Verse - 15 seconds]\nMoonlight dancing on the window pane\nSoft and gentle like a sweet refrain\nIn your eyes I see a love so true\nEvery moment spent here with you",
                "intermediate": "[Verse - 15 seconds]\nVelvet night wraps around us tight\nStars are shining with their silver light\nIn this moment, time stands still\nLove's sweet melody begins to thrill",
                "advanced": "[Verse - 15 seconds]\nSultry whispers in the midnight air\nJasmine fragrance floating everywhere\nIn your embrace, I find my home\nWhere love's sweet symphony has grown"
            }
        }
    }
    
    # Get template based on genre and mood
    genre_templates = lyrics_templates.get(genre.lower(), lyrics_templates["pop"])
    mood_templates = genre_templates.get(mood.lower(), genre_templates.get("happy", lyrics_templates["pop"]["happy"]))
    difficulty_template = mood_templates.get(difficulty, mood_templates.get("beginner", mood_templates.get("intermediate", mood_templates.get("advanced"))))
    
    return difficulty_template

@app.post("/api/vocal-feedback")
async def generate_vocal_feedback(
    audio: UploadFile = File(...),
    target_song: Optional[str] = Form(None),
    user_vocal_profile: Optional[str] = Form(None),
    practice_session: Optional[int] = Form(1),
    user_id: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None)
):
    """
    Generate real-time vocal feedback using Groq AI
    
    Args:
        audio: User's vocal recording
        target_song: Song being practiced (optional)
        user_vocal_profile: JSON string of user's vocal profile
        practice_session: Session number for tracking progress
        user_id: User ID for tracking
        session_id: Session ID for tracking
        
    Returns:
        JSON with comprehensive vocal feedback
    """
    try:
        logger.info(f"Received vocal feedback request: {audio.filename}")
        
        # Validate file type
        if not audio.filename.lower().endswith(('.wav', '.mp3', '.m4a', '.webm')):
            raise HTTPException(status_code=400, detail="Unsupported audio format")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{audio.filename.split('.')[-1]}") as temp_file:
            content = await audio.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # First, analyze the audio using existing voice analyzer
            logger.info(f"Starting voice analysis for feedback")
            analysis_results = await voice_analyzer.analyze_audio_file(temp_file_path)
            
            # Generate AI-powered feedback using Groq
            feedback_results = await _generate_groq_vocal_feedback(
                analysis_results, target_song, user_vocal_profile, practice_session
            )
            
            # Combine analysis and feedback
            combined_results = {
                **analysis_results,
                **feedback_results
            }
            
            # Save to database if user_id is provided
            if user_id and supabase:
                try:
                    feedback_data = {
                        'id': session_id or f"feedback_{int(datetime.now().timestamp())}",
                        'user_id': user_id,
                        'created_at': datetime.now().isoformat(),
                        'practice_session': practice_session,
                        'target_song': target_song,
                        'voice_analysis': analysis_results,
                        'ai_feedback': feedback_results,
                        'feedback_type': 'real_time_coaching'
                    }
                    
                    # Insert into vocal_feedback_history table
                    result = supabase.table('vocal_feedback_history').insert(feedback_data).execute()
                    logger.info(f"Vocal feedback saved to database: {feedback_data['id']}")
                    
                except Exception as db_error:
                    logger.error(f"Failed to save feedback to database: {str(db_error)}")
            
            return JSONResponse(content={
                "success": True,
                "message": "Vocal feedback generated successfully",
                "data": combined_results,
                "file_name": audio.filename,
                "file_size": len(content),
                "user_id": user_id,
                "session_id": session_id
            })
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                logger.info(f"Cleaned up temporary file: {temp_file_path}")
    
    except Exception as e:
        logger.error(f"Error in vocal feedback generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Feedback generation failed: {str(e)}")

async def _generate_groq_vocal_feedback(
    voice_analysis: Dict[str, Any], 
    target_song: Optional[str], 
    user_vocal_profile: Optional[str], 
    practice_session: int
) -> Dict[str, Any]:
    """
    Generate AI-powered vocal feedback using Groq
    """
    if not groq_client:
        logger.warning("Groq client not available, using fallback feedback")
        return _generate_fallback_vocal_feedback(voice_analysis, target_song, practice_session)
    
    try:
        # Parse user vocal profile
        vocal_profile = {}
        if user_vocal_profile:
            try:
                vocal_profile = json.loads(user_vocal_profile)
            except json.JSONDecodeError:
                logger.warning("Invalid vocal profile JSON, using empty profile")
        
        # Create comprehensive prompt for Groq
        prompt = f"""
        As an expert vocal coach with 20+ years of experience, analyze this singing performance and provide comprehensive, actionable feedback.

        VOCAL ANALYSIS DATA:
        - Mean Pitch: {voice_analysis.get('mean_pitch', 0)} Hz
        - Voice Type: {voice_analysis.get('voice_type', 'unknown')}
        - Vibrato Rate: {voice_analysis.get('vibrato_rate', 0)} Hz
        - Jitter: {voice_analysis.get('jitter', 0)}
        - Shimmer: {voice_analysis.get('shimmer', 0)}
        - Dynamics: {voice_analysis.get('dynamics', 'stable')}
        - Vocal Range: {voice_analysis.get('lowest_note', 'C3')} - {voice_analysis.get('highest_note', 'C5')}

        TARGET SONG: {target_song or 'General vocal practice'}
        PRACTICE SESSION: #{practice_session}
        USER PROFILE: {json.dumps(vocal_profile, indent=2)}

        Please provide detailed feedback in the following JSON format:

        {{
            "overall_assessment": {{
                "score": 1-10,
                "strengths": ["list of strengths"],
                "areas_for_improvement": ["list of areas to work on"],
                "confidence_level": "low/medium/high"
            }},
            "technical_feedback": {{
                "pitch_accuracy": {{
                    "assessment": "detailed assessment",
                    "specific_issues": ["list of issues"],
                    "exercises": ["specific exercises to improve"]
                }},
                "breath_control": {{
                    "assessment": "detailed assessment",
                    "specific_issues": ["list of issues"],
                    "exercises": ["specific exercises to improve"]
                }},
                "vocal_technique": {{
                    "assessment": "detailed assessment",
                    "specific_issues": ["list of issues"],
                    "exercises": ["specific exercises to improve"]
                }}
            }},
            "emotional_expression": {{
                "assessment": "how well emotion was conveyed",
                "suggestions": ["ways to improve emotional expression"],
                "performance_tips": ["tips for better performance"]
            }},
            "practice_recommendations": {{
                "immediate_focus": "what to work on in next 10 minutes",
                "daily_exercises": ["exercises for daily practice"],
                "weekly_goals": ["goals for the week"],
                "long_term_development": "long-term improvement plan"
            }},
            "motivational_message": "encouraging message for the singer",
            "next_session_prep": "what to prepare for the next practice session"
        }}

        Be specific, encouraging, and actionable. Focus on the most important areas for improvement while acknowledging strengths.
        """

        # Call Groq API
        response = groq_client.chat.completions.create(
            model="llama3-8b-8192",  # Using Llama3 for better reasoning
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,  # Balanced creativity and consistency
            max_tokens=1500,
            top_p=0.9
        )
        
        feedback_content = response.choices[0].message.content.strip()
        
        # Parse the JSON response
        try:
            feedback_data = json.loads(feedback_content)
            return {
                "ai_feedback": feedback_data,
                "feedback_source": "groq_ai",
                "generated_at": datetime.now().isoformat()
            }
        except json.JSONDecodeError:
            logger.warning("Failed to parse Groq response as JSON, using fallback")
            return _generate_fallback_vocal_feedback(voice_analysis, target_song, practice_session)
            
    except Exception as e:
        logger.error(f"Groq API error: {str(e)}")
        logger.warning("Falling back to mock feedback generation")
        return _generate_fallback_vocal_feedback(voice_analysis, target_song, practice_session)

def _generate_fallback_vocal_feedback(
    voice_analysis: Dict[str, Any], 
    target_song: Optional[str], 
    practice_session: int
) -> Dict[str, Any]:
    """
    Generate fallback vocal feedback when Groq is unavailable
    """
    import random
    
    voice_type = voice_analysis.get('voice_type', 'tenor')
    mean_pitch = voice_analysis.get('mean_pitch', 280)
    
    # Generate contextual feedback based on voice analysis
    if mean_pitch < 250:
        voice_category = "lower voice"
        breath_exercise = "Focus on diaphragmatic breathing to support your lower register"
    elif mean_pitch > 350:
        voice_category = "higher voice"
        breath_exercise = "Work on breath control to maintain clarity in your upper register"
    else:
        voice_category = "mid-range voice"
        breath_exercise = "Practice breath support for consistent tone across your range"
    
    return {
        "ai_feedback": {
            "overall_assessment": {
                "score": random.randint(6, 9),
                "strengths": [
                    f"Good {voice_category} control",
                    "Consistent pitch stability",
                    "Clear vocal tone"
                ],
                "areas_for_improvement": [
                    "Breath control and support",
                    "Dynamic range expression",
                    "Vibrato consistency"
                ],
                "confidence_level": random.choice(["low", "medium", "high"])
            },
            "technical_feedback": {
                "pitch_accuracy": {
                    "assessment": "Your pitch accuracy shows good potential with room for improvement",
                    "specific_issues": [
                        "Minor pitch variations in sustained notes",
                        "Slight flatness on higher notes"
                    ],
                    "exercises": [
                        "Practice with a piano or pitch app",
                        "Sustained note exercises",
                        "Scale practice in your comfortable range"
                    ]
                },
                "breath_control": {
                    "assessment": "Breath control needs focused attention",
                    "specific_issues": [
                        "Inconsistent breath support",
                        "Short phrase length"
                    ],
                    "exercises": [
                        breath_exercise,
                        "Lip trills for breath control",
                        "Sustained vowel exercises"
                    ]
                },
                "vocal_technique": {
                    "assessment": "Good foundation with room for technical refinement",
                    "specific_issues": [
                        "Tension in upper register",
                        "Inconsistent vocal placement"
                    ],
                    "exercises": [
                        "Vocal warm-ups before practice",
                        "Humming exercises for placement",
                        "Relaxation techniques for tension"
                    ]
                }
            },
            "emotional_expression": {
                "assessment": "Focus on connecting emotionally with your material",
                "suggestions": [
                    "Practice with feeling and intention",
                    "Record yourself and listen for emotional impact",
                    "Study performances of songs you love"
                ],
                "performance_tips": [
                    "Visualize the story you're telling",
                    "Use facial expressions to enhance emotion",
                    "Practice in front of a mirror"
                ]
            },
            "practice_recommendations": {
                "immediate_focus": "Work on breath control exercises for 10 minutes",
                "daily_exercises": [
                    "5 minutes of vocal warm-ups",
                    "10 minutes of breath control practice",
                    "15 minutes of song practice"
                ],
                "weekly_goals": [
                    "Improve breath support",
                    "Expand vocal range by one note",
                    "Learn one new song"
                ],
                "long_term_development": "Build a consistent daily practice routine focusing on technique and expression"
            },
            "motivational_message": "You're making great progress! Every practice session brings you closer to your vocal goals. Keep up the excellent work!",
            "next_session_prep": "Prepare a song you love to sing and focus on emotional connection"
        },
        "feedback_source": "fallback_ai",
        "generated_at": datetime.now().isoformat()
    }

@app.post("/api/lesson-feedback")
async def store_lesson_feedback(
    user_id: str = Form(...),
    lesson_data: str = Form(...),  # JSON string of lesson data
    session_time: int = Form(...),
    recording_duration: int = Form(...),
    voice_analysis: str = Form(...),  # JSON string of voice analysis
    ai_feedback: str = Form(...),
    voice_metrics: str = Form(...)  # JSON string of voice metrics
):
    """
    Store lesson completion feedback
    """
    try:
        logger.info(f"Storing lesson feedback for user {user_id}")
        
        # Parse JSON strings
        lesson_dict = json.loads(lesson_data)
        voice_analysis_dict = json.loads(voice_analysis)
        voice_metrics_dict = json.loads(voice_metrics)
        
        # Prepare feedback data
        feedback_data = {
            "user_id": user_id,
            "lesson": lesson_dict,
            "session_time": session_time,
            "recording_duration": recording_duration,
            "voice_analysis": voice_analysis_dict,
            "ai_feedback": ai_feedback,
            "voice_metrics": voice_metrics_dict
        }
        
        # Store feedback
        success = await lesson_feedback_service.store_lesson_feedback(feedback_data)
        
        if success:
            return JSONResponse(content={
                "success": True,
                "message": "Lesson feedback stored successfully",
                "data": {"user_id": user_id}
            })
        else:
            raise HTTPException(status_code=500, detail="Failed to store lesson feedback")
            
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in lesson feedback: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except Exception as e:
        logger.error(f"Error storing lesson feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to store feedback: {str(e)}")

@app.get("/api/lesson-feedback/{user_id}/latest")
async def get_latest_lesson_feedback(
    user_id: str = Path(..., description="User ID")
):
    """
    Get latest lesson feedback for a user
    """
    try:
        logger.info(f"Getting latest lesson feedback for user {user_id}")
        
        # Get latest feedback
        feedback = await lesson_feedback_service.get_latest_lesson_feedback(user_id)
        
        if feedback:
            return JSONResponse(content={
                "success": True,
                "message": "Latest lesson feedback retrieved",
                "data": feedback
            })
        else:
            return JSONResponse(content={
                "success": True,
                "message": "No lesson feedback found",
                "data": None
            })
            
    except Exception as e:
        logger.error(f"Error getting latest lesson feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get feedback: {str(e)}")

@app.get("/api/vapi-context/{user_id}")
async def get_vapi_lesson_context(
    user_id: str = Path(..., description="User ID")
):
    """
    Get VAPI lesson context for a user based on their latest lesson
    """
    try:
        logger.info(f"Creating VAPI lesson context for user {user_id}")
        
        # Create VAPI context
        context = await lesson_feedback_service.create_vapi_context(user_id)
        
        if context:
            # Convert to dict for JSON response
            context_dict = {
                "lesson_title": context.lesson_title,
                "lesson_category": context.lesson_category,
                "lesson_level": context.lesson_level,
                "session_duration": context.session_duration,
                "recording_duration": context.recording_duration,
                "voice_type": context.voice_type,
                "mean_pitch": context.mean_pitch,
                "vocal_range": context.vocal_range,
                "voice_metrics": context.voice_metrics,
                "ai_feedback": context.ai_feedback,
                "completion_time": context.completion_time,
                "recommendations": context.recommendations,
                "performance_insights": context.performance_insights,
                "quality_score": context.quality_score
            }
            
            # Create enhanced formatted message for VAPI with more coaching context
            strengths = ", ".join(context.performance_insights.get("strengths", []))
            areas_for_improvement = ", ".join(context.performance_insights.get("areas_for_improvement", []))
            quality_rating = context.quality_score.get("rating", "Good")
            quality_factors = ", ".join(context.quality_score.get("factors", []))
            
            vapi_message = f"""The user just completed a {context.lesson_title} lesson ({context.lesson_category} training, {context.lesson_level} level). 

Session Summary:
- Duration: {context.session_duration}
- Recording: {context.recording_duration}
- Completed at: {context.completion_time}
- Quality Rating: {quality_rating}/100

Voice Analysis:
- Voice Type: {context.voice_type}
- Mean Pitch: {context.mean_pitch} Hz
- Vocal Range: {context.vocal_range}

Performance Highlights:
- Strengths: {strengths if strengths else "Consistent effort and engagement"}
- Focus Areas: {areas_for_improvement if areas_for_improvement else "Continue building fundamentals"}

Session Quality Factors: {quality_factors}

AI Feedback: {context.ai_feedback}

Key Recommendations: {', '.join(context.recommendations)}

I'm here to provide personalized vocal coaching based on this detailed analysis. I can help you understand your results, work on specific techniques, or plan your next practice session."""
            
            return JSONResponse(content={
                "success": True,
                "message": "Enhanced VAPI lesson context created",
                "data": {
                    "context": context_dict,
                    "vapi_message": vapi_message,
                    "has_lesson_data": True,
                    "coaching_variables": {
                        # Additional variables for VAPI assistant overrides
                        "qualityRating": quality_rating,
                        "qualityScore": str(context.quality_score.get("score", 0)),
                        "strengths": strengths or "Consistent practice",
                        "improvementAreas": areas_for_improvement or "Continue fundamentals",
                        "nextSteps": ", ".join(context.performance_insights.get("next_steps", [])),
                        "technicalNotes": ", ".join(context.performance_insights.get("technical_notes", []))
                    }
                }
            })
        else:
            return JSONResponse(content={
                "success": True,
                "message": "No recent lesson data found",
                "data": {
                    "context": None,
                    "vapi_message": "Hello! I'm your AI vocal coach. I don't see any recent lesson data, but I'm here to help with your vocal training. What would you like to work on today?",
                    "has_lesson_data": False,
                    "coaching_variables": {
                        "qualityRating": "New Student",
                        "strengths": "Ready to learn",
                        "improvementAreas": "Establish practice routine",
                        "nextSteps": "Start with fundamental exercises"
                    }
                }
            })
            
    except Exception as e:
        logger.error(f"Error creating VAPI lesson context: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create context: {str(e)}")

# VAPI Proxy Endpoints to handle CORS issues
@app.post("/api/vapi/call/start")
async def start_vapi_call(request: Request):
    """
    Proxy endpoint to start a VAPI call
    Handles CORS by proxying requests through our backend
    """
    try:
        # Get VAPI API key from environment
        vapi_api_key = os.getenv("VAPI_API_KEY", "7af82e9d-df22-44e3-8461-669668e88783")
        
        # Get request body
        body = await request.json()
        
        logger.info(f"Starting VAPI call with payload: {json.dumps(body, indent=2)}")
        
        # Make request to VAPI
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.vapi.ai/call/web",
                headers={
                    "Authorization": f"Bearer {vapi_api_key}",
                    "Content-Type": "application/json"
                },
                json=body,
                timeout=30.0
            )
            
            logger.info(f"VAPI response status: {response.status_code}")
            
            if response.status_code == 200:
                response_data = response.json()
                logger.info(f"VAPI call started successfully: {response_data}")
                return JSONResponse(content=response_data)
            else:
                logger.error(f"VAPI call failed: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"VAPI call failed: {response.text}"
                )
                
    except Exception as e:
        logger.error(f"Error starting VAPI call: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start VAPI call: {str(e)}")

@app.post("/api/vapi/call/stop")
async def stop_vapi_call(request: Request):
    """
    Proxy endpoint to stop a VAPI call
    """
    try:
        # Get VAPI API key from environment
        vapi_api_key = os.getenv("VAPI_API_KEY", "7af82e9d-df22-44e3-8461-669668e88783")
        
        # Get request body
        body = await request.json()
        call_id = body.get("callId")
        
        if not call_id:
            raise HTTPException(status_code=400, detail="callId is required")
        
        logger.info(f"Stopping VAPI call: {call_id}")
        
        # Make request to VAPI
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.vapi.ai/call/{call_id}/stop",
                headers={
                    "Authorization": f"Bearer {vapi_api_key}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            
            logger.info(f"VAPI stop response status: {response.status_code}")
            
            if response.status_code == 200:
                response_data = response.json()
                logger.info(f"VAPI call stopped successfully: {response_data}")
                return JSONResponse(content=response_data)
            else:
                logger.error(f"VAPI stop failed: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"VAPI stop failed: {response.text}"
                )
                
    except Exception as e:
        logger.error(f"Error stopping VAPI call: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to stop VAPI call: {str(e)}")

@app.get("/api/vapi/call/{call_id}")
async def get_vapi_call(call_id: str):
    """
    Proxy endpoint to get VAPI call details
    """
    try:
        # Get VAPI API key from environment
        vapi_api_key = os.getenv("VAPI_API_KEY", "7af82e9d-df22-44e3-8461-669668e88783")
        
        logger.info(f"Getting VAPI call details: {call_id}")
        
        # Make request to VAPI
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.vapi.ai/call/{call_id}",
                headers={
                    "Authorization": f"Bearer {vapi_api_key}"
                },
                timeout=30.0
            )
            
            logger.info(f"VAPI get call response status: {response.status_code}")
            
            if response.status_code == 200:
                response_data = response.json()
                return JSONResponse(content=response_data)
            else:
                logger.error(f"VAPI get call failed: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"VAPI get call failed: {response.text}"
                )
                
    except Exception as e:
        logger.error(f"Error getting VAPI call: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get VAPI call: {str(e)}")

@app.post("/api/vapi/assistant")
async def create_vapi_assistant(request: Request):
    """
    Proxy endpoint to create or update VAPI assistant
    """
    try:
        # Get VAPI API key from environment
        vapi_api_key = os.getenv("VAPI_API_KEY", "7af82e9d-df22-44e3-8461-669668e88783")
        
        # Get request body
        body = await request.json()
        
        logger.info(f"Creating/updating VAPI assistant with payload: {json.dumps(body, indent=2)}")
        
        # Make request to VAPI
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.vapi.ai/assistant",
                headers={
                    "Authorization": f"Bearer {vapi_api_key}",
                    "Content-Type": "application/json"
                },
                json=body,
                timeout=30.0
            )
            
            logger.info(f"VAPI assistant response status: {response.status_code}")
            
            if response.status_code in [200, 201]:
                response_data = response.json()
                logger.info(f"VAPI assistant created/updated successfully: {response_data}")
                return JSONResponse(content=response_data)
            else:
                logger.error(f"VAPI assistant creation failed: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"VAPI assistant creation failed: {response.text}"
                )
                
    except Exception as e:
        logger.error(f"Error creating VAPI assistant: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create VAPI assistant: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080) 
