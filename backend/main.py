"""
Complete Backend for AWS Deployment
Includes: FastAPI, DynamoDB, AppTrove API, Playwright Automation
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import boto3
from boto3.dynamodb.conditions import Key, Attr
import requests
import os
from datetime import datetime
import uuid
from playwright.async_api import async_playwright
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Track startup time for health checks
STARTUP_TIME = time.time()

app = FastAPI(title="Millionaires Adda API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:3000",
        "https://partners.addaeducation.com",
        "https://www.partners.addaeducation.com",
        "https://api.partners.addaeducation.com",
        "http://localhost:3001",  # For local backend testing
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment Variables
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

APPTROVE_API_URL = os.getenv("APPTROVE_API_URL", "https://api.apptrove.com")
APPTROVE_API_KEY = os.getenv("APPTROVE_S2S_API_KEY") or os.getenv("APPTROVE_API_KEY")
APPTROVE_SECRET_ID = os.getenv("APPTROVE_SECRET_ID")
APPTROVE_SECRET_KEY = os.getenv("APPTROVE_SECRET_KEY")
APPTROVE_SDK_KEY = os.getenv("APPTROVE_SDK_KEY")
APPTROVE_REPORTING_API_KEY = os.getenv("APPTROVE_REPORTING_API_KEY")
# Link domain (NOT API domain). Used only to construct/validate Unilinks when needed.
APPTROVE_DOMAIN = os.getenv("APPTROVE_DOMAIN", "applink.learnr.co.in")

# AppTrove Dashboard Credentials (for automation)
APPTROVE_DASHBOARD_EMAIL = os.getenv("APPTROVE_DASHBOARD_EMAIL")
APPTROVE_DASHBOARD_PASSWORD = os.getenv("APPTROVE_DASHBOARD_PASSWORD")
APPTROVE_COOKIES_FILE = os.getenv("APPTROVE_COOKIES_FILE", "apptrove_cookies.json")

# Adjust Configuration
ADJUST_API_TOKEN = os.getenv("ADJUST_API_TOKEN") or "8zTxM99vLdeeZ_kPAc3b-ykVL1QMPJvhfYSyC79cMq7evzxyeA"
ADJUST_APP_TOKEN = os.getenv("ADJUST_APP_TOKEN") or "5chd8nwq2pkw"
ADJUST_API_URL = os.getenv("ADJUST_API_URL", "https://api.adjust.com")

# DynamoDB Tables
USERS_TABLE = os.getenv("DYNAMODB_USERS_TABLE", "edurise-users")
LINKS_TABLE = os.getenv("DYNAMODB_LINKS_TABLE", "edurise-links")
ANALYTICS_TABLE = os.getenv("DYNAMODB_ANALYTICS_TABLE", "edurise-analytics")

# Initialize DynamoDB
dynamodb = None
users_table = None
links_table = None
analytics_table = None

if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
    dynamodb = boto3.resource(
        'dynamodb',
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )
    users_table = dynamodb.Table(USERS_TABLE)
    links_table = dynamodb.Table(LINKS_TABLE)
    analytics_table = dynamodb.Table(ANALYTICS_TABLE)
    print(f"✅ DynamoDB configured: {USERS_TABLE}, {LINKS_TABLE}, {ANALYTICS_TABLE}")
else:
    print("⚠️ DynamoDB not configured - Falling back to local JSON database")
    import json
    class JsonTable:
        def __init__(self, table_name, file_path):
            self.table_name = table_name
            self.file_path = file_path
        def scan(self):
            try:
                with open(self.file_path, 'r') as f:
                    content = json.load(f)
                    key = 'users' if 'users' in self.table_name else ('links' if 'links' in self.table_name else 'analytics')
                    return {'Items': content.get(key, [])}
            except: return {'Items': []}
        def query(self, **kwargs): return self.scan()
        def update_item(self, **kwargs): return {"Attributes": {}}
        def put_item(self, **kwargs): return {}

    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'server', 'database.json')
    users_table = JsonTable(USERS_TABLE, db_path)
    links_table = JsonTable(LINKS_TABLE, db_path)
    analytics_table = JsonTable(ANALYTICS_TABLE, db_path)

# Pydantic Models
class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    platform: Optional[str] = None
    socialHandle: Optional[str] = None
    followerCount: Optional[int] = None
    status: Optional[str] = None
    approvalStatus: Optional[str] = None
    adminNotes: Optional[str] = None
    unilink: Optional[str] = None
    linkId: Optional[str] = None
    templateId: Optional[str] = None

class ApproveRequest(BaseModel):
    adminNotes: Optional[str] = None
    approvedBy: Optional[str] = "admin"

class RejectRequest(BaseModel):
    adminNotes: Optional[str] = None
    approvedBy: Optional[str] = "admin"

class CreateLinkRequest(BaseModel):
    templateId: str
    affiliateData: Dict[str, Any]
    linkData: Dict[str, Any]

# Helper Functions
def check_dynamodb():
    if not dynamodb or not users_table:
        raise HTTPException(status_code=500, detail="DynamoDB not configured")

def apptrove_headers(auth_type="api-key"):
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    
    if auth_type == "api-key":
        headers["api-key"] = APPTROVE_API_KEY
    elif auth_type == "reporting":
        headers["api-key"] = APPTROVE_REPORTING_API_KEY
    elif auth_type == "sdk":
        headers["api-key"] = APPTROVE_SDK_KEY
    elif auth_type == "basic":
        import base64
        credentials = f"{APPTROVE_SECRET_ID}:{APPTROVE_SECRET_KEY}"
        encoded = base64.b64encode(credentials.encode()).decode()
        headers["Authorization"] = f"Basic {encoded}"
    
    return headers

# ============ BROWSER AUTOMATION ============

async def create_link_via_automation(template_id: str, link_name: str, campaign: str):
    """
    Create AppTrove link via Playwright browser automation
    Priority: Cookie-based auth > Gmail OAuth
    """
    import json
    from pathlib import Path
    
    async with async_playwright() as p:
        browser = None
        try:
            print(f"[Automation] Creating link: {link_name}")
            
            # Launch browser
            browser = await p.chromium.launch(headless=True, args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled'
            ])
            
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            )
            
            # Try cookie-based authentication first
            cookies_loaded = False
            if Path(APPTROVE_COOKIES_FILE).exists():
                try:
                    with open(APPTROVE_COOKIES_FILE, 'r') as f:
                        cookies = json.load(f)
                    await context.add_cookies(cookies)
                    cookies_loaded = True
                    print("→ Using saved session cookies")
                except Exception as e:
                    print(f"   ⚠️ Cookie load failed: {e}")
            
            page = await context.new_page()
            
            # If using cookies, skip login
            if cookies_loaded:
                print("→ Skipping login (using cookies)")
                # Go directly to template to verify cookies work
                await page.goto(f'https://dashboard.apptrove.com/v2/app/{template_id}', timeout=30000)
                
                # Check if we're redirected to login (cookies expired)
                if '/login' in page.url:
                    print("   ⚠️ Cookies expired, falling back to login")
                    cookies_loaded = False
            
            # Fallback to login if no cookies or cookies expired
            if not cookies_loaded:
                if not APPTROVE_DASHBOARD_EMAIL:
                    await browser.close()
                    return {
                        "success": False,
                        "error": "No cookies found and no login credentials configured. Run generate-cookies.py"
                    }
                
                print("→ Logging in with credentials...")
                await page.goto('https://dashboard.apptrove.com/login', timeout=30000)
                
                # Try Gmail OAuth
                try:
                    await page.click('button:has-text("Google"), button:has-text("Continue with Google"), a:has-text("Sign in with Google")', timeout=5000)
                    await page.wait_for_timeout(2000)
                    
                    await page.wait_for_url('**/accounts.google.com/**', timeout=10000)
                    await page.fill('input[type="email"]', APPTROVE_DASHBOARD_EMAIL)
                    await page.click('button:has-text("Next"), #identifierNext')
                    await page.wait_for_timeout(2000)
                    
                    if APPTROVE_DASHBOARD_PASSWORD:
                        await page.fill('input[type="password"]', APPTROVE_DASHBOARD_PASSWORD)
                        await page.click('button:has-text("Next"), #passwordNext')
                        await page.wait_for_timeout(3000)
                except:
                    # Fallback to direct login
                    print("   → Gmail OAuth failed, trying direct login")
                    await page.goto('https://dashboard.apptrove.com/login')
                    await page.fill('input[type="email"]', APPTROVE_DASHBOARD_EMAIL)
                    if APPTROVE_DASHBOARD_PASSWORD:
                        await page.fill('input[type="password"]', APPTROVE_DASHBOARD_PASSWORD)
                        await page.click('button[type="submit"]')
                
                # Wait for successful login
                try:
                    await page.wait_for_url('**/dashboard', timeout=30000)
                    print("   ✅ Login successful")
                except:
                    await browser.close()
                    return {
                        "success": False,
                        "error": "Login failed. Use generate-cookies.py for reliable auth"
                    }
            
            # Navigate to template
            print(f"→ Opening template {template_id}...")
            await page.goto(f'https://dashboard.apptrove.com/v2/app/{template_id}')
            await page.wait_for_load_state('networkidle', timeout=30000)
            
            # Click Add Link
            print("→ Opening form...")
            await page.click('button:has-text("Add Link"), a:has-text("Add Link")')
            await page.wait_for_timeout(2000)
            
            # Fill form
            print("→ Filling form...")
            inputs = await page.locator('input[type="text"]').all()
            if len(inputs) >= 3:
                await inputs[0].fill(link_name)
                await inputs[1].fill(campaign)
                await inputs[2].fill(campaign)
            
            # Submit through steps
            await page.click('button:has-text("Next")')
            await page.wait_for_timeout(2000)
            await page.click('button:has-text("Next")')
            await page.wait_for_timeout(2000)
            await page.click('button:has-text("Create"), button:has-text("Submit")')
            await page.wait_for_timeout(5000)
            
            # Extract created link
            print("→ Extracting link...")
            await page.goto(f'https://dashboard.apptrove.com/v2/app/{template_id}')
            await page.wait_for_load_state('networkidle', timeout=30000)
            await page.wait_for_timeout(3000)
            
            link_url = await page.evaluate(f'''() => {{
                const rows = document.querySelectorAll('tr');
                for (const row of rows) {{
                    if (row.textContent.includes('{link_name}')) {{
                        const links = row.querySelectorAll('a[href*="applink"]');
                        if (links.length > 0) return links[0].href;
                    }}
                }}
                return null;
            }}''')
            
            await browser.close()
            
            if link_url:
                link_id = link_url.split('/d/')[1].split('?')[0] if '/d/' in link_url else None
                print(f"✅ Link created: {link_url}")
                return {
                    "success": True,
                    "unilink": link_url,
                    "linkId": link_id,
                    "createdVia": "automation"
                }
            else:
                return {
                    "success": False,
                    "error": "Link created but URL not found"
                }
                
        except Exception as e:
            print(f"❌ Automation error: {e}")
            if browser:
                await browser.close()
            return {
                "success": False,
                "error": f"Automation failed: {str(e)}"
            }

# ============ API ENDPOINTS ============

@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "Millionaires Adda API",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    """
    Backend health check endpoint - optimized for Kubernetes probes
    Returns immediately without DB checks for fast response
    """
    uptime = int(time.time() - STARTUP_TIME)
    return {
        "status": "ok",
        "service": "Partners Portal Backend",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": uptime,
        "ready": uptime > 5  # Ready after 5 seconds
    }

# ============ ADJUST HELPERS ============

def create_adjust_tracker(name: str, label: str) -> Optional[str]:
    """Create a tracker in Adjust and return its token"""
    if not ADJUST_API_TOKEN or not ADJUST_APP_TOKEN:
        print("❌ Adjust API Token or App Token missing")
        return None
        
    url = f"{ADJUST_API_URL}/public/v2/apps/{ADJUST_APP_TOKEN}/trackers"
    headers = {
        'Authorization': f'Bearer {ADJUST_API_TOKEN}',
        'Content-Type': 'application/json'
    }
    payload = {
        'name': name,
        'label': label
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        if response.ok:
            data = response.json()
            items = data.get('data', {}).get('items', [])
            if items:
                print(f"✅ Adjust tracker created: {items[0].get('token')}")
                return items[0].get('token')
        else:
            print(f"⚠️ Adjust API error: {response.text}")
    except Exception as e:
        print(f"Error creating Adjust tracker: {e}")
        
    return None

# ============ USER ENDPOINTS ============

@app.post("/api/users/register")
@app.post("/api/users")
async def create_user(user_data: dict):
    """Create a new user/affiliate"""
    check_dynamodb()
    try:
        # Check if user already exists
        email = user_data.get("email", "").strip().lower()
        if email:
            response = users_table.scan(
                FilterExpression=Attr('email').eq(email)
            )
            if response.get('Items'):
                raise HTTPException(status_code=400, detail="A user with this email already exists")
        
        user_id = str(uuid.uuid4())
        
        # Create Adjust Tracker
        raw_name = user_data.get("name", f"User {user_id[:8]}").strip()
        campaign_label = raw_name.replace(" ", "-").lower()
        tracker_token = create_adjust_tracker(raw_name, campaign_label)
        
        user = {
            "id": user_id,
            "name": raw_name,
            "email": email,
            "phone": user_data.get("phone", "").strip(),
            "platform": user_data.get("platform", "").strip(),
            "socialHandle": user_data.get("socialHandle", "").strip(),
            "followerCount": int(user_data.get("followerCount", 0)),
            "status": "pending",
            "approvalStatus": "pending",
            "tracker_token": tracker_token,
            "unilink": f"https://app.adjust.com/{tracker_token}" if tracker_token else None,
            "linkId": tracker_token, # Keep for backwards compat
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }
        
        users_table.put_item(Item=user)
        return {
            "success": True, 
            "user": user, 
            "message": "Your application has been submitted successfully. It is pending admin approval. You will receive an email once approved."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users")
async def get_users(
    search: Optional[str] = None,
    platform: Optional[str] = None,
    status: Optional[str] = None,
    approvalStatus: Optional[str] = None
):
    try:
        check_dynamodb()
        
        scan_kwargs = {}
        filter_expressions = []
        
        if approvalStatus and approvalStatus != "all":
            filter_expressions.append(Attr('approvalStatus').eq(approvalStatus))
        if status and status != "all":
            filter_expressions.append(Attr('status').eq(status))
        if platform and platform != "all":
            filter_expressions.append(Attr('platform').eq(platform))
        
        if filter_expressions:
            from functools import reduce
            scan_kwargs['FilterExpression'] = reduce(lambda a, b: a & b, filter_expressions)
        
        response = users_table.scan(**scan_kwargs)
        users = response.get('Items', [])
        
        if search:
            search_lower = search.lower()
            users = [u for u in users if 
                search_lower in u.get('name', '').lower() or
                search_lower in u.get('email', '').lower() or
                search_lower in u.get('platform', '').lower() or
                search_lower in u.get('socialHandle', '').lower() or
                search_lower in u.get('phone', '').lower()
            ]
        
        return {"success": True, "users": users, "count": len(users)}
    except HTTPException:
        return {"success": True, "users": [], "count": 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    check_dynamodb()
    try:
        response = users_table.get_item(Key={'id': user_id})
        user = response.get('Item')
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"success": True, "user": user}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}/links")
async def get_user_links(user_id: str):
    check_dynamodb()
    try:
        # Use Scan with Filter because userId is not Partition Key for links table
        # (Assuming links table has id as PK and userId as attribute)
        from boto3.dynamodb.conditions import Key, Attr
        response = links_table.scan(
            FilterExpression=Attr('userId').eq(user_id)
        )
        return {"success": True, "links": response.get('Items', [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/users/{user_id}")
async def update_user(user_id: str, user_data: UserUpdate):
    check_dynamodb()
    try:
        update_expr = "SET "
        expr_attr_values = {}
        expr_attr_names = {}
        updates = []
        
        for field, value in user_data.dict(exclude_none=True).items():
            if field == "status":
                expr_attr_names["#status"] = "status"
                updates.append("#status = :status")
                expr_attr_values[":status"] = value
            else:
                updates.append(f"{field} = :{field}")
                expr_attr_values[f":{field}"] = value
        
        if updates:
            update_expr += ", ".join(updates)
            update_expr += ", updatedAt = :updatedAt"
            expr_attr_values[":updatedAt"] = datetime.utcnow().isoformat()
            
            kwargs = {
                'Key': {'id': user_id},
                'UpdateExpression': update_expr,
                'ExpressionAttributeValues': expr_attr_values,
                'ReturnValues': 'ALL_NEW'
            }
            
            if expr_attr_names:
                kwargs['ExpressionAttributeNames'] = expr_attr_names
            
            response = users_table.update_item(**kwargs)
            return {"success": True, "user": response['Attributes']}
        
        return {"success": True, "message": "No updates"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/{user_id}/approve")
async def approve_user(user_id: str, request: ApproveRequest):
    check_dynamodb()
    try:
        response = users_table.get_item(Key={'id': user_id})
        user = response.get('Item')
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update user status to approved
        update_data = {
            "approvalStatus": "approved",
            "approvedAt": datetime.utcnow().isoformat(),
            "approvedBy": request.approvedBy,
            "status": "active"
        }
        
        if request.adminNotes:
            update_data["adminNotes"] = request.adminNotes
        
        users_table.update_item(
            Key={'id': user_id},
            UpdateExpression='SET ' + ', '.join([f'{k} = :{k}' for k in update_data.keys()]) + ', updatedAt = :updatedAt',
            ExpressionAttributeValues={f':{k}': v for k, v in update_data.items()} | {':updatedAt': datetime.utcnow().isoformat()},
            ReturnValues='ALL_NEW'
        )
        
        return {
            "success": True,
            "message": "User approved. Please create link manually in AppTrove dashboard."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/{user_id}/assign-link")
async def assign_link(user_id: str, link_data: dict):
    """Manually assign AppTrove link to user"""
    check_dynamodb()
    try:
        unilink = link_data.get('unilink')
        if not unilink:
            raise HTTPException(status_code=400, detail="unilink is required")
        
        # Extract link ID from URL
        link_id = None
        if '/d/' in unilink:
            link_id = unilink.split('/d/')[1].split('?')[0]
        
        update_data = {
            "unilink": unilink,
            "linkId": link_id,
            "templateId": link_data.get('templateId', 'wBehUW')
        }
        
        users_table.update_item(
            Key={'id': user_id},
            UpdateExpression='SET unilink = :unilink, linkId = :linkId, templateId = :templateId, approvalStatus = :approvalStatus, updatedAt = :updatedAt',
            ExpressionAttributeValues={
                ':unilink': unilink,
                ':linkId': link_id,
                ':templateId': update_data['templateId'],
                ':approvalStatus': 'approved',  # Auto-approve when link is assigned
                ':updatedAt': datetime.utcnow().isoformat()
            },
            ReturnValues='ALL_NEW'
        )
        
        return {"success": True, "message": "Link assigned successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/{user_id}/reject")
async def reject_user(user_id: str, request: RejectRequest):
    check_dynamodb()
    try:
        update_data = {
            "approvalStatus": "rejected",
            "rejectedAt": datetime.utcnow().isoformat(),
            "status": "inactive"
        }
        
        if request.adminNotes:
            update_data["adminNotes"] = request.adminNotes
        
        users_table.update_item(
            Key={'id': user_id},
            UpdateExpression='SET ' + ', '.join([f'{k} = :{k}' for k in update_data.keys()]) + ', updatedAt = :updatedAt',
            ExpressionAttributeValues={f':{k}': v for k, v in update_data.items()} | {':updatedAt': datetime.utcnow().isoformat()},
            ReturnValues='ALL_NEW'
        )
        
        return {"success": True, "message": "User rejected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: str):
    check_dynamodb()
    try:
        users_table.update_item(
            Key={'id': user_id},
            UpdateExpression='SET #status = :status, deletedAt = :deletedAt, updatedAt = :updatedAt',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'deleted',
                ':deletedAt': datetime.utcnow().isoformat(),
                ':updatedAt': datetime.utcnow().isoformat()
            }
        )
        return {"success": True, "message": "User deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}/analytics")
async def get_user_analytics(user_id: str):
    check_dynamodb()
    try:
        # User ID is not partition key, so we must scan with filter
        # In production, a GSI on userId should be added
        from boto3.dynamodb.conditions import Key, Attr
        response = analytics_table.scan(
            FilterExpression=Attr('userId').eq(user_id),
            Limit=100
        )
        items = response.get('Items', [])
        # Sort manually since we can't usage ScanIndexForward
        items.sort(key=lambda x: x.get('date', ''), reverse=True)
        return {"success": True, "analytics": items}
    except Exception as e:
        print(f"Error fetching analytics: {e}")
        return {"success": False, "error": str(e), "analytics": []}

# ============ APPTROVE ENDPOINTS ============

@app.get("/api/apptrove/templates")
async def get_templates():
    try:
        url = f"{APPTROVE_API_URL}/internal/link-template"
        params = {"status": "active", "limit": 100}
        
        for auth_type in ["reporting", "api-key", "sdk"]:
            try:
                response = requests.get(
                    url,
                    headers=apptrove_headers(auth_type),
                    params=params,
                    timeout=10
                )
                
                if response.ok:
                    data = response.json()
                    templates = data.get('data', {}).get('linkTemplateList', []) or []
                    return {"success": True, "templates": templates}
            except:
                continue
        
        return {"success": True, "templates": []}
    except:
        return {"success": True, "templates": []}

@app.get("/api/apptrove/stats")
async def get_link_stats(linkId: str):
    try:
        url = f"{APPTROVE_API_URL}/internal/unilink/{linkId}/stats"
        response = requests.get(
            url,
            headers=apptrove_headers("reporting"),
            timeout=10
        )
        
        if response.ok:
            return {"success": True, "stats": response.json()}
        return {"success": False, "error": "Failed to fetch stats"}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ============ ADJUST ENDPOINTS ============

def get_adjust_stats_direct(identifier: str):
    """
    Fetch stats from Adjust Report Service API.
    Identifier can be a tracker token.
    """
    if not ADJUST_API_TOKEN or not ADJUST_APP_TOKEN:
        print("❌ Adjust API Token or App Token missing")
        return None
    
    tracker_token = identifier
    
    # Extract identifier from unilink if provided (in this setup, linkId fallback)
    if identifier.startswith('http'):
        from urllib.parse import urlparse, parse_qs
        try:
            parsed = urlparse(identifier)
            path_parts = parsed.path.strip('/').split('/')
            tracker_token = path_parts[-1] if path_parts and path_parts[-1] != 'd' else identifier
        except:
            pass

    try:
        from datetime import datetime, timedelta
        end_date = datetime.utcnow().strftime('%Y-%m-%d')
        start_date = (datetime.utcnow() - timedelta(days=30)).strftime('%Y-%m-%d')
        
        # Adjust Report Service API endpoint
        url = "https://automate.adjust.com/reports-service/report"
        
        # we filter by tracker token (network) to get stats only for this specific affiliate
        params = {
            "date_period": f"{start_date}:{end_date}",
            "dimensions": "network",
            "metrics": "clicks,installs,revenue,network_cost", 
            "tracker_filter": tracker_token,
            "app_token__in": ADJUST_APP_TOKEN
        }
        
        aggregated = {"clicks": 0, "conversions": 0, "payout": 0, "revenue": 0, "installs": 0}
        
        with open("adjust_debug.log", "a") as log:
            log.write(f"\n--- Requesting Adjust stats for {identifier} ---\n")
            log.write(f"Url: {url}\n")
            try:
                response = requests.get(
                    url, 
                    headers={"Authorization": f"Bearer {ADJUST_API_TOKEN}", "Accept": "application/json"},
                    params=params,
                    timeout=10
                )
                
                log.write(f"Status: {response.status_code}\n")
                log.write(f"Response: {response.text[:500]}\n")
                
                if response.ok:
                    data = response.json()
                    rows = data.get('rows', [])
                    
                    log.write(f"Parsed {len(rows)} rows\n")
                    
                    for item in rows:
                        aggregated["clicks"] += int(item.get("clicks", 0))
                        # Treat installs as conversions
                        aggregated["conversions"] += int(item.get("installs", 0))
                        aggregated["installs"] += int(item.get("installs", 0))
                        aggregated["payout"] += float(item.get("network_cost", 0))
                        aggregated["revenue"] += float(item.get("revenue", 0))
                else:
                    log.write("Request failed\n")
            except Exception as e:
                log.write(f"Exception: {str(e)}\n")
            
        return aggregated
            
    except Exception as e:
        print(f"❌ Fatal error in Adjust fetch: {str(e)}")
        return None

# Kept the same endpoint path `/api/trackier/stats` for frontend backward compatibility
@app.get("/api/trackier/stats")
async def get_trackier_stats_api(
    affiliateId: str = None, 
    linkId: str = None, 
    unilink: str = None
):
    # Determine the identifier to use
    identifier = affiliateId or linkId or unilink
    
    if not identifier:
        return {"success": False, "error": "Missing identifier (affiliateId, linkId, or unilink required)"}
        
    stats = get_adjust_stats_direct(identifier)
    if stats:
        return {"success": True, "stats": stats}
    return {"success": False, "error": "Failed to fetch Adjust stats"}

# ============ DASHBOARD ENDPOINTS ============

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    try:
        # No longer raising error if DynamoDB missing, we use mock
        users_response = users_table.scan()
        users = users_response.get('Items', [])
        
        total_affiliates = len(users)
        active_affiliates = len([u for u in users if u.get('status') == 'active'])
        pending_approval = len([u for u in users if u.get('approvalStatus') == 'pending'])
        
        # Aggregate stats from APIs for all approved affiliates
        total_clicks = 0
        total_conversions = 0
        total_earnings = 0
        
        for user in users:
            if user.get('approvalStatus') == 'approved':
                link_id = user.get('linkId')
                if link_id:
                    # Skip AppTrove Stats to prevent timeouts (Mock Mode)
                    '''
                    try:
                        apptrove_res = requests.get(
                            f"{APPTROVE_API_URL}/internal/unilink/{link_id}/stats",
                            headers=apptrove_headers("reporting"),
                            timeout=2
                        )
                        if apptrove_res.ok:
                            st = apptrove_res.json()
                            total_clicks += st.get('clicks', 0)
                            total_conversions += st.get('conversions', 0)
                            total_earnings += st.get('revenue', 0)
                    except: pass
                    '''
                    
                    # Try Adjust Stats
                    adjust_st = get_adjust_stats_direct(link_id)
                    if adjust_st:
                        total_clicks += adjust_st.get('clicks', 0)
                        total_conversions += adjust_st.get('conversions', 0)
                        total_earnings += adjust_st.get('payout', 0)

        return {
            "success": True,
            "stats": {
                "totalAffiliates": total_affiliates,
                "activeAffiliates": active_affiliates,
                "pendingApproval": pending_approval,
                "totalClicks": total_clicks,
                "totalConversions": total_conversions,
                "totalEarnings": total_earnings,
                "conversionRate": (total_conversions / total_clicks * 100) if total_clicks > 0 else 0,
                "totalInstalls": total_conversions, # Assuming conversion = install for now
                "totalPurchases": 0,
                "installRate": 0,
                "purchaseRate": 0,
                "averageEarningsPerAffiliate": (total_earnings / active_affiliates) if active_affiliates > 0 else 0
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "stats": {
                "totalAffiliates": 0,
                "activeAffiliates": 0,
                "pendingApproval": 0,
                "totalClicks": 0,
                "totalConversions": 0,
                "totalEarnings": 0
            }
        }

@app.get("/api/dashboard/analytics")
async def get_dashboard_analytics():
    try:
        check_dynamodb()
        response = analytics_table.scan()
        return {"success": True, "analytics": response.get('Items', [])}
    except:
        return {"success": True, "analytics": []}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
