import requests
import time
import random

def test_registration():
    url = "http://localhost:3001/api/users/register"
    unique_id = random.randint(1000, 9999)
    payload = {
        "name": f"Adjust Test User {unique_id}",
        "email": f"adjust.test.{unique_id}@example.com",
        "phone": f"212555{unique_id}",
        "followerCount": "10000",
        "socialHandles": [
            {
                "platform": "instagram",
                "handle": f"@adjust_test_{unique_id}",
                "verified": True,
                "verifiedFollowers": 10000
            }
        ]
    }
    
    print(f"Submitting registration for: {payload['email']}")
    try:
        response = requests.post(url, json=payload, timeout=15)
        print(f"Status Code: {response.status_code}")
        try:
            print(f"Response: {response.json()}")
        except:
            print(f"Response: {response.text}")
            
        if response.status_code == 201:
            print("\n✅ User registration successful. Now check server logs to confirm Adjust Campaign API was called.")
            return True
            
    except Exception as e:
        print(f"Error connecting to local server: {e}")
        return False

if __name__ == "__main__":
    test_registration()
