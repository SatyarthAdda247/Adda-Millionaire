import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

TRACKIER_API_KEY = os.getenv("TRACKIER_API_KEY") or os.getenv("TRACKIER_PUBLISHER_API_KEY") or os.getenv("APPTROVE_REPORTING_API_KEY")
TRACKIER_API_URL = os.getenv("TRACKIER_API_URL", "https://api.trackier.com/v2")

def test_trackier_stats(identifier):
    print(f"\n🔍 Testing Trackier Stats for: {identifier}")
    print("-" * 50)
    
    # Simple version of the backend logic
    affiliate_id = identifier
    campaign_id = None
    
    if identifier.startswith('http'):
        from urllib.parse import urlparse, parse_qs
        try:
            parsed = urlparse(identifier)
            params = parse_qs(parsed.query)
            campaign_id = params.get('camp', [None])[0] or params.get('campaign', [None])[0]
            path_parts = parsed.path.strip('/').split('/')
            if len(path_parts) > 0 and path_parts[-1] != 'd':
                affiliate_id = path_parts[-1]
        except:
            pass

    print(f"🆔 Extracted IDs: Affiliate={affiliate_id}, Campaign={campaign_id}")
    
    from datetime import datetime, timedelta
    end_date = datetime.utcnow().strftime('%Y-%m-%d')
    start_date = (datetime.utcnow() - timedelta(days=30)).strftime('%Y-%m-%d')
    
    queries = []
    if affiliate_id:
        queries.append({"type": "Affiliate Report", "url": f"{TRACKIER_API_URL}/publisher/reports/affiliates?affiliate_id={affiliate_id}&start={start_date}&end={end_date}"})
        queries.append({"type": "Conversions", "url": f"{TRACKIER_API_URL}/conversions?affiliate_id={affiliate_id}&start={start_date}&end={end_date}"})
    if campaign_id:
        queries.append({"type": "Campaign Report", "url": f"{TRACKIER_API_URL}/publisher/reports/campaigns?campaign_id={campaign_id}&start={start_date}&end={end_date}"})

    aggregated = {"clicks": 0, "conversions": 0, "payout": 0, "revenue": 0, "installs": 0}
    
    for q in queries:
        print(f"📡 Querying {q['type']}...")
        try:
            response = requests.get(
                q['url'], 
                headers={"X-Api-Key": TRACKIER_API_KEY, "Accept": "application/json"},
                timeout=10
            )
            print(f"   Status: {response.status_code}")
            if response.ok:
                data = response.json()
                items = data if isinstance(data, list) else (data.get('data', []) if isinstance(data, dict) else [])
                if not isinstance(items, list): items = [items] if isinstance(items, dict) else []
                
                count = len(items)
                print(f"   Found {count} items")
                
                for item in items:
                    aggregated["clicks"] += int(item.get("clicks", 0) or item.get("click_count", 0) or 0)
                    aggregated["conversions"] += int(item.get("conversions", 0) or item.get("conversion_count", 0) or 0)
                    aggregated["installs"] += int(item.get("installs", 0) or item.get("install_count", 0) or 0)
                    aggregated["payout"] += float(item.get("payout", 0) or item.get("earning", 0) or 0)
                    aggregated["revenue"] += float(item.get("revenue", 0) or item.get("revenue_amount", 0) or 0)
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            
    print("\n✅ Aggregated Stats:")
    print(json.dumps(aggregated, indent=2))

# Keys to test
KEYS_TO_TEST = {
    "REPORTING_KEY": os.getenv("APPTROVE_REPORTING_API_KEY"),
    "S2S_KEY": os.getenv("APPTROVE_S2S_API_KEY"),
    "SDK_KEY": os.getenv("APPTROVE_SDK_KEY"),
    "SECRET_KEY": os.getenv("APPTROVE_SECRET_KEY"),
    "FALLBACK_KEY": "297c9ed1-c4b7-4879-b80a-1504140eb65e"
}

def test_real_ids():
    print(f"\n🧪 Testing Real IDs from edurise-links and User Provided Reference")
    print("-" * 50)
    
    # IDs from scanned edurise-links and User
    affiliate_id = "d78eea61-7a27-408f-926e-90aae774c68c" # pid from link
    campaign_id = "ayush-affiliate" # camp from link
    template_id = "iHSWbt" # Provided by user
    
    from datetime import datetime, timedelta
    end_date = datetime.utcnow().strftime('%Y-%m-%d')
    start_date = (datetime.utcnow() - timedelta(days=30)).strftime('%Y-%m-%d')
    
    queries = [
        {"name": "Affiliate Report (pid)", "url": f"https://api.trackier.com/v2/publishers/reports/affiliates?affiliate_id={affiliate_id}&start={start_date}&end={end_date}"},
        {"name": "Campaign Report (camp)", "url": f"https://api.trackier.com/v2/publishers/reports/campaigns?campaign_id={campaign_id}&start={start_date}&end={end_date}"},
        {"name": "Campaign Report (templateId)", "url": f"https://api.trackier.com/v2/publishers/reports/campaigns?campaign_id={template_id}&start={start_date}&end={end_date}"},
        {"name": "Conversions (pid)", "url": f"https://api.trackier.com/v2/conversions?affiliate_id={affiliate_id}&start={start_date}&end={end_date}"}
    ]
    
    for q in queries:
        print(f"\n📡 Testing: {q['name']}")
        for name, key in KEYS_TO_TEST.items():
            if not key: continue
            print(f"  🔑 Key {name}: {key[:5]}...")
            try:
                response = requests.get(
                    q['url'], 
                    headers={"X-Api-Key": key, "Accept": "application/json"},
                    timeout=5
                )
                print(f"    Status: {response.status_code}")
                if response.ok:
                    print(f"    ✅ SUCCESS!")
                    print(f"    Data: {response.text[:100]}...")
            except Exception as e:
                print(f"    ❌ Error: {str(e)}")

def test_reevo_and_others():
    print(f"\n🧪 Testing Domain-Specific API URLs")
    print("-" * 50)
    
    from datetime import datetime, timedelta
    end_date = datetime.utcnow().strftime('%Y-%m-%d')
    start_date = (datetime.utcnow() - timedelta(days=30)).strftime('%Y-%m-%d')
    
    variants = [
        {"name": "Reevo V2 Reports", "url": f"https://api.reevo.in/v2/publishers/reports?start={start_date}&end={end_date}"},
        {"name": "Trackier Profile", "url": "https://api.trackier.com/v2/publisher/profile"}
    ]
    
    for variant in variants:
        print(f"\n📡 Variant: {variant['name']}")
        for name, key in KEYS_TO_TEST.items():
            if not key: continue
            print(f"  🔑 Key {name}: {key[:5]}...")
            try:
                response = requests.get(
                    variant['url'], 
                    headers={"X-Api-Key": key, "Accept": "application/json"},
                    timeout=5
                )
                print(f"    Status: {response.status_code}")
                if response.ok:
                    print(f"    ✅ SUCCESS!")
                    print(f"    Data: {response.text[:100]}...")
            except Exception as e:
                print(f"    ❌ Error: {str(e)}")

if __name__ == "__main__":
    test_real_ids()
