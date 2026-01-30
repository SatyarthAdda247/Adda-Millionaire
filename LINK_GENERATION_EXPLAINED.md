# Link Generation - How It Works

## API Documentation Review

Based on AppTrove API docs, these endpoints exist:

### ✅ Available APIs:
1. **GET /internal/link-template** - List templates
   - Header: `api-key: YOUR_KEY`
   - Returns: List of app templates
   - ✅ **Implemented in backend**

2. **POST /internal/link-template** - Create NEW template
   - Creates a template for an app
   - ✅ **Not needed** (templates already exist)

### ❌ Missing API:
- **No documented endpoint for creating individual affiliate links**
- The docs show template management, not link creation

## Our Solution: Browser Automation

Since no direct API exists for creating affiliate links, we use:

### Playwright Automation Flow:

```
1. Launch Chromium browser (headless)
2. Navigate to: https://dashboard.apptrove.com/login
3. Login with credentials
4. Navigate to template: /v2/app/{templateId}
5. Click "Add Link" button
6. Fill form:
   - Link Name: "Affiliate Name - Link"
   - Campaign: "affiliate_campaign"
   - Source: "affiliate_campaign"
7. Click "Next" → "Next" → "Create"
8. Wait for creation
9. Navigate back to template page
10. Extract generated link URL from table
11. Parse link ID from URL
12. Return to backend
```

### Code Location:

**Backend:** `backend-python/main.py`
```python
async def create_link_via_automation(template_id, link_name, campaign)
```

**Called by:** `/api/users/{id}/approve` endpoint

## Testing Link Generation

### Local Test:

```bash
cd adda-creator-path-main

# Install Playwright (if not installed)
pip install playwright
playwright install chromium

# Run test
python3 test-link-generation.py
```

This will:
- Open browser (visible, not headless)
- Show each step
- Create a test link
- Display the generated URL

### What You'll See:

```
🧪 Testing AppTrove Link Generation
==================================================

1️⃣ Launching browser...
2️⃣ Logging into AppTrove dashboard...
   ✅ Login successful
3️⃣ Opening template wBehUW...
   ✅ Template loaded
4️⃣ Clicking 'Add Link' button...
   ✅ Form opened
5️⃣ Filling link creation form...
   ✅ Filled: Test Link 12345
6️⃣ Submitting form...
   ✅ Form submitted
7️⃣ Extracting generated link...

✅ SUCCESS! Link created:
   https://applink.reevo.in/d/test-link-12345?pid=...
   Link ID: test-link-12345

🎉 Link generation is WORKING!
```

## Why This Approach?

### Pros:
✅ Works reliably (same as old backend)
✅ Handles form validation automatically
✅ Gets actual AppTrove-generated URLs
✅ No undocumented API endpoints needed
✅ Dashboard UI changes are visible

### Cons:
⚠️ Requires browser (Chromium ~300MB)
⚠️ Slower than direct API (~10-15 seconds)
⚠️ Requires dashboard credentials
⚠️ May break if dashboard UI changes

## Production Deployment

### Requirements:
1. **Playwright installed** ✅ (in Dockerfile)
2. **Chromium browser** ✅ (in Dockerfile)
3. **Environment variables:**
   ```bash
   APPTROVE_DASHBOARD_EMAIL=your-email@company.com
   APPTROVE_DASHBOARD_PASSWORD=your-password
   ```

### Dockerfile handles:
- Base image: `mcr.microsoft.com/playwright/python:v1.40.0`
- Includes Chromium
- Runs in headless mode
- No sandbox mode for containerization

## Alternative: Direct API (If Available)

If AppTrove provides an undocumented endpoint for link creation:

```python
# Example (not currently working):
POST /internal/unilink
Headers:
  api-key: YOUR_KEY
Body:
  {
    "templateId": "wBehUW",
    "name": "Affiliate Link",
    "campaign": "affiliate_campaign"
  }
```

We tested multiple endpoints - none work for individual link creation.

## Template API (Already Working)

```python
# Backend already implements this:
GET /api/apptrove/templates

# Uses AppTrove API:
GET https://api.apptrove.com/internal/link-template
Headers:
  api-key: 297c9ed1-c4b7-4879-b80a-1504140eb65e  # Reporting API Key
```

This successfully fetches templates to display in the dashboard.

## Summary

| Feature | Method | Status |
|---------|--------|--------|
| Fetch Templates | Direct API | ✅ Working |
| Create Template | Direct API | ✅ Available (not needed) |
| Create Link | Browser Automation | ⚠️ Implemented, needs testing |
| Fetch Link Stats | Direct API | ✅ Working |

**Next Step:** Run `test-link-generation.py` to verify automation works with your credentials.
