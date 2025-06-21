"""
Letta Conversational Vocal Coach Service
Memory-driven, long-term vocal companion that remembers user behavior across sessions
"""
import os
import logging
import asyncio
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import json
import uuid
from dataclasses import dataclass, asdict
from enum import Enum
import pytz

# Supabase client for database access
from supabase import create_client, Client

logger = logging.getLogger(__name__)

class ConversationType(Enum):
    DAILY_FEEDBACK = "daily_feedback"
    PROGRESS_REVIEW = "progress_review"
    EXERCISE_GUIDANCE = "exercise_guidance"
    TROUBLESHOOTING = "troubleshooting"
    MOTIVATION = "motivation"

@dataclass
class UserMemory:
    """User's long-term vocal memory profile"""
    user_id: str
    vocal_personality: Dict[str, Any]
    common_issues: List[str]
    successful_exercises: List[str]
    progress_patterns: Dict[str, Any]
    last_conversation: Optional[datetime]
    conversation_count: int
    created_at: datetime
    updated_at: datetime

@dataclass
class ConversationContext:
    """Context for a single conversation session"""
    conversation_id: str
    user_id: str
    conversation_type: ConversationType
    current_date: str
    fetch_ai_report: Optional[Dict[str, Any]]
    user_memory: UserMemory
    conversation_history: List[Dict[str, Any]]
    session_start: datetime
    vocal_context: str = ""
    conversation_starter: str = ""

@dataclass
class LettaResponse:
    """Letta's conversational response"""
    message: str
    suggestions: List[str]
    follow_up_questions: List[str]
    exercise_recommendations: List[str]
    emotional_tone: str
    memory_updates: Dict[str, Any]

