"""
Automation Service for AppTrove Link Creation
Separate service to handle browser automation (Playwright)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from playwright.async_api import async_playwright
import os
from datetime import datetime

app = FastAPI(title="AppTrove Automation Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with your Vercel domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
APPTROVE_DASHBOARD_EMAIL = os.getenv("APPTROVE_DASHBOARD_EMAIL")
APPTROVE_DASHBOARD_PASSWORD = os.getenv("APPTROVE_DASHBOARD_PASSWORD")
API_KEY = os.getenv("AUTOMATION_API_KEY", "change-me-in-production")

class CreateLinkRequest(BaseModel):
    template_id: str
    link_name: str
    campaign: str
    api_key: str

@app.get("/")
async def root():
    return {
        "service": "AppTrove Automation Service",
        "version": "1.0.0",
        "status": "ok"
    }

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "credentials_configured": bool(APPTROVE_DASHBOARD_EMAIL and APPTROVE_DASHBOARD_PASSWORD)
    }

@app.post("/create-link")
async def create_link(request: CreateLinkRequest):
    """
    Create AppTrove link via browser automation
    """
    # Verify API key
    if request.api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Check credentials
    if not APPTROVE_DASHBOARD_EMAIL or not APPTROVE_DASHBOARD_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="AppTrove dashboard credentials not configured"
        )
    
    async with async_playwright() as p:
        browser = None
        try:
            # Launch browser
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            print(f"[{datetime.utcnow().isoformat()}] Creating link: {request.link_name}")
            
            # Login to AppTrove
            print("→ Logging in to AppTrove...")
            await page.goto('https://dashboard.apptrove.com/login', timeout=30000)
            await page.fill('input[type="email"]', APPTROVE_DASHBOARD_EMAIL)
            await page.fill('input[type="password"]', APPTROVE_DASHBOARD_PASSWORD)
            await page.click('button[type="submit"]')
            await page.wait_for_url('**/dashboard', timeout=30000)
            print("✓ Logged in")
            
            # Navigate to template
            print(f"→ Opening template {request.template_id}...")
            await page.goto(f'https://dashboard.apptrove.com/v2/app/{request.template_id}')
            await page.wait_for_load_state('networkidle', timeout=30000)
            print("✓ Template loaded")
            
            # Click "Add Link" button
            print("→ Clicking Add Link...")
            await page.click('button:has-text("Add Link"), a:has-text("Add Link")')
            await page.wait_for_timeout(2000)
            print("✓ Form opened")
            
            # Fill form - Step 1: Basic Details
            print("→ Filling form...")
            inputs = await page.locator('input[type="text"]').all()
            if len(inputs) >= 3:
                await inputs[0].fill(request.link_name)  # Link Name
                await inputs[1].fill(request.campaign)    # Campaign
                await inputs[2].fill(request.campaign)    # Deep Linking
                print(f"✓ Filled: name={request.link_name}, campaign={request.campaign}")
            
            # Click Next
            await page.click('button:has-text("Next")')
            await page.wait_for_timeout(2000)
            
            # Step 2: Advanced Settings (skip)
            await page.click('button:has-text("Next")')
            await page.wait_for_timeout(2000)
            
            # Step 3: Redirection (submit)
            print("→ Submitting...")
            await page.click('button:has-text("Create"), button:has-text("Submit")')
            await page.wait_for_timeout(5000)
            print("✓ Submitted")
            
            # Extract created link
            print("→ Extracting link URL...")
            await page.goto(f'https://dashboard.apptrove.com/v2/app/{request.template_id}')
            await page.wait_for_load_state('networkidle', timeout=30000)
            await page.wait_for_timeout(3000)
            
            # Find the link in the table
            link_url = await page.evaluate(f'''() => {{
                const rows = document.querySelectorAll('tr');
                for (const row of rows) {{
                    if (row.textContent.includes('{request.link_name}')) {{
                        const links = row.querySelectorAll('a[href*="applink"]');
                        if (links.length > 0) {{
                            return links[0].href;
                        }}
                    }}
                }}
                return null;
            }}''')
            
            await browser.close()
            browser = None
            
            if link_url:
                link_id = link_url.split('/d/')[1].split('?')[0] if '/d/' in link_url else None
                print(f"✓ Link created: {link_url}")
                return {
                    "success": True,
                    "unilink": link_url,
                    "linkId": link_id,
                    "createdVia": "automation",
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                print("⚠ Link created but URL not extracted")
                return {
                    "success": False,
                    "error": "Link created but URL not found. Check dashboard manually.",
                    "dashboardUrl": f"https://dashboard.apptrove.com/v2/app/{request.template_id}"
                }
                
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            if browser:
                await browser.close()
            raise HTTPException(
                status_code=500,
                detail=f"Automation failed: {str(e)}"
            )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
