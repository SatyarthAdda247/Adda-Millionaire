# AppTrove Stats API Testing Guide

## Problem
AppTrove doesn't publicly document their stats/analytics API endpoints, so we need to discover the working endpoint through systematic testing.

## Solution
I've created a comprehensive test endpoint that tries **ALL possible combinations** of:
- ✅ 17 different endpoint patterns
- ✅ 9 different authentication methods  
- ✅ All your configured API keys

## How to Test

### Step 1: Wait for Vercel Deployment
After the latest push, wait for Vercel to build and deploy (usually 2-3 minutes).

### Step 2: Test with a Real Link ID
Open this URL in your browser (replace `Smritibisht` with your actual linkId):

```
https://partners-adda.vercel.app/api/apptrove/test-stats?linkId=Smritibisht
```

### Step 3: Check the Results

The response will show:

#### ✅ If Successful:
```json
{
  "success": true,
  "linkId": "Smritibisht",
  "successfulAttempt": {
    "endpoint": "https://api.apptrove.com/internal/unilink/Smritibisht/stats",
    "authMethod": "Reporting API Key (api-key header)",
    "status": 200,
    "response": {
      "clicks": 45,
      "conversions": 12,
      "installs": 10,
      "revenue": 250.50
    }
  },
  "totalAttempts": 153,
  "successfulAttempts": 1,
  "note": "Found working endpoint! Use this configuration in your production code."
}
```

**Action:** Note the `endpoint` and `authMethod` - I'll update the code to use these!

#### ❌ If All Fail:
```json
{
  "success": false,
  "linkId": "Smritibisht",
  "totalAttempts": 153,
  "successfulAttempts": 0,
  "failedAttempts": 153,
  "note": "No working endpoint found. AppTrove may not provide a stats API..."
}
```

**Action:** Check `allResults` array to see what errors occurred. Common issues:
- 401: Wrong API key or insufficient permissions
- 404: Endpoint doesn't exist
- 403: API key doesn't have stats access

## Alternative Approaches

### Option 1: Check AppTrove Dashboard
1. Login to https://dashboard.apptrove.com
2. Navigate to your link `Smritibisht`
3. Check if stats are visible in the UI
4. Open browser DevTools → Network tab
5. Click around to trigger stats loading
6. Look for API calls - note the endpoint and headers

### Option 2: Contact AppTrove Support
Ask them directly:
- "What is the API endpoint for fetching link statistics?"
- "Which API key should I use for the stats endpoint?"
- "Is there documentation for the reporting/analytics API?"

### Option 3: Use Trackier Instead
AppTrove is great for link generation, but Trackier has better APIs for analytics:
- See `TRACKIER_INTEGRATION.md` for implementation guide
- Trackier provides: clicks, conversions, installs, revenue, detailed reports
- Well-documented REST API

## Debugging Current Links

### Check Link Format
Your link: `https://applink.learnr.co.in/d/Smritibisht`

The linkId might be:
- ✅ `Smritibisht` (path parameter)
- ✅ `d/Smritibisht` (full path)
- ✅ The full URL encoded
- ❌ Some internal UUID (if so, need to find mapping)

Try testing with different formats:
```
/api/apptrove/test-stats?linkId=Smritibisht
/api/apptrove/test-stats?linkId=d/Smritibisht
/api/apptrove/test-stats?linkId=https://applink.learnr.co.in/d/Smritibisht
```

## What Credentials Are Being Tested

Your Vercel environment has these configured:
- ✅ `APPTROVE_REPORTING_API_KEY` - For analytics/reporting
- ✅ `APPTROVE_API_KEY` - General API access
- ✅ `APPTROVE_S2S_API` - Server-to-server API
- ✅ `APPTROVE_SDK_KEY` - SDK integration key
- ✅ `APPTROVE_SECRET_ID` + `SECRET_KEY` - Basic auth
- ✅ `APPTROVE_ANDROID_APP_ID` - App identifier

The test endpoint tries all of these in various header formats.

## Next Steps After Testing

1. **Run the test endpoint** with your actual linkId
2. **Share the JSON response** with me
3. **I'll update the production code** to use the working configuration
4. **Or we'll implement Trackier** if AppTrove doesn't provide stats API

---

**Let me know what the test endpoint returns!** 🔍
