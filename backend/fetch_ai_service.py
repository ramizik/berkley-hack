"""
Fetch AI service for generating vocal analysis reports
"""
import os
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import asyncio
from dataclasses import dataclass
import json
import statistics
from enum import Enum
import requests
import uuid

# Supabase client for database access
from supabase import create_client, Client

logger = logging.getLogger(__name__)

class TrendDirection(Enum):
    UP = "up"
    DOWN = "down"
    STABLE = "baseline"

@dataclass
class SessionMetrics:
    """Data class for a single session's metrics"""
    timestamp: datetime
    mean_pitch: float
    vibrato_rate: float
    jitter: float
    shimmer: float
    dynamics: str
    voice_type: str
    lowest_note: str
    highest_note: str

@dataclass
class DailyMetrics:
    """Data class for aggregated daily metrics"""
    date: str
    session_count: int
    mean_pitch_avg: float
    vibrato_rate_avg: float
    jitter_avg: float
    shimmer_avg: float
    dynamics_mode: str
    voice_type_mode: str
    lowest_note: str  # lowest across all sessions
    highest_note: str  # highest across all sessions
    pitch_stability: float  # standard deviation of mean_pitch
    practice_consistency: float  # time spread of sessions

@dataclass
class MetricComparison:
    """Data class for metric comparison"""
    current: float
    previous: Optional[float]
    change: Optional[float]
    trend: str  # 'up', 'down', 'baseline'
    improvement_percentage: Optional[float]

@dataclass
class FetchAiReport:
    """Data class for Fetch AI report"""
    date: str
    id: str
    summary: str
    metrics: Dict[str, MetricComparison]
    insights: List[str]
    recommendations: List[str]
    practice_sessions: int
    total_practice_time: float  # in minutes
    best_time_of_day: str

