"""
Test script for Fetch AI vocal coaching service
"""
import asyncio
import os
from fetch_ai_service import fetch_ai_coach

async def test_fetch_ai():
    """Test the Fetch AI service"""
    print("Testing Fetch AI Vocal Coaching Service")
    print("=" * 50)
    
    # Test user ID and date
    user_id = "test-user-123"
    date = "2025-01-15"
    
    try:
        # Generate a daily report
        print(f"Generating report for user {user_id} on {date}")
        report = await fetch_ai_coach.generate_daily_report(user_id, date)
        
        print(f"\nReport ID: {report.id}")
        print(f"Summary: {report.summary}")
        
        print("\nMetrics:")
        for metric_name, metric in report.metrics.items():
            print(f"  {metric_name}:")
            print(f"    Current: {metric.current}")
            print(f"    Previous: {metric.previous}")
            print(f"    Change: {metric.change}")
            print(f"    Trend: {metric.trend}")
        
        print("\nInsights:")
        for insight in report.insights:
            print(f"  • {insight}")
        
        print("\nRecommendations:")
        for rec in report.recommendations:
            print(f"  • {rec}")
        
        print("\n✅ Test completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_fetch_ai()) 