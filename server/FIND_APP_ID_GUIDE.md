# How to Find App ID in AppTrove Dashboard

The App ID is a **10-character identifier** (format: `abcd_12345`) that AppTrove uses to identify your app.

## Method 1: Check App Settings Page

Based on your dashboard, I can see you have:
- **Package ID/Bundle ID**: `com.addaeducation.reevo`
- **Operating System**: `Android/AndroidTv`

The App ID might be displayed on this same page. Look for:
- A field labeled "App ID"
- A field labeled "Trackier App ID"
- A field labeled "Application ID"
- Any field showing a 10-character code

## Method 2: Check Development Tab

1. In AppTrove Dashboard, click the **"Development"** tab (next to "App Settings")
2. Look for App ID information there
3. It might be in API documentation or SDK setup sections

## Method 3: Check Existing Templates

1. Go to **Unilink Management** in AppTrove Dashboard
2. If you have any existing templates, click on one
3. Check the template details - App IDs might be shown there

## Method 4: Use the Helper Endpoint

I've added a helper endpoint to fetch your apps from the API:

```bash
GET /api/apptrove/apps
```

This will try to fetch your apps and show the App IDs. To use it:

1. Make sure you're logged in as admin
2. Call: `GET http://localhost:3001/api/apptrove/apps`
3. Look for `appID` or `app_id` field in the response

## Method 5: Check Template Creation Response

When you create a template (even if it fails), the error response might show what App IDs are expected or available.

## Method 6: Contact AppTrove Support

If you can't find it:
1. The App ID might be the same as your Trackier App ID
2. Check your Trackier dashboard if you have access
3. Contact AppTrove support with your Package ID: `com.addaeducation.reevo`

## Alternative: Create Template Without App IDs First

The system will now try to automatically fetch App IDs from the API. If that doesn't work, you can:

1. Try approving an affiliate - the system will attempt to auto-detect App IDs
2. Check the server logs for any App ID information
3. The error message might tell you what's missing

## What the App ID Looks Like

- Format: 10 characters
- Examples: `abcd_12345`, `xyz_98765`, `test_12345`
- Usually contains letters, numbers, and underscores
- One ID for iOS, one for Android

## Quick Test

Try this to see if we can auto-detect it:

```bash
# Restart your server first
cd server
npm run dev

# Then in another terminal, call the helper endpoint
curl http://localhost:3001/api/apptrove/apps \
  -H "Cookie: your_admin_session_cookie"
```

Or simply try approving an affiliate - the system will attempt to find the App IDs automatically and log what it finds!
