import os
import requests
from datetime import datetime

# Get credentials from environment or use test ones
ADJUST_API_TOKEN = os.environ.get("ADJUST_API_TOKEN", "8zTxM99vLdeeZ_kPAc3b-ykVL1QMPJvhfYSyC79cMq7evzxyeA")
ADJUST_APP_TOKEN = os.environ.get("ADJUST_APP_TOKEN", "5chd8nwq2pkw")

def test_adjust_link_creation():
    link_name = f"Test Affiliate {datetime.now().strftime('%H%M%S')}"
    campaign = link_name.replace(" ", "-").lower()
    
    print('Testing Adjust Link Creation...')
    print(f'API Token: {ADJUST_API_TOKEN[:5]}...')
    print(f'App Token: {ADJUST_APP_TOKEN}')
    print(f'Campaign: {campaign}')
    
    url = f"https://api.adjust.com/public/v2/apps/{ADJUST_APP_TOKEN}/trackers"
    headers = {
        'Authorization': f'Bearer {ADJUST_API_TOKEN}',
        'Content-Type': 'application/json'
    }
    payload = {
        "name": link_name,
        "label": campaign
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        
        if response.ok:
            print('\n✅ SUCCESS!')
            print('Response:', response.json())
        else:
            print('\n❌ FAILED')
            print('Status Code:', response.status_code)
            try:
                print('Error Data:', response.json())
            except:
                print('Error Text:', response.text)
                
    except Exception as e:
        print('\n❌ FAILED')
        print('Exception:', str(e))

if __name__ == "__main__":
    test_adjust_link_creation()
