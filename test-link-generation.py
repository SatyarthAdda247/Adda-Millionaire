#!/usr/bin/env python3
"""
Test AppTrove link generation via browser automation
"""

import asyncio
import os
from playwright.async_api import async_playwright

# Configuration
APPTROVE_DASHBOARD_EMAIL = input("AppTrove Email: ")
APPTROVE_DASHBOARD_PASSWORD = input("AppTrove Password: ")
TEMPLATE_ID = "wBehUW"  # Your template
TEST_LINK_NAME = f"Test Link {asyncio.get_event_loop().time()}"
TEST_CAMPAIGN = "test_campaign"

async def test_automation():
    """Test link creation via Playwright"""
    
    print("\n🧪 Testing AppTrove Link Generation")
    print("=" * 50)
    
    async with async_playwright() as p:
        browser = None
        try:
            # Launch browser
            print("\n1️⃣ Launching browser...")
            browser = await p.chromium.launch(
                headless=False,  # Show browser for debugging
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            page = await browser.new_page()
            
            # Login with Gmail
            print("2️⃣ Logging into AppTrove dashboard (Gmail)...")
            await page.goto('https://dashboard.apptrove.com/login', timeout=30000)
            
            # Click Google Sign-In
            try:
                print("   → Clicking 'Sign in with Google'...")
                await page.click('button:has-text("Google"), button:has-text("Continue with Google"), a:has-text("Sign in with Google")', timeout=5000)
                await page.wait_for_timeout(2000)
                
                # Wait for Google login page
                await page.wait_for_url('**/accounts.google.com/**', timeout=10000)
                print("   → Google login page loaded")
                
                # Fill email
                await page.fill('input[type="email"]', APPTROVE_DASHBOARD_EMAIL)
                await page.click('button:has-text("Next"), #identifierNext')
                await page.wait_for_timeout(2000)
                print(f"   → Entered email: {APPTROVE_DASHBOARD_EMAIL}")
                
                # Fill password
                await page.fill('input[type="password"]', APPTROVE_DASHBOARD_PASSWORD)
                await page.click('button:has-text("Next"), #passwordNext')
                await page.wait_for_timeout(3000)
                print("   → Entered password")
                
            except Exception as e:
                print(f"   ⚠️ Google OAuth flow error: {e}")
                print("   → Trying direct login...")
                await page.goto('https://dashboard.apptrove.com/login')
                await page.fill('input[type="email"]', APPTROVE_DASHBOARD_EMAIL)
                await page.fill('input[type="password"]', APPTROVE_DASHBOARD_PASSWORD)
                await page.click('button[type="submit"]')
            
            try:
                await page.wait_for_url('**/dashboard', timeout=30000)
                print("   ✅ Login successful")
            except:
                print("   ❌ Login failed")
                print("\n⚠️ IMPORTANT: Gmail login may require:")
                print("   1. App-specific password (if 2FA enabled)")
                print("   2. 'Less secure app access' enabled")
                print("   3. Manual CAPTCHA solving")
                print("\nAlternative: Use session cookies instead")
                await browser.close()
                return False
            
            # Navigate to template
            print(f"\n3️⃣ Opening template {TEMPLATE_ID}...")
            await page.goto(f'https://dashboard.apptrove.com/v2/app/{TEMPLATE_ID}')
            await page.wait_for_load_state('networkidle', timeout=30000)
            print("   ✅ Template loaded")
            
            # Click Add Link
            print("\n4️⃣ Clicking 'Add Link' button...")
            await page.click('button:has-text("Add Link"), a:has-text("Add Link")')
            await page.wait_for_timeout(2000)
            print("   ✅ Form opened")
            
            # Fill form
            print("\n5️⃣ Filling link creation form...")
            inputs = await page.locator('input[type="text"]').all()
            if len(inputs) >= 3:
                await inputs[0].fill(TEST_LINK_NAME)
                await inputs[1].fill(TEST_CAMPAIGN)
                await inputs[2].fill(TEST_CAMPAIGN)
                print(f"   ✅ Filled: {TEST_LINK_NAME}")
            else:
                print(f"   ⚠️ Expected 3+ inputs, found {len(inputs)}")
            
            # Submit through steps
            print("\n6️⃣ Submitting form...")
            await page.click('button:has-text("Next")')
            await page.wait_for_timeout(2000)
            await page.click('button:has-text("Next")')
            await page.wait_for_timeout(2000)
            await page.click('button:has-text("Create"), button:has-text("Submit")')
            await page.wait_for_timeout(5000)
            print("   ✅ Form submitted")
            
            # Extract link
            print("\n7️⃣ Extracting generated link...")
            await page.goto(f'https://dashboard.apptrove.com/v2/app/{TEMPLATE_ID}')
            await page.wait_for_load_state('networkidle', timeout=30000)
            await page.wait_for_timeout(3000)
            
            link_url = await page.evaluate(f'''() => {{
                const rows = document.querySelectorAll('tr');
                for (const row of rows) {{
                    if (row.textContent.includes('{TEST_LINK_NAME}')) {{
                        const links = row.querySelectorAll('a[href*="applink"]');
                        if (links.length > 0) return links[0].href;
                    }}
                }}
                return null;
            }}''')
            
            await browser.close()
            
            if link_url:
                print(f"\n✅ SUCCESS! Link created:")
                print(f"   {link_url}")
                
                link_id = link_url.split('/d/')[1].split('?')[0] if '/d/' in link_url else None
                if link_id:
                    print(f"   Link ID: {link_id}")
                
                return True
            else:
                print("\n❌ Link created but URL not found in table")
                print("   This might be a timing issue - check dashboard manually")
                return False
                
        except Exception as e:
            print(f"\n❌ Error: {e}")
            if browser:
                await browser.close()
            return False

if __name__ == "__main__":
    # Check if Playwright is installed
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("❌ Playwright not installed!")
        print("Run: pip install playwright && playwright install chromium")
        exit(1)
    
    # Run test
    success = asyncio.run(test_automation())
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 Link generation is WORKING!")
        print("\nNext steps:")
        print("1. Check the link in AppTrove dashboard")
        print("2. Test if it redirects to Play Store")
        print("3. Deploy to AWS with these credentials")
    else:
        print("❌ Link generation needs debugging")
        print("\nTroubleshooting:")
        print("1. Verify credentials are correct")
        print("2. Check if template ID 'wBehUW' exists")
        print("3. Review browser actions (run with headless=False)")
    print("=" * 50)
