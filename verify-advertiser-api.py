import os
import requests
import base64
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Configuration from .env
CREDENTIALS = {
    'REPORTING_API_KEY': os.getenv('APPTROVE_REPORTING_API_KEY'),
    'S2S_API': os.getenv('APPTROVE_S2S_API_KEY'),
    'SDK_KEY': os.getenv('APPTROVE_SDK_KEY'),
    'SECRET_ID': os.getenv('APPTROVE_SECRET_ID'),
    'SECRET_KEY': os.getenv('APPTROVE_SECRET_KEY'),
    'FALLBACK_KEY': "297c9ed1-c4b7-4879-b80a-1504140eb65e"
}


def get_auth_combinations():
    combos = []
    
    # 1. Standard API Key Headers
    for name, key in CREDENTIALS.items():
        if key and name not in ['SECRET_ID', 'SECRET_KEY']:
            combos.append({
                'name': f"{name} (X-Api-Key)",
                'headers': {'X-Api-Key': key}
            })
            combos.append({
                'name': f"{name} (api-key)",
                'headers': {'api-key': key}
            })

    # 2. Basic Auth with Secret ID/Key
    if CREDENTIALS['SECRET_ID'] and CREDENTIALS['SECRET_KEY']:
        auth_str = f"{CREDENTIALS['SECRET_ID']}:{CREDENTIALS['SECRET_KEY']}"
        b64_auth = base64.b64encode(auth_str.encode()).decode()
        combos.append({
            'name': "Basic Auth (SecretID:SecretKey)",
            'headers': {'Authorization': f"Basic {b64_auth}"}
        })

    # 3. Secret ID as Header
    if CREDENTIALS['SECRET_ID']:
        combos.append({
            'name': "Secret ID (X-Tracking-ID)",
            'headers': {'X-Tracking-ID': CREDENTIALS['SECRET_ID']}
        })
        
    return combos

def test_advertiser_endpoints():
    print("🚀 Deep Dive: Advertiser/Admin API Verification")
    print("="*60)
    
    endpoints = [
        # Advertiser Endpoints
        "/v2/advertisers/reports/campaigns",
        "/v2/advertisers/reports/publishers",
        "/advertiser/reports/campaigns", # V1 style
        
        # Admin Endpoints
        "/v2/admin/reports/campaigns",
        "/v2/admin/reports/publishers",
        
        # Publisher Endpoints (Retry with new auth)
        "/v2/publishers/reports/campaigns",
        "/v2/publishers/reports/affiliates",
        
        # Generic/Root
        "/v2/campaigns",
        "/v2/ad/campaigns"
    ]
    
    domains = [
        "https://api.trackier.com",
        "https://api.apptrove.com",
        "https://api.reevo.in"
    ]
    
    from datetime import datetime, timedelta
    end_date = datetime.utcnow().strftime('%Y-%m-%d')
    start_date = (datetime.utcnow() - timedelta(days=30)).strftime('%Y-%m-%d')
    params = f"?start={start_date}&end={end_date}"
    
    auth_combos = get_auth_combinations()
    
    for domain in domains:
        print(f"\n🌐 Testing Domain: {domain}")
        print("-" * 30)
        
        for endpoint in endpoints:
            url = f"{domain}{endpoint}{params}"
            
            for auth in auth_combos:
                try:
                    headers = auth['headers'].copy()
                    headers['Accept'] = 'application/json'
                    
                    response = requests.get(url, headers=headers, timeout=3)
                    
                    if response.ok:
                        print(f"  ✅ SUCCESS! {endpoint}")
                        print(f"     Auth: {auth['name']}")
                        print(f"     Data: {response.text[:150]}...")
                        return # Stop everything on success!
                    
                    # Log interesting failures
                    if response.status_code == 429:
                        print(f"     429 Rate Limited - {endpoint} ({auth['name']})")
                    elif response.status_code == 400:
                         # Only print 400 if it has a useful message
                         try:
                             msg = response.json().get('error', {}).get('message', '')
                             if 'expired' not in msg.lower() and 'auth_failed' not in msg.lower():
                                 print(f"     400 Bad Request - {endpoint} ({auth['name']})")
                                 print(f"       Msg: {msg}")
                         except:
                             pass
                    elif response.status_code == 401 or response.status_code == 403:
                        pass # Ignore standard auth failures
                    elif response.status_code != 404:
                        print(f"     {response.status_code} - {endpoint} ({auth['name']})")
                        
                except Exception:
                    pass

if __name__ == "__main__":
    test_advertiser_endpoints()
