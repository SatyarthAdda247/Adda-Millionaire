# Gmail Login for Automation

## Problem
AppTrove uses Google OAuth for login, which is harder to automate due to:
- Bot detection
- CAPTCHA challenges
- 2FA requirements

## Solutions

### Option 1: App-Specific Password (Recommended)

If your Gmail has 2FA enabled:

1. Go to: https://myaccount.google.com/apppasswords
2. Create app password for "AppTrove Automation"
3. Use this password in `.env`:

```bash
APPTROVE_DASHBOARD_EMAIL=your-email@gmail.com
APPTROVE_DASHBOARD_PASSWORD=xxxx-xxxx-xxxx-xxxx  # 16-char app password
```

### Option 2: Session Cookies (Most Reliable)

**Manual login once, then reuse session:**

1. **Get cookies from browser:**

```python
# Run this once to save cookies
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    
    # Login manually
    page.goto('https://dashboard.apptrove.com/login')
    print("Please login manually...")
    input("Press Enter after logging in...")
    
    # Save cookies
    cookies = page.context.cookies()
    import json
    with open('apptrove_cookies.json', 'w') as f:
        json.dump(cookies, f)
    
    print("✅ Cookies saved to apptrove_cookies.json")
    browser.close()
```

2. **Use cookies in automation:**

Update `backend-python/main.py`:

```python
async def create_link_via_automation(template_id: str, link_name: str, campaign: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        
        # Load saved cookies
        import json
        with open('apptrove_cookies.json', 'r') as f:
            cookies = json.load(f)
        await context.add_cookies(cookies)
        
        page = await context.new_page()
        
        # Skip login, go directly to template
        await page.goto(f'https://dashboard.apptrove.com/v2/app/{template_id}')
        # ... rest of automation
```

### Option 3: Less Secure App Access

⚠️ **Not recommended for security**

1. Go to: https://myaccount.google.com/lesssecureapps
2. Enable "Less secure app access"
3. Use regular password in `.env`

### Option 4: Use API Key (If Available)

Check if AppTrove provides API key-based authentication for link creation.

Contact AppTrove support: support@apptrove.com

## Implementation Plan

### For Testing (Local):

```bash
# Use test script with visible browser
python3 test-link-generation.py

# Login manually when prompted
# Script will show what's happening
```

### For Production (AWS):

**Recommended: Cookie-based authentication**

```bash
# 1. Generate cookies locally
python3 generate-cookies.py

# 2. Upload to AWS
scp apptrove_cookies.json ubuntu@YOUR_IP:~/millionaires-adda/

# 3. Backend will use cookies instead of login
```

## Updated Environment Variables

```bash
# Option 1: App Password
APPTROVE_DASHBOARD_EMAIL=your@gmail.com
APPTROVE_DASHBOARD_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Option 2: Cookie file path
APPTROVE_COOKIES_FILE=/app/apptrove_cookies.json
```

## Testing Gmail Login

```bash
cd adda-creator-path-main

# Test with visible browser
python3 test-link-generation.py

# Watch for:
# - CAPTCHA challenges
# - 2FA prompts
# - "This browser is not secure" warnings
```

## Troubleshooting

### "This browser is not secure"
Google detected automation. Solutions:
- Use cookie-based auth
- Use app-specific password
- Add delays and human-like behavior

### CAPTCHA appears
Cannot be automated. Solutions:
- Use cookie-based auth (no login needed)
- Contact AppTrove for API access

### 2FA required
- Use app-specific password
- Use cookie-based auth

## Recommendation

**For production, use cookie-based authentication:**

✅ No login required
✅ No CAPTCHA issues
✅ Fast and reliable
✅ Cookies last ~30 days
⚠️ Need to refresh cookies monthly

Let me know which approach you prefer!
