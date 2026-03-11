import os
import requests
import base64
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Configuration from .env
CREDENTIALS = {
    'REPORTING_API_KEY': os.getenv('APPTROVE_REPORTING_API_KEY'),
    'S2S_API': os.getenv('APPTROVE_S2S_API_KEY'), # Fixed name from test-stats.ts which implies S2S_API
    'SDK_KEY': os.getenv('APPTROVE_SDK_KEY'),
    'SECRET_ID': os.getenv('APPTROVE_SECRET_ID'),
    'SECRET_KEY': os.getenv('APPTROVE_SECRET_KEY'),
    'FALLBACK_KEY': "297c9ed1-c4b7-4879-b80a-1504140eb65e"
}

# Domains to test
DOMAINS = [
    "https://api.apptrove.com",
    "https://applink.learnr.co.in", # From user's snippet
    "https://trackier.com", # Fallback
    "https://api.trackier.com"
]

def get_auth_headers():
    headers_list = []
    
    # API Key Headers
    if CREDENTIALS['REPORTING_API_KEY']:
        headers_list.append({'name': 'Reporting Key (api-key)', 'headers': {'api-key': CREDENTIALS['REPORTING_API_KEY']}})
        headers_list.append({'name': 'Reporting Key (X-Api-Key)', 'headers': {'X-Api-Key': CREDENTIALS['REPORTING_API_KEY']}})
        headers_list.append({'name': 'Reporting Key (Bearer)', 'headers': {'Authorization': f"Bearer {CREDENTIALS['REPORTING_API_KEY']}"}})

    if CREDENTIALS['S2S_API']:
        headers_list.append({'name': 'S2S Key (api-key)', 'headers': {'api-key': CREDENTIALS['S2S_API']}})
        headers_list.append({'name': 'S2S Key (X-Api-Key)', 'headers': {'X-Api-Key': CREDENTIALS['S2S_API']}})

    # Basic Auth
    if CREDENTIALS['SECRET_ID'] and CREDENTIALS['SECRET_KEY']:
        auth_str = f"{CREDENTIALS['SECRET_ID']}:{CREDENTIALS['SECRET_KEY']}"
        b64_auth = base64.b64encode(auth_str.encode()).decode()
        headers_list.append({'name': 'Basic Auth', 'headers': {'Authorization': f"Basic {b64_auth}"}})

    # Fallback Key
    headers_list.append({'name': 'Fallback Key (X-Api-Key)', 'headers': {'X-Api-Key': CREDENTIALS['FALLBACK_KEY']}})
    
    return headers_list

def test_apptrove_internals():
    print("🚀 Starting Comprehensive AppTrove/Trackier Connectivity Test")
    print("="*60)
    
    link_id = "Smritibisht" # From user's snippet "applink.learnr.co.in/d/Smritibisht"
    template_id = "iHSWbt"
    
    uris = [
        f"/internal/unilink/{link_id}/stats",
        f"/internal/link/{link_id}/stats",
        f"/reporting/unilink/{link_id}/stats",
        f"/v1/links/{link_id}/stats",
        f"/v2/links/{link_id}/stats",
        f"/dashboard/link/{link_id}/stats",
        # Trackier specific
        f"/v2/publishers/reports/campaigns?campaign_id={template_id}",
        f"/v2/conversions?campaign_id={template_id}"
    ]
    
    auth_methods = get_auth_headers()
    
    for domain in DOMAINS:
        print(f"\n🌐 Testing Domain: {domain}")
        print("-" * 30)
        
        for uri in uris:
            url = f"{domain}{uri}"
            # print(f"  Testing Endpoint: {uri}")
            
            for auth in auth_methods:
                try:
                    # Add Accept header to all requests
                    headers = auth['headers'].copy()
                    headers['Accept'] = 'application/json'
                    
                    response = requests.get(url, headers=headers, timeout=3)
                    
                    if response.ok:
                        print(f"  ✅ SUCCESS! {url}")
                        print(f"     Auth: {auth['name']}")
                        print(f"     Data: {response.text[:150]}...")
                        return # Stop on first success
                    elif response.status_code != 404:
                        # Log partial successes or auth errors, ignore 404s to reduce noise
                        if response.status_code == 400:
                            print(f"     400 Bad Request - {url} ({auth['name']})")
                            print(f"       Response: {response.text[:200]}")
                        elif response.status_code == 401 or response.status_code == 403:
                            pass # Expected for wrong keys
                        else:
                            print(f"     {response.status_code} - {url} ({auth['name']})")
                            
                except requests.exceptions.RequestException as e:
                    # print(f"     Connection Error: {str(e)}")
                    pass

if __name__ == "__main__":
    test_apptrove_internals()
