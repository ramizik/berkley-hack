"""
Lesson Feedback Service
Handles storage and retrieval of lesson completion data for VAPI AI context
"""
import os
import logging
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass, asdict
import pytz

# Supabase client for database access
from supabase import create_client, Client

logger = logging.getLogger(__name__)

@dataclass
class LessonFeedback:
    """Data class for lesson feedback"""
    user_id: str
    lesson_id: str
    lesson_title: str
    lesson_category: str
    lesson_level: str
    session_time: int  # in seconds
    recording_duration: int  # in seconds
    voice_analysis: Dict[str, Any]  # full analysis results
    ai_feedback: str
    voice_metrics: Dict[str, Any]  # structured metrics
    timestamp: datetime
    date: str  # YYYY-MM-DD format

@dataclass
class VapiLessonContext:
    """Data class for VAPI lesson context"""
    lesson_title: str
    lesson_category: str
    lesson_level: str
    session_duration: str
    recording_duration: str
    voice_type: str
    mean_pitch: float
    vocal_range: str
    voice_metrics: Dict[str, Any]
    ai_feedback: str
    completion_time: str
    recommendations: List[str]
    performance_insights: Dict[str, Any]
    quality_score: Dict[str, Any]

class LessonFeedbackService:
    """Service for managing lesson feedback data"""
    
    def __init__(self):
        # Initialize Supabase client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            logger.warning("Supabase credentials not found. Lesson feedback service will use mock data.")
            self.supabase: Optional[Client] = None
        else:
            try:
                self.supabase = create_client(supabase_url, supabase_key)
                logger.info("Lesson feedback Supabase client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {str(e)}")
                self.supabase = None
    
    async def store_lesson_feedback(self, feedback_data: Dict[str, Any]) -> bool:
        """Store lesson completion feedback to Supabase"""
        if not self.supabase:
            logger.warning("Supabase not available, cannot store lesson feedback")
            return False
        
        try:
            # Create lesson feedback object
            lesson_feedback = LessonFeedback(
                user_id=feedback_data['user_id'],
                lesson_id=str(feedback_data['lesson']['id']),
                lesson_title=feedback_data['lesson']['title'],
                lesson_category=feedback_data['lesson']['category'],
                lesson_level=feedback_data['lesson']['level'],
                session_time=feedback_data['session_time'],
                recording_duration=feedback_data['recording_duration'],
                voice_analysis=feedback_data['voice_analysis'],
                ai_feedback=feedback_data['ai_feedback'],
                voice_metrics=feedback_data['voice_metrics'],
                timestamp=datetime.now(pytz.utc),
                date=datetime.now(pytz.utc).strftime("%Y-%m-%d")
            )
            
            # Convert to dict for storage
            feedback_dict = asdict(lesson_feedback)
            feedback_dict['timestamp'] = feedback_dict['timestamp'].isoformat()
            
            # Store in Supabase
            response = self.supabase.table('lesson_feedback').insert(feedback_dict).execute()
            
            if response.data:
                logger.info(f"Successfully stored lesson feedback for user {feedback_data['user_id']}")
                return True
            else:
                logger.error("Failed to store lesson feedback - no data returned")
                return False
                
        except Exception as e:
            logger.error(f"Error storing lesson feedback: {str(e)}")
            return False
    
    async def get_latest_lesson_feedback(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get the most recent lesson feedback for a user"""
        if not self.supabase:
            logger.warning("Supabase not available, returning mock lesson feedback")
            return self._get_mock_lesson_feedback(user_id)
        
        try:
            response = self.supabase.table('lesson_feedback').select('*').eq(
                'user_id', user_id
            ).order('timestamp', desc=True).limit(1).execute()
            
            if response.data:
                logger.info(f"Found latest lesson feedback for user {user_id}")
                return response.data[0]
            
            logger.info(f"No lesson feedback found for user {user_id}")
            return None
            
        except Exception as e:
            logger.error(f"Error fetching latest lesson feedback: {str(e)}")
            return None
    
    async def get_lesson_feedback_by_date(self, user_id: str, date: str) -> Optional[Dict[str, Any]]:
        """Get lesson feedback for a specific date"""
        if not self.supabase:
            return None
        
        try:
            response = self.supabase.table('lesson_feedback').select('*').eq(
                'user_id', user_id
            ).eq('date', date).order('timestamp', desc=True).limit(1).execute()
            
            if response.data:
                logger.info(f"Found lesson feedback for user {user_id} on {date}")
                return response.data[0]
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching lesson feedback by date: {str(e)}")
            return None
    
    async def create_vapi_context(self, user_id: str) -> Optional[VapiLessonContext]:
        """Create VAPI context from latest lesson feedback"""
        lesson_data = await self.get_latest_lesson_feedback(user_id)
        
        if not lesson_data:
            return None
        
        try:
            # Format session and recording duration
            session_duration = self._format_duration(lesson_data['session_time'])
            recording_duration = self._format_duration(lesson_data['recording_duration'])
            
            # Extract voice metrics
            voice_analysis = lesson_data['voice_analysis']
            voice_metrics = lesson_data['voice_metrics']
            
            # Create vocal range string
            vocal_range = f"{voice_analysis.get('lowest_note', 'Unknown')} - {voice_analysis.get('highest_note', 'Unknown')}"
            
            # Extract recommendations from AI feedback
            recommendations = self._extract_recommendations(lesson_data['ai_feedback'])
            
            # Format completion time
            completion_time = datetime.fromisoformat(lesson_data['timestamp'].replace('Z', '+00:00')).strftime("%I:%M %p")
            
            # Generate performance insights
            performance_insights = self._generate_performance_insights(voice_analysis, lesson_data['lesson_category'], lesson_data['lesson_level'])
            
            # Calculate session quality score
            quality_score = self._calculate_session_quality(voice_analysis, lesson_data['session_time'], lesson_data['recording_duration'])
            
            return VapiLessonContext(
                lesson_title=lesson_data['lesson_title'],
                lesson_category=lesson_data['lesson_category'].title(),
                lesson_level=lesson_data['lesson_level'].title(),
                session_duration=session_duration,
                recording_duration=recording_duration,
                voice_type=voice_analysis.get('voice_type', 'Unknown'),
                mean_pitch=voice_analysis.get('mean_pitch', 0),
                vocal_range=vocal_range,
                voice_metrics=voice_metrics,
                ai_feedback=lesson_data['ai_feedback'],
                completion_time=completion_time,
                recommendations=recommendations,
                performance_insights=performance_insights,
                quality_score=quality_score
            )
            
        except Exception as e:
            logger.error(f"Error creating VAPI context: {str(e)}")
            return None
    
    def _format_duration(self, seconds: int) -> str:
        """Format duration in seconds to human readable string"""
        minutes = seconds // 60
        remaining_seconds = seconds % 60
        
        if minutes > 0:
            return f"{minutes}m {remaining_seconds}s"
        else:
            return f"{remaining_seconds}s"
    
    def _extract_recommendations(self, ai_feedback: str) -> List[str]:
        """Extract recommendations from AI feedback text"""
        # Simple extraction - could be enhanced with NLP
        recommendations = []
        
        # Look for common recommendation patterns
        feedback_lower = ai_feedback.lower()
        
        if "breath" in feedback_lower:
            recommendations.append("Focus on breath control exercises")
        if "pitch" in feedback_lower:
            recommendations.append("Practice pitch accuracy with scales")
        if "vibrato" in feedback_lower:
            recommendations.append("Work on vibrato control techniques")
        if "range" in feedback_lower:
            recommendations.append("Gradually expand your vocal range")
        
        # Default recommendations if none found
        if not recommendations:
            recommendations = [
                "Continue regular practice sessions",
                "Focus on proper breathing technique",
                "Record yourself to track progress"
            ]
        
        return recommendations[:3]  # Limit to 3 recommendations
    
    def _generate_performance_insights(self, voice_analysis: Dict[str, Any], category: str, level: str) -> Dict[str, Any]:
        """Generate detailed performance insights for coaching"""
        insights = {
            "strengths": [],
            "areas_for_improvement": [],
            "technical_notes": [],
            "next_steps": []
        }
        
        mean_pitch = voice_analysis.get('mean_pitch', 0)
        vibrato_rate = voice_analysis.get('vibrato_rate', 0)
        jitter = voice_analysis.get('jitter', 0)
        shimmer = voice_analysis.get('shimmer', 0)
        
        # Analyze based on lesson category
        if category == 'pitch':
            if jitter < 0.02:
                insights["strengths"].append("Excellent pitch stability")
            else:
                insights["areas_for_improvement"].append("Work on pitch consistency")
                
            insights["technical_notes"].append(f"Jitter measurement: {jitter:.3f}")
            
        elif category == 'breath':
            if shimmer < 0.03:
                insights["strengths"].append("Good breath support")
            else:
                insights["areas_for_improvement"].append("Focus on steady airflow")
                
            insights["technical_notes"].append(f"Shimmer measurement: {shimmer:.3f}")
            
        elif category == 'tone':
            if 0 < vibrato_rate < 8:
                insights["strengths"].append("Natural vibrato control")
            elif vibrato_rate == 0:
                insights["areas_for_improvement"].append("Develop natural vibrato")
            else:
                insights["areas_for_improvement"].append("Refine vibrato control")
                
        # Level-specific recommendations
        if level == 'beginner':
            insights["next_steps"].extend([
                "Continue with fundamental exercises",
                "Focus on building muscle memory",
                "Practice daily for consistency"
            ])
        elif level == 'intermediate':
            insights["next_steps"].extend([
                "Work on advanced techniques",
                "Explore different vocal styles",
                "Record yourself regularly for self-assessment"
            ])
        else:  # advanced
            insights["next_steps"].extend([
                "Refine artistic expression",
                "Work on performance dynamics",
                "Consider teaching or mentoring others"
            ])
            
        return insights
    
    def _calculate_session_quality(self, voice_analysis: Dict[str, Any], session_time: int, recording_time: int) -> Dict[str, Any]:
        """Calculate a quality score for the session"""
        score = 0
        max_score = 100
        factors = []
        
        # Session duration factor (optimal: 10-20 minutes)
        if 600 <= session_time <= 1200:  # 10-20 minutes
            score += 25
            factors.append("Optimal session length")
        elif session_time < 600:
            score += 15
            factors.append("Short but focused session")
        else:
            score += 20
            factors.append("Extended practice session")
            
        # Recording quality factor
        if recording_time >= 30:  # At least 30 seconds
            score += 25
            factors.append("Adequate recording sample")
        else:
            score += 15
            factors.append("Brief recording sample")
            
        # Voice stability factors
        jitter = voice_analysis.get('jitter', 1)
        shimmer = voice_analysis.get('shimmer', 1)
        
        if jitter < 0.02:
            score += 25
            factors.append("Excellent pitch stability")
        elif jitter < 0.05:
            score += 20
            factors.append("Good pitch control")
        else:
            score += 10
            factors.append("Developing pitch control")
            
        if shimmer < 0.03:
            score += 25
            factors.append("Strong breath support")
        elif shimmer < 0.06:
            score += 20
            factors.append("Developing breath control")
        else:
            score += 10
            factors.append("Focus needed on breath support")
            
        # Determine overall rating
        if score >= 90:
            rating = "Excellent"
        elif score >= 75:
            rating = "Very Good"
        elif score >= 60:
            rating = "Good"
        elif score >= 45:
            rating = "Fair"
        else:
            rating = "Needs Improvement"
            
        return {
            "score": score,
            "rating": rating,
            "factors": factors,
            "max_score": max_score
        }
    
    def _get_mock_lesson_feedback(self, user_id: str) -> Dict[str, Any]:
        """Return mock lesson feedback for testing"""
        return {
            "user_id": user_id,
            "lesson_id": "1",
            "lesson_title": "Breath Control Fundamentals",
            "lesson_category": "breath",
            "lesson_level": "beginner",
            "session_time": 900,  # 15 minutes
            "recording_duration": 45,
            "voice_analysis": {
                "voice_type": "tenor",
                "mean_pitch": 220.5,
                "lowest_note": "C3",
                "highest_note": "A4",
                "vibrato_rate": 5.8,
                "jitter": 0.012,
                "shimmer": 0.017
            },
            "ai_feedback": "Great work on your breath control! Your pitch stability has improved, and your vibrato is well-controlled. Focus on maintaining consistent breath support for longer phrases.",
            "voice_metrics": {
                "voiceType": "tenor",
                "meanPitch": 220.5,
                "lowestNote": "C3",
                "highestNote": "A4",
                "vibratoRate": 5.8,
                "jitter": 0.012,
                "shimmer": 0.017
            },
            "timestamp": datetime.now(pytz.utc).isoformat(),
            "date": datetime.now(pytz.utc).strftime("%Y-%m-%d")
        }

# Global instance
lesson_feedback_service = LessonFeedbackService() 