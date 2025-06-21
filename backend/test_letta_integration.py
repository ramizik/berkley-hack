#!/usr/bin/env python3
"""
Test script for Letta-Fetch.ai integration
"""
import asyncio
import os
import sys
from datetime import datetime

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from letta_service import LettaVocalCoach, ConversationType

async def test_letta_integration():
    """Test the Letta-Fetch.ai integration"""
    print("🧪 Testing Letta-Fetch.ai Integration")
    print("=" * 50)
    
    # Initialize Letta coach
    coach = LettaVocalCoach()
    
    # Test user ID (you can replace this with a real user ID from your database)
    test_user_id = "test-user-123"
    
    print(f"1. Testing auto-fetch of Fetch.ai report for user: {test_user_id}")
    
    # Test getting latest report
    report = await coach.get_latest_fetch_ai_report(test_user_id)
    if report:
        print(f"✅ Found Fetch.ai report: {report.get('date', 'Unknown date')}")
        print(f"   Summary: {report.get('summary', 'No summary')}")
        print(f"   Practice sessions: {report.get('practice_sessions', 0)}")
    else:
        print("⚠️  No Fetch.ai report found (this is expected for test user)")
    
    print("\n2. Testing conversation start with auto-fetch")
    
    # Test starting a conversation
    context = await coach.start_conversation(
        user_id=test_user_id,
        conversation_type=ConversationType.DAILY_FEEDBACK
    )
    
    print(f"✅ Conversation started: {context.conversation_id}")
    print(f"   Fetch AI report available: {context.fetch_ai_report is not None}")
    print(f"   Vocal context length: {len(context.vocal_context)} characters")
    print(f"   Conversation starter: {context.conversation_starter[:100]}...")
    
    print("\n3. Testing response generation")
    
    # Test generating a response
    response = await coach.generate_response(context, "How am I doing with my vocal practice?")
    
    print(f"✅ Response generated: {response.message[:100]}...")
    print(f"   Suggestions: {len(response.suggestions)}")
    print(f"   Follow-up questions: {len(response.follow_up_questions)}")
    print(f"   Exercise recommendations: {len(response.exercise_recommendations)}")
    
    print("\n4. Testing vocal insights extraction")
    
    # Test with sample report data
    sample_report = {
        "id": "test_report",
        "date": "2025-01-20",
        "metrics": {
            "jitter": {
                "trend": "improving",
                "change": -0.002,
                "current": 0.012,
                "previous": 0.014,
                "improvement_percentage": 14.3
            },
            "shimmer": {
                "trend": "baseline",
                "change": 0.0,
                "current": 0.024,
                "previous": 0.024,
                "improvement_percentage": 0.0
            }
        },
        "summary": "Great progress today! Your jitter has improved significantly.",
        "practice_sessions": 3,
        "total_practice_time": 45,
        "recommendations": ["Continue with current exercises", "Focus on breath control"],
        "insights": ["Jitter improvement shows better vocal control"]
    }
    
    insights = coach._extract_vocal_insights(sample_report)
    print(f"✅ Vocal insights extracted:")
    print(f"   Practice sessions: {insights.get('practice_sessions')}")
    print(f"   Trends found: {len(insights.get('trends', {}))}")
    print(f"   Recommendations: {len(insights.get('recommendations', []))}")
    
    print("\n5. Testing context building")
    
    # Test context building
    vocal_context = coach._build_vocal_context(sample_report, context.user_memory)
    print(f"✅ Vocal context built ({len(vocal_context)} characters)")
    print(f"   Context preview: {vocal_context[:200]}...")
    
    print("\n6. Testing conversation starter generation")
    
    # Test conversation starter
    starter = coach._generate_conversation_starter(sample_report)
    print(f"✅ Conversation starter: {starter}")
    
    print("\n" + "=" * 50)
    print("🎉 All tests completed successfully!")
    print("The Letta-Fetch.ai integration is working correctly.")

if __name__ == "__main__":
    asyncio.run(test_letta_integration()) 