class LettaVocalCoach:
    """Letta conversational vocal coach with long-term memory"""
    
    def __init__(self):
        # Initialize Supabase client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            logger.warning("Supabase credentials not found. Using mock data.")
            self.supabase: Optional[Client] = None
        else:
            try:
                self.supabase = create_client(supabase_url, supabase_key)
                logger.info("Letta Supabase client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {str(e)}")
                self.supabase = None
        
        # Letta AI configuration
        self.letta_api_key = os.getenv("LETTA_API_KEY")
        self.letta_agent_id = os.getenv("LETTA_AGENT_ID")
        
        # Initialize Letta client
        if not self.letta_api_key or not self.letta_agent_id:
            logger.warning("Letta API key or Agent ID not found. Using mock responses.")
            self.use_ai = False
            self.letta_client = None
        else:
            try:
                from letta_client import Letta
                self.letta_client = Letta(token=self.letta_api_key)
                self.use_ai = True
                logger.info(f"Letta AI client initialized for agent: {self.letta_agent_id}")
            except ImportError as e:
                logger.error(f"Failed to import Letta client: {str(e)}. Install with: pip install letta-client")
                self.use_ai = False
                self.letta_client = None
            except Exception as e:
                logger.error(f"Failed to initialize Letta client: {str(e)}")
                self.use_ai = False
                self.letta_client = None
        
        # Test database connection
        self._test_database_connection()
    
    def _test_database_connection(self):
        """Test database connection on startup"""
        if not self.supabase:
            logger.warning("Skipping database connection test - Supabase not configured")
            return
        
        try:
            # Simple test query
            response = self.supabase.table('letta_user_memory').select('count', count='exact').limit(1).execute()
            logger.info("Database connection test successful")
        except Exception as e:
            logger.error(f"Database connection test failed: {str(e)}")
            # Don't fail the service, just log the error
    
    async def get_user_memory(self, user_id: str) -> UserMemory:
        """Retrieve or create user's long-term vocal memory"""
        if not self.supabase:
            return self._get_fallback_memory(user_id)
        
        try:
            # Get existing memory
            response = self.supabase.table('letta_user_memory').select('*').eq(
                'user_id', user_id
            ).execute()
            
            if response.data:
                memory_data = response.data[0]
                return UserMemory(
                    user_id=memory_data['user_id'],
                    vocal_personality=memory_data['vocal_personality'],
                    common_issues=memory_data['common_issues'],
                    successful_exercises=memory_data['successful_exercises'],
                    progress_patterns=memory_data['progress_patterns'],
                    last_conversation=datetime.fromisoformat(memory_data['last_conversation']) if memory_data['last_conversation'] else None,
                    conversation_count=memory_data['conversation_count'],
                    created_at=datetime.fromisoformat(memory_data['created_at']),
                    updated_at=datetime.fromisoformat(memory_data['updated_at'])
                )
            else:
                # Create new memory profile
                new_memory = UserMemory(
                    user_id=user_id,
                    vocal_personality={
                        "tone": "enthusiastic and encouraging",
                        "communication_style": "metaphorical and simple",
                        "specialty": "explaining complex vocal science in an easy-to-understand way"
                    },
                    common_issues=[],
                    successful_exercises=[],
                    progress_patterns={},
                    last_conversation=None,
                    conversation_count=0,
                    created_at=datetime.now(pytz.utc),
                    updated_at=datetime.now(pytz.utc)
                )
                
                # Save to database, ensuring datetimes are converted to strings
                memory_dict = asdict(new_memory)
                memory_dict['created_at'] = memory_dict['created_at'].isoformat()
                memory_dict['updated_at'] = memory_dict['updated_at'].isoformat()
                
                self.supabase.table('letta_user_memory').insert(memory_dict).execute()
                return new_memory
                
        except Exception as e:
            logger.error(f"Error getting user memory: {str(e)}")
            return self._get_fallback_memory(user_id)
    
    async def get_report_by_date(self, user_id: str, date: str) -> Optional[Dict[str, Any]]:
        """Get the Fetch AI report for a user on a specific date."""
        if not self.supabase:
            logger.warning("Supabase not available, cannot fetch Fetch AI report")
            return None
        
        try:
            response = self.supabase.table('fetch_ai_reports').select('*').eq(
                'user_id', user_id
            ).eq('date', date).limit(1).single().execute()
            
            if response.data:
                logger.info(f"Found Fetch AI report for user {user_id} on {date}")
                return response.data
            
            logger.info(f"No Fetch AI report found for user {user_id} on {date}")
            return None
            
        except Exception as e:
            # A PostgrestError can be raised if single() finds no rows. This is not an actual error.
            if "Exactly one row was expected" in str(e):
                logger.info(f"No Fetch AI report found for user {user_id} on {date}")
                return None
            logger.error(f"Error fetching Fetch AI report by date: {str(e)}")
            return None

    async def get_latest_fetch_ai_report(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get the most recent Fetch AI report for a user, regardless of date."""
        if not self.supabase:
            return None
        try:
            response = self.supabase.table('fetch_ai_reports').select('*').eq(
                'user_id', user_id
            ).order('date', desc=True).limit(1).single().execute()

            if response.data:
                logger.info(f"Found most recent Fetch AI report for user {user_id} from {response.data['date']}")
                return response.data.get('report_data')
            return None
        except Exception as e:
            if "Exactly one row was expected" in str(e):
                logger.info(f"No Fetch AI reports found for user {user_id}")
                return None
            logger.error(f"Error fetching latest Fetch AI report: {str(e)}")
            return None
    
    def _extract_vocal_insights(self, fetch_ai_report: Dict[str, Any]) -> Dict[str, Any]:
        """Extract key insights from Fetch AI report for conversation context"""
        if not fetch_ai_report:
            return {}
        
        insights = {
            "has_report": True,
            "date": fetch_ai_report.get("date", "Unknown"),
            "summary": fetch_ai_report.get("summary", ""),
            "practice_sessions": fetch_ai_report.get("practice_sessions", 0),
            "total_practice_time": fetch_ai_report.get("total_practice_time", 0),
            "best_time_of_day": fetch_ai_report.get("best_time_of_day", ""),
            "metrics": {},
            "trends": {},
            "recommendations": fetch_ai_report.get("recommendations", []),
            "insights": fetch_ai_report.get("insights", [])
        }
        
        # Extract metric trends and current values
        metrics = fetch_ai_report.get("metrics", {})
        for metric_name, metric_data in metrics.items():
            if isinstance(metric_data, dict):
                insights["metrics"][metric_name] = {
                    "current": metric_data.get("current"),
                    "previous": metric_data.get("previous"),
                    "change": metric_data.get("change", 0),
                    "trend": metric_data.get("trend", "baseline"),
                    "improvement_percentage": metric_data.get("improvement_percentage", 0)
                }
                
                # Identify significant trends
                if metric_data.get("trend") in ["improving", "declining"]:
                    insights["trends"][metric_name] = {
                        "direction": metric_data.get("trend"),
                        "change": metric_data.get("change", 0),
                        "percentage": metric_data.get("improvement_percentage", 0)
                    }
        
        return insights
    
    def _build_vocal_context(self, fetch_ai_report: Dict[str, Any], user_memory: UserMemory) -> str:
        """Build vocal analysis context for AI prompts"""
        if not fetch_ai_report:
            return "You are Letta, a supportive vocal coach. The user hasn't recorded any vocal sessions yet, so focus on encouraging them to start their vocal journey."
        
        insights = self._extract_vocal_insights(fetch_ai_report)
        
        context_parts = [
            "You are Letta, an expert vocal coach with access to detailed vocal analysis data.",
            f"Today's date: {insights.get('date', 'Unknown')}",
            f"User completed {insights.get('practice_sessions', 0)} practice sessions today ({insights.get('total_practice_time', 0)} minutes total)."
        ]
        
        # Add summary if available
        if insights.get("summary"):
            context_parts.append(f"Daily summary: {insights['summary']}")
        
        # Add metric insights
        if insights.get("metrics"):
            context_parts.append("Current vocal metrics:")
            for metric_name, metric_data in insights["metrics"].items():
                if metric_data.get("current") is not None:
                    context_parts.append(f"- {metric_name}: {metric_data['current']:.3f}")
                    if metric_data.get("trend") != "baseline":
                        context_parts.append(f"  Trend: {metric_data['trend']} ({metric_data.get('change', 0):+.3f})")
        
        # Add significant trends
        if insights.get("trends"):
            context_parts.append("Key trends to discuss:")
            for metric_name, trend_data in insights["trends"].items():
                direction = trend_data["direction"]
                percentage = trend_data["percentage"]
                context_parts.append(f"- {metric_name}: {direction} by {percentage:.1f}%")
        
        # Add recommendations
        if insights.get("recommendations"):
            context_parts.append("Recommended focus areas:")
            for rec in insights["recommendations"][:3]:  # Limit to top 3
                context_parts.append(f"- {rec}")
        
        # Add user memory context
        context_parts.append(f"User has had {user_memory.conversation_count} previous conversations with you.")
        if user_memory.common_issues:
            context_parts.append(f"Common issues: {', '.join(user_memory.common_issues)}")
        if user_memory.successful_exercises:
            context_parts.append(f"Successful exercises: {', '.join(user_memory.successful_exercises)}")
        
        context_parts.append("Provide specific, actionable advice based on their vocal data. Be encouraging and use their progress to motivate continued practice.")
        
        return "\n".join(context_parts)
    
    def _generate_conversation_starter(self, fetch_ai_report: Dict[str, Any]) -> str:
        """Generate a contextual conversation starter based on vocal analysis"""
        if not fetch_ai_report:
            return "Hello! I'm Letta, your personal voice coach. I'm here to help you on your vocal journey. What would you like to work on today?"
        
        insights = self._extract_vocal_insights(fetch_ai_report)
        practice_sessions = insights.get("practice_sessions", 0)
        summary = insights.get("summary", "")
        
        if practice_sessions == 0:
            return "Hello! I'm Letta, your personal voice coach. I notice you haven't recorded any sessions yet today. Would you like to start with a simple vocal warm-up exercise?"
        
        if practice_sessions >= 3:
            return f"Hello! I'm Letta, your personal voice coach. Great work today - you've completed {practice_sessions} practice sessions! {summary} What would you like to focus on next?"
        
        # Check for significant trends
        trends = insights.get("trends", {})
        if trends:
            trend_metric = list(trends.keys())[0]
            trend_data = trends[trend_metric]
            if trend_data["direction"] == "improving":
                return f"Hello! I'm Letta, your personal voice coach. Excellent progress - your {trend_metric} has improved by {trend_data['percentage']:.1f}%! {summary} How are you feeling about your practice today?"
            else:
                return f"Hello! I'm Letta, your personal voice coach. I see your {trend_metric} has been challenging lately. {summary} Let's work together to address this. What specific aspect would you like to focus on?"
        
        return f"Hello! I'm Letta, your personal voice coach. {summary} What would you like to discuss about your vocal practice today?"
    
    async def start_conversation(
        self, 
        user_id: str, 
        conversation_type: ConversationType,
        date: Optional[str] = None
    ) -> ConversationContext:
        """Start a new conversation session with Letta"""
        conversation_id = str(uuid.uuid4())
        # Use the provided date, or fall back to the current UTC date for a new conversation
        current_date = date if date else datetime.now(pytz.utc).strftime("%Y-%m-%d")
        
        # Get user's memory profile
        user_memory = await self.get_user_memory(user_id)
        
        # Get Fetch AI report for the specific date
        report_row = await self.get_report_by_date(user_id, current_date)
        
        fetch_ai_report = None
        actual_report_id = None
        if report_row:
            fetch_ai_report = report_row.get('report_data')
            actual_report_id = report_row.get('id') # This is the correct UUID
        
        # Build vocal context for AI prompts
        vocal_context = self._build_vocal_context(fetch_ai_report, user_memory)
        
        # Generate contextual conversation starter
        conversation_starter = self._generate_conversation_starter(fetch_ai_report)
        
        # Create enhanced conversation context
        context = ConversationContext(
            conversation_id=conversation_id,
            user_id=user_id,
            conversation_type=conversation_type,
            current_date=current_date,
            fetch_ai_report=fetch_ai_report,
            user_memory=user_memory,
            conversation_history=[],
            session_start=datetime.now(pytz.utc)
        )
        
        # Add vocal context and conversation starter to context (we'll extend the dataclass)
        context.vocal_context = vocal_context
        context.conversation_starter = conversation_starter
        
        # Save conversation session to database
        if self.supabase:
            try:
                self.supabase.table('letta_conversations').insert({
                    "conversation_id": conversation_id,
                    "user_id": user_id,
                    "conversation_type": conversation_type.value,
                    "fetch_ai_report_id": actual_report_id,
                    "session_start": datetime.now(pytz.utc).isoformat()
                }).execute()
            except Exception as e:
                logger.error(f"Error saving conversation session: {str(e)}")
        
        logger.info(f"Started Letta conversation {conversation_id} for user {user_id} with {'Fetch AI report' if fetch_ai_report else 'no report'}")
        return context
    
    async def generate_response(
        self, 
        context: ConversationContext, 
        user_message: str
    ) -> LettaResponse:
        """Generate Letta's conversational response"""
        
        # Add user message to conversation history
        context.conversation_history.append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Save user message to database
        if self.supabase:
            try:
                self.supabase.table('letta_messages').insert({
                    "conversation_id": context.conversation_id,
                    "user_id": context.user_id,
                    "role": "user",
                    "content": user_message,
                    "timestamp": datetime.now().isoformat()
                }).execute()
            except Exception as e:
                logger.error(f"Error saving user message: {str(e)}")
        
        if not self.use_ai:
            response = await self._generate_mock_response(context, user_message)
        else:
            try:
                response = await self._generate_ai_response(context, user_message)
            except Exception as e:
                logger.error(f"Error generating AI response: {str(e)}")
                response = await self._generate_fallback_response(context, user_message)
        
        # Save Letta's response to database
        if self.supabase:
            try:
                self.supabase.table('letta_messages').insert({
                    "conversation_id": context.conversation_id,
                    "user_id": context.user_id,
                    "role": "assistant",
                    "content": response.message,
                    "metadata": {
                        "suggestions": response.suggestions,
                        "follow_up_questions": response.follow_up_questions,
                        "exercise_recommendations": response.exercise_recommendations,
                        "emotional_tone": response.emotional_tone
                    },
                    "timestamp": datetime.now().isoformat()
                }).execute()
            except Exception as e:
                logger.error(f"Error saving Letta response: {str(e)}")
        
        # Add Letta's response to conversation history
        context.conversation_history.append({
            "role": "assistant",
            "content": response.message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Update user memory based on this interaction
        await self._update_user_memory(context, response)
        
        return response
    
    async def _generate_ai_response(self, context: ConversationContext, user_message: str) -> LettaResponse:
        """Generate response using Letta AI client (proper SDK approach)"""
        if not self.letta_client:
            raise Exception("Letta client not initialized")
        
        try:
            # Build enhanced prompt with vocal context
            enhanced_message = user_message
            
            # If this is the first message in the conversation, include context and starter
            if len(context.conversation_history) == 0:
                # Include vocal context and conversation starter
                context_prompt = context.vocal_context
                starter_message = context.conversation_starter
                
                enhanced_message = f"""Context: {context_prompt}

{starter_message}

User: {user_message}"""
            else:
                # For subsequent messages, include relevant vocal context
                if context.vocal_context:
                    enhanced_message = f"""Context: {context.vocal_context}

User: {user_message}"""
            
            # CRITICAL: Letta agents are STATEFUL - only send the NEW user message, not conversation history
            response = self.letta_client.agents.messages.create(
                agent_id=self.letta_agent_id,
                messages=[{"role": "user", "content": enhanced_message}]
            )
            
            # Extract the agent's response from the messages
            assistant_message = ""
            tool_calls = []
            
            for msg in response.messages:
                if msg.message_type == "assistant_message":
                    assistant_message = msg.content
                elif msg.message_type == "reasoning_message":
                    logger.info(f"Agent reasoning: {msg.reasoning}")
                elif msg.message_type == "tool_call_message":
                    tool_calls.append({
                        "name": msg.tool_call.name,
                        "arguments": msg.tool_call.arguments
                    })
                elif msg.message_type == "tool_return_message":
                    logger.info(f"Tool return: {msg.tool_return}")
            
            # If no assistant message, use a fallback
            if not assistant_message:
                assistant_message = "I'm here to help with your vocal training. What would you like to work on today?"
            
            # Generate suggestions and recommendations based on vocal context
            suggestions = self._generate_suggestions(context)
            follow_up_questions = self._generate_follow_up_questions(context)
            exercise_recommendations = self._generate_exercise_recommendations(context)
            
            return LettaResponse(
                message=assistant_message,
                suggestions=suggestions,
                follow_up_questions=follow_up_questions,
                exercise_recommendations=exercise_recommendations,
                emotional_tone="supportive",
                memory_updates={}
            )
            
        except Exception as e:
            logger.error(f"Letta API error: {str(e)}")
            raise Exception(f"Letta API error: {str(e)}")
    
    def _generate_suggestions(self, context: ConversationContext) -> List[str]:
        """Generate contextual suggestions based on vocal analysis"""
        suggestions = []
        
        if not context.fetch_ai_report:
            suggestions.extend([
                "Try recording your first vocal session to get personalized feedback",
                "Start with simple breathing exercises to build foundation",
                "Set a daily practice goal of 10-15 minutes"
            ])
            return suggestions
        
        insights = self._extract_vocal_insights(context.fetch_ai_report)
        practice_sessions = insights.get("practice_sessions", 0)
        
        if practice_sessions == 0:
            suggestions.extend([
                "Start with a 5-minute vocal warm-up session",
                "Try humming exercises to explore your vocal range",
                "Record your voice to track progress over time"
            ])
        elif practice_sessions < 3:
            suggestions.extend([
                "Add one more short practice session today",
                "Focus on the exercises that felt most comfortable",
                "Try practicing at your best time of day"
            ])
        else:
            suggestions.extend([
                "Great consistency! Try a more challenging exercise",
                "Review your progress metrics to identify areas for improvement",
                "Consider longer practice sessions for deeper development"
            ])
        
        # Add metric-specific suggestions
        trends = insights.get("trends", {})
        for metric_name, trend_data in trends.items():
            if trend_data["direction"] == "improving":
                suggestions.append(f"Keep focusing on {metric_name} - your improvement is working!")
            else:
                suggestions.append(f"Try specific exercises to improve your {metric_name}")
        
        return suggestions[:3]  # Limit to top 3 suggestions
    
    def _generate_follow_up_questions(self, context: ConversationContext) -> List[str]:
        """Generate follow-up questions based on vocal context"""
        questions = []
        
        if not context.fetch_ai_report:
            questions.extend([
                "What type of music do you enjoy singing?",
                "Do you have any specific vocal goals?",
                "What's your experience level with vocal training?"
            ])
            return questions
        
        insights = self._extract_vocal_insights(context.fetch_ai_report)
        practice_sessions = insights.get("practice_sessions", 0)
        
        if practice_sessions == 0:
            questions.extend([
                "What's preventing you from starting your vocal practice today?",
                "What type of vocal exercises interest you most?",
                "How much time can you dedicate to daily practice?"
            ])
        else:
            questions.extend([
                "How did today's practice sessions feel compared to previous days?",
                "Which exercises felt most challenging or rewarding?",
                "What specific aspect of your voice would you like to improve?"
            ])
        
        # Add trend-based questions
        trends = insights.get("trends", {})
        for metric_name, trend_data in trends.items():
            if trend_data["direction"] == "improving":
                questions.append(f"What do you think contributed to your {metric_name} improvement?")
            else:
                questions.append(f"What challenges are you facing with your {metric_name}?")
        
        return questions[:3]  # Limit to top 3 questions
    
    def _generate_exercise_recommendations(self, context: ConversationContext) -> List[str]:
        """Generate exercise recommendations based on vocal analysis"""
        exercises = []
        
        if not context.fetch_ai_report:
            exercises.extend([
                "Basic breathing exercises (5 minutes)",
                "Simple humming warm-ups (3 minutes)",
                "Vocal range exploration (5 minutes)"
            ])
            return exercises
        
        insights = self._extract_vocal_insights(context.fetch_ai_report)
        metrics = insights.get("metrics", {})
        
        # Recommend exercises based on specific metrics
        if "jitter" in metrics and metrics["jitter"].get("current", 0) > 0.015:
            exercises.append("Lip trills and sirens to reduce vocal jitter")
        
        if "shimmer" in metrics and metrics["shimmer"].get("current", 0) > 0.03:
            exercises.append("Sustained vowel exercises to improve vocal stability")
        
        if "vibrato_rate" in metrics and metrics["vibrato_rate"].get("current", 0) < 4.0:
            exercises.append("Vibrato development exercises with sustained notes")
        
        # Add general recommendations
        exercises.extend([
            "Vocal warm-up routine (10 minutes)",
            "Pitch matching exercises (5 minutes)",
            "Dynamic control practice (5 minutes)"
        ])
        
        return exercises[:3]  # Limit to top 3 exercises
    
    async def _update_user_memory(self, context: ConversationContext, response: LettaResponse):
        """Update user's memory profile based on conversation"""
        if not self.supabase:
            return
        
        try:
            updates = {
                "updated_at": datetime.now().isoformat(),
                "conversation_count": context.user_memory.conversation_count + 1,
                "last_conversation": datetime.now().isoformat()
            }
            
            # Add new issues if any
            if response.memory_updates.get("new_issues"):
                updates["common_issues"] = context.user_memory.common_issues + response.memory_updates["new_issues"]
            
            # Add new exercises if any
            if response.memory_updates.get("new_exercises"):
                updates["successful_exercises"] = context.user_memory.successful_exercises + response.memory_updates["new_exercises"]
            
            # Update personality insights
            if response.memory_updates.get("personality_insights"):
                current_personality = context.user_memory.vocal_personality.copy()
                current_personality.update(response.memory_updates["personality_insights"])
                updates["vocal_personality"] = current_personality
            
            # Save to database
            self.supabase.table('letta_user_memory').update(updates).eq(
                'user_id', context.user_id
            ).execute()
            
            logger.info(f"Updated memory for user {context.user_id}")
            
        except Exception as e:
            logger.error(f"Error updating user memory: {str(e)}")
    
    def _get_vocal_history_summary(self, user_id: str) -> str:
        """Get summary of user's vocal history for context"""
        if not self.supabase:
            return "Mock vocal history: Consistent practice over 30 days, improving pitch stability"
        
        try:
            # Get last 30 days of vocal data
            thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
            
            response = self.supabase.table('vocal_analysis_history').select('*').eq(
                'user_id', user_id
            ).gte('created_at', f"{thirty_days_ago}T00:00:00").execute()
            
            if not response.data:
                return "No recent vocal history available"
            
            # Analyze patterns
            sessions = response.data
            total_sessions = len(sessions)
            avg_pitch = sum(s.get('mean_pitch', 0) for s in sessions) / total_sessions if total_sessions > 0 else 0
            
            return f"Last 30 days: {total_sessions} sessions, average pitch: {avg_pitch:.2f}Hz"
            
        except Exception as e:
            logger.error(f"Error getting vocal history: {str(e)}")
            return "Vocal history unavailable"
    
    async def _generate_mock_response(self, context: ConversationContext, user_message: str) -> LettaResponse:
        """Generate mock response when AI is not available"""
        
        # Use the conversation starter for the first message
        if len(context.conversation_history) == 0:
            message = context.conversation_starter
        else:
            # Generate contextual mock responses
            message = self._generate_contextual_mock_response(context, user_message)
        
        # Generate contextual suggestions and recommendations
        suggestions = self._generate_suggestions(context)
        follow_up_questions = self._generate_follow_up_questions(context)
        exercise_recommendations = self._generate_exercise_recommendations(context)
        
        return LettaResponse(
            message=message,
            suggestions=suggestions,
            follow_up_questions=follow_up_questions,
            exercise_recommendations=exercise_recommendations,
            emotional_tone="supportive",
            memory_updates={}
        )
    
    def _generate_contextual_mock_response(self, context: ConversationContext, user_message: str) -> str:
        """Generate contextual mock responses based on vocal analysis"""
        user_message_lower = user_message.lower()
        
        # Check for common vocal-related keywords
        if any(word in user_message_lower for word in ["pitch", "tune", "note"]):
            return "I can help you with pitch accuracy! Try practicing with a piano or pitch app to develop your ear. Your current pitch stability looks good - keep working on those sustained notes."
        
        if any(word in user_message_lower for word in ["breath", "breathing", "air"]):
            return "Breathing is the foundation of great singing! Focus on diaphragmatic breathing. Try this: place your hands on your ribs and feel them expand as you inhale deeply."
        
        if any(word in user_message_lower for word in ["range", "high", "low", "octave"]):
            return "Vocal range development takes time and patience. Don't push too hard - work within your comfortable range and gradually expand. Your current range shows good potential!"
        
        if any(word in user_message_lower for word in ["practice", "session", "exercise"]):
            if context.fetch_ai_report:
                insights = self._extract_vocal_insights(context.fetch_ai_report)
                sessions = insights.get("practice_sessions", 0)
                if sessions > 0:
                    return f"Great job with your {sessions} practice sessions today! Consistency is key. What specific aspect would you like to focus on in your next session?"
                else:
                    return "I'd love to see you start practicing today! Even 10 minutes of focused vocal work can make a big difference. What's holding you back?"
            else:
                return "Practice is essential for vocal development! Start with short, focused sessions and gradually increase duration. What type of exercises interest you most?"
        
        if any(word in user_message_lower for word in ["problem", "issue", "trouble", "difficult"]):
            return "Every vocalist faces challenges - it's part of the journey! Let's identify what's specifically challenging you and work on targeted solutions. What feels most difficult right now?"
        
        if any(word in user_message_lower for word in ["improve", "better", "progress"]):
            if context.fetch_ai_report:
                insights = self._extract_vocal_insights(context.fetch_ai_report)
                trends = insights.get("trends", {})
                if trends:
                    trend_metric = list(trends.keys())[0]
                    trend_data = trends[trend_metric]
                    if trend_data["direction"] == "improving":
                        return f"Excellent! I can see your {trend_metric} is improving by {trend_data['percentage']:.1f}%. Keep up the great work with your current practice routine!"
                    else:
                        return f"I notice your {trend_metric} could use some attention. Let's focus on specific exercises to strengthen that area. What exercises have you found most helpful?"
                else:
                    return "I can see you're making progress! Keep practicing consistently and you'll continue to improve. What specific goal are you working toward?"
            else:
                return "Improvement comes with consistent practice and patience. Set small, achievable goals and celebrate your progress. What would you like to improve most?"
        
        # Default response
        return "I'm here to support your vocal journey! Whether you're working on technique, range, or confidence, I can provide personalized guidance. What would you like to focus on today?"
    
    async def _generate_fallback_response(self, context: ConversationContext, user_message: str) -> LettaResponse:
        """Generate fallback response on error"""
        return LettaResponse(
            message="It seems I'm having a little trouble connecting to my core memory right now, but I'm still here to help! Based on what I know, consistent practice is key. How about we try some lip trills?",
            suggestions=["Check if the LETTA_API_KEY is configured correctly in the environment.", "Try asking a simpler question."],
            follow_up_questions=["How are you feeling about your practice today?"],
            exercise_recommendations=["5-minute lip trills"],
            emotional_tone="empathetic",
            memory_updates={}
        )
    
    def _get_fallback_memory(self, user_id: str) -> UserMemory:
        """Get fallback memory when database is unavailable"""
        return UserMemory(
            user_id=user_id,
            vocal_personality={"prefers_detailed_feedback": True},
            common_issues=[],
            successful_exercises=[],
            progress_patterns={},
            last_conversation=None,
            conversation_count=0,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

# Global Letta service instance
letta_coach = LettaVocalCoach() 