#!/usr/bin/env python3
"""
Generate AppTrove session cookies for automation
This avoids Gmail OAuth issues
"""

from playwright.sync_api import sync_playwright
import json
import os

print("🍪 AppTrove Cookie Generator")
print("=" * 50)
print("\nThis will:")
print("1. Open AppTrove login page")
print("2. Wait for you to login manually")
print("3. Save session cookies for automation")
print("\n⚠️ You'll need to do this once per month")
print("=" * 50)

input("\nPress Enter to start...")

with sync_playwright() as p:
    # Launch visible browser
    browser = p.chromium.launch(headless=False)
    context = browser.new_context(
        viewport={'width': 1920, 'height': 1080}
    )
    page = context.new_page()
    
    # Go to login page
    print("\n1️⃣ Opening AppTrove login page...")
    page.goto('https://dashboard.apptrove.com/login')
    
    print("\n2️⃣ Please login manually in the browser window")
    print("   → Use your Gmail account")
    print("   → Complete any 2FA if required")
    print("   → Wait until you see the dashboard")
    
    input("\n3️⃣ Press Enter after you've logged in and see the dashboard...")
    
    # Verify we're on dashboard
    if 'dashboard.apptrove.com' in page.url and '/login' not in page.url:
        print("\n✅ Login detected!")
        
        # Save cookies
        cookies = context.cookies()
        
        output_file = 'apptrove_cookies.json'
        with open(output_file, 'w') as f:
            json.dump(cookies, f, indent=2)
        
        print(f"\n✅ Cookies saved to: {output_file}")
        print(f"   Total cookies: {len(cookies)}")
        
        print("\n📦 Next steps:")
        print("   1. Copy this file to your AWS server:")
        print(f"      scp {output_file} ubuntu@YOUR_IP:~/millionaires-adda/")
        print("\n   2. Backend will automatically use these cookies")
        print("\n   3. Refresh cookies monthly (run this script again)")
        
    else:
        print("\n❌ Still on login page. Please try again.")
        print(f"   Current URL: {page.url}")
    
    browser.close()

print("\n" + "=" * 50)
print("🎉 Done!")
