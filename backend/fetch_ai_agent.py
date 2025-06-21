"""
Fetch AI uAgent for automated vocal analysis report generation
Proper integration with Fetch AI's agent ecosystem
"""
import os
import logging
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import uuid4
import pytz

# Fetch AI uAgents imports
try:
    from uagents import Agent, Context
    from uagents.setup import fund_agent_if_low
    from uagents_core.contrib.protocols.chat import ChatMessage, ChatAcknowledgement, TextContent
    from uagents_core.models import ErrorMessage
    from uagents import Protocol
    UAGENTS_AVAILABLE = True
except ImportError:
    UAGENTS_AVAILABLE = False
    logging.warning("uAgents not available, falling back to simplified agent")

# Import our existing Fetch AI service
from fetch_ai_service import FetchAiVocalCoach
from supabase import create_client, Client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VocalCoachAgent:
    """Fetch AI agent for automated vocal analysis report generation"""
    
    def __init__(self):
        # Initialize Fetch AI service
        self.fetch_ai_coach = FetchAiVocalCoach()
        
        # Setup Supabase connection
        self.setup_supabase()
        
        # Agent state
        self.last_processed_date = None
        self.processed_users = set()
        self.agent_id = str(uuid4())
        self.is_running = False
        
        # Initialize uAgent if available
        if UAGENTS_AVAILABLE:
            self._init_uagent()
        else:
            logger.info("Using simplified agent mode (uAgents not available)")
        
        logger.info(f"Vocal Coach Agent initialized with ID: {self.agent_id}")
    
    def _init_uagent(self):
        """Initialize the uAgent with Fetch AI integration"""
        try:
            self.uagent = Agent(
                name="vocal_coach_agent",
                port=8001,
                seed="vocal_coach_seed_phrase_for_hackathon_demo_2024",
                endpoint=["http://127.0.0.1:8001/submit"],
                mailbox=True,
                publish_agent_details=True
            )
            
            # Set up agent handlers
            self._setup_uagent_handlers()
            
            logger.info(f"uAgent initialized with address: {self.uagent.address}")
            
        except Exception as e:
            logger.error(f"Failed to initialize uAgent: {str(e)}")
            UAGENTS_AVAILABLE = False
    
    def _setup_uagent_handlers(self):
        """Set up uAgent event handlers"""
        if not UAGENTS_AVAILABLE:
            return
            
        @self.uagent.on_event("startup")
        async def on_startup(ctx: Context):
            """Agent startup handler"""
            ctx.logger.info(f"Vocal Coach uAgent starting up with address: {self.uagent.address}")
            
            # Fund agent if needed (for demo purposes)
            try:
                fund_agent_if_low(self.uagent.wallet.address())
                ctx.logger.info("Agent wallet funded successfully")
            except Exception as e:
                ctx.logger.warning(f"Could not fund agent wallet: {str(e)}")
            
            # Generate initial reports
            await self.generate_daily_reports()
            
            ctx.logger.info("Vocal Coach uAgent startup complete")
        
        @self.uagent.on_interval(period=120.0)  # 2 minutes
        async def scheduled_report_generation(ctx: Context):
            """Scheduled task to generate reports every 2 minutes"""
            await self.generate_daily_reports()
            ctx.logger.info("Scheduled report generation completed")
    
    def setup_supabase(self):
        """Initialize Supabase client"""
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            
            if not supabase_url or not supabase_key:
                logger.warning("Supabase credentials not found. Agent will use mock data.")
                self.supabase: Optional[Client] = None
            else:
                self.supabase = create_client(supabase_url, supabase_key)
                logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase: {str(e)}")
            self.supabase = None
    
    async def get_active_users(self) -> List[str]:
        """Get users with practice sessions in the last 24 hours"""
        if not self.supabase:
            # Return mock users for demo
            return ["demo_user_1", "demo_user_2", "demo_user_3"]
        
        try:
            # Get users with sessions in the last 24 hours
            yesterday = (datetime.now(pytz.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
            
            response = self.supabase.table('vocal_analysis_history').select(
                'user_id'
            ).gte('created_at', f"{yesterday}T00:00:00").execute()
            
            if not response.data:
                return []
            
            # Get unique user IDs
            user_ids = list(set([session['user_id'] for session in response.data]))
            logger.info(f"Found {len(user_ids)} active users: {user_ids}")
            return user_ids
            
        except Exception as e:
            logger.error(f"Error fetching active users: {str(e)}")
            return []
    
    async def generate_user_report(self, user_id: str, date: str) -> bool:
        """Generate report for a specific user and date"""
        try:
            logger.info(f"Generating report for user {user_id} on {date}")
            
            # Generate report using Fetch AI service
            report = await self.fetch_ai_coach.generate_daily_report(user_id, date)
            
            # Convert to JSON format for storage
            report_data = {
                "date": report.date,
                "id": report.id,
                "summary": report.summary,
                "metrics": {
                    key: {
                        "current": metric.current,
                        "previous": metric.previous,
                        "change": metric.change,
                        "trend": metric.trend,
                        "improvement_percentage": getattr(metric, 'improvement_percentage', None)
                    }
                    for key, metric in report.metrics.items()
                },
                "insights": report.insights,
                "recommendations": report.recommendations,
                "practice_sessions": report.practice_sessions,
                "total_practice_time": report.total_practice_time,
                "best_time_of_day": report.best_time_of_day
            }
            
            # Save to fetch_ai_reports table
            if self.supabase:
                # Upsert report (update if exists, insert if not)
                result = self.supabase.table('fetch_ai_reports').upsert({
                    "user_id": user_id,
                    "date": date,
                    "report_data": report_data,
                    "agent_id": self.agent_id,
                    "processing_status": "completed",
                    "created_at": datetime.now(pytz.utc).isoformat()
                }).execute()
                
                if result.data:
                    logger.info(f"Successfully saved report for user {user_id}")
                    return True
                else:
                    logger.error(f"Failed to save report for user {user_id}")
                    return False
            else:
                # Mock mode - just log the report
                logger.info(f"Mock mode: Generated report for user {user_id}: {report.summary}")
                return True
                
        except Exception as e:
            logger.error(f"Error generating report for user {user_id}: {str(e)}")
            
            # Save error status to database
            if self.supabase:
                try:
                    self.supabase.table('fetch_ai_reports').upsert({
                        "user_id": user_id,
                        "date": date,
                        "report_data": {"error": str(e)},
                        "agent_id": self.agent_id,
                        "processing_status": "error",
                        "error_message": str(e),
                        "created_at": datetime.now(pytz.utc).isoformat()
                    }).execute()
                except Exception as db_error:
                    logger.error(f"Failed to save error status: {str(db_error)}")
            
            return False
    
    async def generate_daily_reports(self):
        """Generate reports for all active users"""
        try:
            current_date = datetime.now(pytz.utc).strftime("%Y-%m-%d")
            
            # Skip if we already processed today
            if self.last_processed_date == current_date:
                logger.info("Already processed reports for today")
                return
            
            logger.info(f"Starting daily report generation for {current_date}")
            
            # Get active users
            active_users = await self.get_active_users()
            
            if not active_users:
                logger.info("No active users found")
                return
            
            # Generate reports for each user
            success_count = 0
            for user_id in active_users:
                success = await self.generate_user_report(user_id, current_date)
                if success:
                    success_count += 1
                    self.processed_users.add(user_id)
            
            # Update last processed date
            self.last_processed_date = current_date
            
            logger.info(f"Completed report generation: {success_count}/{len(active_users)} successful")
            
        except Exception as e:
            logger.error(f"Error in daily report generation: {str(e)}")
    
    async def start_background_task(self):
        """Start the background task that runs every 2 minutes"""
        self.is_running = True
        logger.info("Starting background report generation task")
        
        # If uAgents is available, use it
        if UAGENTS_AVAILABLE and hasattr(self, 'uagent'):
            try:
                logger.info("Starting uAgent...")
                await self.uagent.run()
            except Exception as e:
                logger.error(f"uAgent failed to start: {str(e)}")
                # Fall back to simple background task
                await self._simple_background_task()
        else:
            # Use simple background task
            await self._simple_background_task()
    
    async def _simple_background_task(self):
        """Simple background task without uAgents"""
        while self.is_running:
            try:
                await self.generate_daily_reports()
                # Wait 2 minutes (120 seconds)
                await asyncio.sleep(120)
            except Exception as e:
                logger.error(f"Error in background task: {str(e)}")
                # Wait 30 seconds before retrying
                await asyncio.sleep(30)
    
    def stop_background_task(self):
        """Stop the background task"""
        self.is_running = False
        logger.info("Stopping background report generation task")
    
    def get_status(self) -> dict:
        """Get current agent status"""
        status = {
            "agent_id": self.agent_id,
            "agent_name": "vocal_coach_agent",
            "last_processed_date": self.last_processed_date,
            "processed_users_count": len(self.processed_users),
            "next_run_in_seconds": 120,  # 2 minutes
            "status": "running" if self.is_running else "stopped"
        }
        
        # Add uAgent information if available
        if UAGENTS_AVAILABLE and hasattr(self, 'uagent'):
            status.update({
                "uagent_address": str(self.uagent.address),
                "uagent_mode": "enabled",
                "agentverse_ready": True
            })
        else:
            status.update({
                "uagent_mode": "simplified",
                "agentverse_ready": False
            })
        
        return status

# Create the agent instance
vocal_agent = VocalCoachAgent() 