class FetchAiVocalCoach:
    """Fetch AI vocal coaching service with ASI-1 integration"""
    
    def __init__(self):
        # Initialize Supabase client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            logger.warning("Supabase credentials not found. Using mock data.")
            self.supabase: Optional[Client] = None
        else:
            self.supabase = create_client(supabase_url, supabase_key)
            logger.info("Supabase client initialized successfully")
        
        # Initialize Fetch AI ASI-1 client
        self.asi1_api_key = os.getenv("ASI_1_API_KEY")
        self.asi1_url = "https://api.asi1.ai/v1/chat/completions"
        
        if not self.asi1_api_key:
            logger.warning("ASI-1 API key not found. Using mock AI responses.")
            self.use_ai = False
        else:
            self.use_ai = True
            logger.info("ASI-1 API initialized successfully")
    
    async def _get_ai_insights(self, metrics_data: str, user_context: str) -> Tuple[List[str], List[str]]:
        """Get AI-powered insights using Fetch AI's ASI-1"""
        if not self.use_ai:
            # Return mock insights
            return [
                "Your pitch stability has improved by 15% this week!",
                "Consider practicing in the morning for better vocal clarity.",
                "Your vibrato rate is within optimal range for your voice type."
            ], [
                "Try vocal warm-ups before each practice session.",
                "Focus on breath control exercises for better dynamics.",
                "Practice scales in your comfortable range daily."
            ]
        
        try:
            prompt = f"""
            As a professional vocal coach, analyze this vocal performance data and provide:
            
            VOCAL DATA:
            {metrics_data}
            
            USER CONTEXT:
            {user_context}
            
            Please provide:
            1. 3 specific, actionable insights based on the trend data (e.g., "Your jitter improved by 15%, indicating better vocal fold stability.")
            2. 3 personalized recommendations for improvement (e.g., "To address the slight increase in shimmer, try exercises focusing on consistent breath support.")
            
            Format the output as a clean JSON object with two keys: "insights" and "recommendations".
            
            Example:
            {{
                "insights": ["Your pitch accuracy has improved, especially on higher notes.", "Your practice consistency is excellent.", "Vibrato rate is stable and healthy."],
                "recommendations": ["Continue with daily scale exercises.", "Focus on diaphragmatic breathing to support longer phrases.", "Incorporate messa di voce exercises to control dynamics."]
            }}
            """
            
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': f'bearer {self.asi1_api_key}'
            }
            
            payload = {
                "model": "asi1-mini",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.7,
                "stream": False,
                "max_tokens": 500
            }
            
            response = requests.post(self.asi1_url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Try to parse JSON response from the AI content
                try:
                    # The response might be wrapped in markdown ```json ... ```
                    if '```json' in content:
                        content = content.split('```json')[1].split('```')[0].strip()
                    
                    ai_data = json.loads(content)
                    insights = ai_data.get("insights", [])
                    recommendations = ai_data.get("recommendations", [])
                    
                    # Basic validation
                    if isinstance(insights, list) and isinstance(recommendations, list):
                        return insights, recommendations
                    else:
                        logger.warning("AI response format is incorrect, falling back.")
                        return self._get_fallback_insights()

                except (json.JSONDecodeError, IndexError) as e:
                    logger.error(f"Failed to parse AI JSON response: {e}. Content was: {content}")
                    # Fallback: attempt to extract from text if parsing fails
                    lines = content.split('\n')
                    insights = [line.strip() for line in lines if 'insight' in line.lower()]
                    recommendations = [line.strip() for line in lines if 'recommend' in line.lower()]
                    if insights or recommendations:
                        return insights[:3], recommendations[:3]
                    return self._get_fallback_insights()
            else:
                logger.error(f"ASI-1 API error: {response.status_code}")
                return self._get_fallback_insights()
                
        except Exception as e:
            logger.error(f"Error getting AI insights: {str(e)}")
            return self._get_fallback_insights()
    
    def _get_fallback_insights(self) -> Tuple[List[str], List[str]]:
        """Fallback insights when AI is unavailable"""
        return [
            "Your vocal practice shows consistent improvement patterns.",
            "Maintaining regular practice sessions will enhance your progress.",
            "Your pitch accuracy is developing well with continued practice."
        ], [
            "Continue with daily vocal warm-ups for 10-15 minutes.",
            "Practice breathing exercises to improve vocal control.",
            "Record yourself regularly to track your progress."
        ]
    
    async def _get_daily_sessions(self, user_id: str, date: str) -> List[SessionMetrics]:
        """Get all practice sessions for a specific day"""
        if not self.supabase:
            # Return mock data for demo
            return [
                SessionMetrics(
                    timestamp=datetime.now(),
                    mean_pitch=220.5,
                    vibrato_rate=5.8,
                    jitter=0.012,
                    shimmer=0.017,
                    dynamics="stable",
                    voice_type="tenor",
                    lowest_note="C3",
                    highest_note="A4"
                ),
                SessionMetrics(
                    timestamp=datetime.now() - timedelta(hours=2),
                    mean_pitch=225.1,
                    vibrato_rate=6.2,
                    jitter=0.011,
                    shimmer=0.016,
                    dynamics="stable",
                    voice_type="tenor",
                    lowest_note="D3",
                    highest_note="B4"
                )
            ]
            
        try:
            # Query for all sessions in the given day
            start_date = f"{date}T00:00:00"
            end_date = f"{date}T23:59:59"
            
            response = self.supabase.table('vocal_analysis_history').select('*').eq(
                'user_id', user_id
            ).gte('created_at', start_date).lte('created_at', end_date).execute()
            
            if not response.data:
                return []
                
            return [
                SessionMetrics(
                    timestamp=datetime.fromisoformat(session['created_at'].replace('Z', '+00:00')),
                    mean_pitch=session.get('mean_pitch', 0),
                    vibrato_rate=session.get('vibrato_rate', 0),
                    jitter=session.get('jitter', 0),
                    shimmer=session.get('shimmer', 0),
                    dynamics=session.get('dynamics', 'stable'),
                    voice_type=session.get('voice_type', 'unknown'),
                    lowest_note=session.get('lowest_note', 'C3'),
                    highest_note=session.get('highest_note', 'C5')
                )
                for session in response.data
            ]
        except Exception as e:
            logger.error(f"Error fetching daily sessions: {str(e)}")
            return []

    def _aggregate_daily_metrics(self, sessions: List[SessionMetrics]) -> Optional[DailyMetrics]:
        """Aggregate metrics from multiple sessions into daily metrics"""
        if not sessions:
            return None
            
        # Basic aggregations
        mean_pitches = [s.mean_pitch for s in sessions]
        vibrato_rates = [s.vibrato_rate for s in sessions]
        jitters = [s.jitter for s in sessions]
        shimmers = [s.shimmer for s in sessions]
        
        # Get mode for categorical data
        dynamics = max(set(s.dynamics for s in sessions), 
                      key=lambda x: sum(1 for s in sessions if s.dynamics == x))
        voice_type = max(set(s.voice_type for s in sessions), 
                        key=lambda x: sum(1 for s in sessions if s.voice_type == x))
        
        # Find vocal range
        lowest_note = min(sessions, key=lambda x: self._note_to_frequency(x.lowest_note)).lowest_note
        highest_note = max(sessions, key=lambda x: self._note_to_frequency(x.highest_note)).highest_note
        
        # Calculate practice consistency (time spread)
        timestamps = [s.timestamp for s in sessions]
        time_spread = (max(timestamps) - min(timestamps)).total_seconds() / 3600  # in hours
        
        return DailyMetrics(
            date=sessions[0].timestamp.strftime("%Y-%m-%d"),
            session_count=len(sessions),
            mean_pitch_avg=statistics.mean(mean_pitches),
            vibrato_rate_avg=statistics.mean(vibrato_rates),
            jitter_avg=statistics.mean(jitters),
            shimmer_avg=statistics.mean(shimmers),
            dynamics_mode=dynamics,
            voice_type_mode=voice_type,
            lowest_note=lowest_note,
            highest_note=highest_note,
            pitch_stability=statistics.stdev(mean_pitches) if len(mean_pitches) > 1 else 0,
            practice_consistency=time_spread
        )

    def _calculate_improvement(self, current: float, previous: float) -> Tuple[float, str]:
        # Simple improvement calculation
        # This can be made more sophisticated later
        change = current - previous
        if change > 0:
            return change, TrendDirection.UP.value
        elif change < 0:
            return change, TrendDirection.DOWN.value
        else:
            return 0.0, TrendDirection.STABLE.value

    def _compare_metrics(self, current_day_metrics: Optional[DailyMetrics], previous_day_metrics: Optional[DailyMetrics]) -> Dict[str, MetricComparison]:
        """Compare metrics between two days"""
        comparisons: Dict[str, MetricComparison] = {}
        
        metric_keys = ["mean_pitch_avg", "vibrato_rate_avg", "jitter_avg", "shimmer_avg"]
        
        for key in metric_keys:
            current_val = getattr(current_day_metrics, key, None) if current_day_metrics else None
            previous_val = getattr(previous_day_metrics, key, None) if previous_day_metrics else None
            
            if current_val is not None:
                change = None
                trend = TrendDirection.STABLE.value
                improvement_percentage = 0.0
                
                if previous_val is not None and previous_val != 0:
                    change = current_val - previous_val
                    
                    # Trend direction depends on the metric
                    if key in ["jitter_avg", "shimmer_avg"]: # Lower is better
                        trend = TrendDirection.DOWN.value if change < 0 else TrendDirection.UP.value
                    else: # Higher is better for pitch, vibrato
                        trend = TrendDirection.UP.value if change > 0 else TrendDirection.DOWN.value
                    
                    if change == 0:
                        trend = TrendDirection.STABLE.value
                        
                    improvement_percentage = (change / previous_val) * 100
                
                comparisons[key.replace('_avg', '')] = MetricComparison(
                    current=current_val,
                    previous=previous_val,
                    change=change,
                    trend=trend,
                    improvement_percentage=improvement_percentage
                )

        # Handle session count separately
        current_sessions = current_day_metrics.session_count if current_day_metrics else 0
        previous_sessions = previous_day_metrics.session_count if previous_day_metrics else 0
        session_change = current_sessions - previous_sessions
        
        comparisons["total_sessions"] = MetricComparison(
            current=current_sessions,
            previous=previous_sessions,
            change=session_change,
            trend=TrendDirection.UP.value if session_change > 0 else TrendDirection.DOWN.value if session_change < 0 else TrendDirection.STABLE.value,
            improvement_percentage=(session_change / previous_sessions * 100) if previous_sessions > 0 else 0
        )
        
        return comparisons

    async def generate_daily_report(self, user_id: str, date: str) -> FetchAiReport:
        """Generate a daily vocal analysis report with trends"""
        try:
            current_date_obj = datetime.strptime(date, "%Y-%m-%d")
            previous_date_obj = current_date_obj - timedelta(days=1)
            previous_date_str = previous_date_obj.strftime("%Y-%m-%d")

            # Get sessions for current and previous day
            current_day_sessions = await self._get_daily_sessions(user_id, date)
            previous_day_sessions = await self._get_daily_sessions(user_id, previous_date_str)

            if not current_day_sessions:
                logger.info(f"No sessions found for user {user_id} on {date}")
                return self._generate_fallback_report(user_id, date)

            # Aggregate metrics for both days
            current_day_metrics = self._aggregate_daily_metrics(current_day_sessions)
            previous_day_metrics = self._aggregate_daily_metrics(previous_day_sessions)
            
            # Compare metrics
            compared_metrics = self._compare_metrics(current_day_metrics, previous_day_metrics)
            
            # Generate summary and AI insights
            summary = self._generate_summary(current_day_metrics, previous_day_metrics)
            
            # Prepare data for AI
            prompt_data = {
                "current_day_summary": current_day_metrics.__dict__ if current_day_metrics else {},
                "previous_day_summary": previous_day_metrics.__dict__ if previous_day_metrics else {},
                "comparisons": {k: v.__dict__ for k, v in compared_metrics.items()}
            }
            
            insights, recommendations = await self._get_ai_insights(json.dumps(prompt_data, indent=2), "User is focused on improving overall vocal quality.")
            
            # Calculate total practice time
            total_practice_time = sum(15 for _ in current_day_sessions) # Placeholder: 15 mins per session

            # Determine best time of day for practice
            best_time_of_day = "Morning (9-11 AM)" # Placeholder logic

            return FetchAiReport(
                date=date,
                id=f"report_{user_id}_{date}",
                summary=summary,
                metrics=compared_metrics,
                insights=insights,
                recommendations=recommendations,
                practice_sessions=len(current_day_sessions),
                total_practice_time=total_practice_time,
                best_time_of_day=best_time_of_day
            )

        except Exception as e:
            logger.error(f"Error generating daily report for user {user_id}: {str(e)}")
            return self._generate_fallback_report(user_id, date)

    def _calculate_note_range(self, lowest: str, highest: str) -> float:
        """Calculate the range between two notes in semitones"""
        lowest_freq = self._note_to_frequency(lowest)
        highest_freq = self._note_to_frequency(highest)
        return 12 * (highest_freq / lowest_freq) if lowest_freq > 0 else 0

    def _note_to_frequency(self, note: str) -> float:
        """Convert note name to frequency"""
        note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        if len(note) < 2:
            return 0
        
        note_name = note[:-1]
        octave = int(note[-1])
        
        if note_name not in note_names:
            return 0
        
        note_index = note_names.index(note_name)
        # A4 = 440 Hz
        return 440 * (2 ** ((note_index - 9) / 12 + (octave - 4)))

    def _generate_summary(self, current: DailyMetrics, previous: Optional[DailyMetrics]) -> str:
        """Generate a summary of the daily performance"""
        if previous:
            if current.session_count > previous.session_count:
                return f"Excellent progress today! You completed {current.session_count} practice sessions, showing increased dedication to your vocal development."
            elif current.session_count == previous.session_count:
                return f"Consistent practice maintained with {current.session_count} sessions today. Your vocal technique continues to develop steadily."
            else:
                return f"Completed {current.session_count} practice sessions today. Consider increasing practice frequency for optimal progress."
        else:
            return f"Great start! You completed {current.session_count} practice sessions today. Keep up the momentum!"

    def _generate_fallback_report(self, user_id: str, date: str) -> FetchAiReport:
        """Generate a fallback report when no sessions are found"""
        return FetchAiReport(
            date=date,
            id=f"fallback_{user_id}_{date}",
            summary="No practice sessions recorded for this date. Start practicing to see your vocal analysis!",
            metrics={},
            insights=["Begin with daily vocal warm-ups", "Practice breathing exercises", "Record your sessions to track progress"],
            recommendations=["Start with 10-minute daily sessions", "Focus on proper breathing technique", "Use the practice feature regularly"],
            practice_sessions=0,
            total_practice_time=0,
            best_time_of_day="Morning"
        )

# The global instance is removed from here to prevent instantiation at import time.
# It will be created in main.py during the application startup. 