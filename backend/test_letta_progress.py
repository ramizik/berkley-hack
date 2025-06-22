"""
Test script for the Letta progress evaluation endpoint
"""
import requests
import json

# Configuration
API_URL = "http://localhost:8080"
TEST_USER_ID = "test-user-123"

def test_progress_evaluation():
    """Test the progress evaluation endpoint"""
    
    print("Testing Letta Progress Evaluation Endpoint")
    print("=" * 50)
    
    # Test the evaluate progress endpoint
    endpoint = f"{API_URL}/api/letta/evaluate-progress/{TEST_USER_ID}"
    print(f"Calling: GET {endpoint}")
    
    try:
        response = requests.get(endpoint)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\nResponse:")
            print(json.dumps(data, indent=2))
            
            # Verify response structure
            required_fields = ["success", "showAchievement"]
            for field in required_fields:
                if field in data:
                    print(f"✓ {field}: {data[field]}")
                else:
                    print(f"✗ Missing field: {field}")
            
            # Check optional fields
            optional_fields = ["reason", "evaluationContext", "error"]
            for field in optional_fields:
                if field in data:
                    print(f"  {field}: {data[field]}")
                    
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Request failed: {str(e)}")
        print("Make sure the backend server is running on port 8080")

if __name__ == "__main__":
    test_progress_evaluation() 