# AppTrove Integration Setup Guide

This guide explains how to set up AppTrove unilinks for tracking affiliate installs and purchases.

## Overview

When an affiliate is approved, the system:
1. Creates a unique **UniLink Template** for the affiliate
2. Creates a **UniLink** from that template
3. Stores the unilink in the database for tracking

## Environment Variables Required

Add these to your `.env` file:

```env
# AppTrove API Configuration
APPTROVE_API_KEY=your_api_key_here
APPTROVE_API_URL=https://api.apptrove.com

# AppTrove Domain (your unilink domain)
APPTROVE_DOMAIN=track.u9ilnk.me

# App Store URLs
APPTROVE_IOS_STORE_URL=https://apps.apple.com/app/your-app-id
APPTROVE_ANDROID_STORE_URL=https://play.google.com/store/apps/details?id=your.package.name

# App IDs (10 character IDs from Trackier)
APPTROVE_IOS_APP_ID=abcd_12345
APPTROVE_ANDROID_APP_ID=abcd_12345

# Deep Linking Configuration
APPTROVE_FALLBACK_SCHEME=yourapp://
APPTROVE_IOS_TEAM_ID=ABC1234567
APPTROVE_IOS_BUNDLE_ID=com.yourcompany.yourapp
APPTROVE_ANDROID_SHA256=your_sha256_fingerprint

# Desktop Fallback URL
APPTROVE_DESKTOP_URL=https://yourwebsite.com
```

## Finding Your API Key

1. Log in to [AppTrove Dashboard](https://dashboard.apptrove.com)
2. Click the **Settings** icon in the bottom left corner
3. Select **Development** tab
4. Copy your **API Key**

## Finding App IDs

### iOS App ID
1. Go to your AppTrove dashboard
2. Navigate to Settings → Apps
3. Find your iOS app
4. Copy the 10-character App ID (format: `abcd_12345`)

### Android App ID
1. Same as iOS, but for Android app
2. Copy the 10-character App ID

## How It Works

### 1. Affiliate Approval Flow

When an admin approves an affiliate:

```javascript
// Step 1: Create Template
POST /internal/link-template
{
  "status": "active",
  "name": "John Doe - Affiliate Template",
  "domain": "track.u9ilnk.me",
  "iosAppID": "abcd_12345",
  "androidAppID": "abcd_12345",
  // ... other config
}

// Step 2: Create Link from Template
POST /internal/link-template/{templateId}/link
{
  "name": "John Doe - Affiliate Link"
}
```

### 2. Tracking Data

The unilink tracks:
- **Clicks**: Number of times the link was clicked
- **Impressions**: Number of times the link was shown
- **Installs**: Number of app installs from the link
- **Conversions**: Number of purchases/subscriptions
- **Revenue**: Total revenue generated

## Fetching Analytics Data

### Method 1: Get Link Stats (Recommended)

**Endpoint**: `GET /internal/link/{linkId}`

```bash
curl -X GET 'https://api.apptrove.com/internal/link/{linkId}' \
  -H 'api-key: YOUR_API_KEY' \
  -H 'Accept: application/json' \
  -G --data-urlencode 'page=1' \
  --data-urlencode 'limit=100'
```

**Response Structure**:
```json
{
  "linkList": [
    {
      "id": "link_id",
      "name": "Link Name",
      "clicks": 1000,
      "impressions": 5000,
      "installs": 50,
      "conversions": 10,
      "revenue": 5000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 1
  },
  "linkTemplate": { ... }
}
```

### Method 2: Get Template Links (All links for an affiliate)

**Endpoint**: `GET /internal/link/{templateId}`

This returns all links created from a specific template (affiliate).

```bash
curl -X GET 'https://api.apptrove.com/internal/link/{templateId}' \
  -H 'api-key: YOUR_API_KEY' \
  -H 'Accept: application/json' \
  -G --data-urlencode 'page=1' \
  --data-urlencode 'limit=100'
```

### Method 3: Using Backend Endpoints

The backend provides these endpoints for easy access:

#### Get User Analytics (with AppTrove data)
```bash
GET /api/users/:id/analytics
# Returns analytics data, tries AppTrove first, falls back to local data
```

#### Sync Analytics from AppTrove (Manual Sync)
```bash
POST /api/users/:id/sync-analytics
# Fetches latest data from AppTrove and saves to local database
# Response includes: clicks, impressions, installs, conversions, revenue
```

#### Get All Links for a Template
```bash
GET /api/templates/:templateId/links?page=1&limit=100
# Returns all links created from a template
# Query params: page, limit, name, status
```

#### Get All Templates
```bash
GET /api/templates
# Returns all available link templates
```

## API Endpoints Reference

### Create Template
- **Endpoint**: `POST /internal/link-template`
- **Purpose**: Create a new unilink template for an affiliate
- **Returns**: Template ID

### Create Link from Template
- **Endpoint**: `POST /internal/link-template/{templateId}/link`
- **Purpose**: Create a unilink from a template
- **Returns**: UniLink URL and Link ID

### Get Link Stats
- **Endpoint**: `GET /internal/link/{linkId}`
- **Purpose**: Get analytics for a specific link
- **Returns**: Clicks, installs, conversions, revenue

### Get Template Links
- **Endpoint**: `GET /internal/link/{templateId}`
- **Purpose**: Get all links created from a template
- **Returns**: List of links with stats

## Data Structure

### Link Object (stored in database)
```json
{
  "id": "uuid",
  "userId": "affiliate_id",
  "link": "https://track.u9ilnk.me/abc123",
  "linkId": "apptrove_link_id",
  "templateId": "apptrove_template_id",
  "status": "active",
  "createdAt": "2026-01-16T10:00:00.000Z",
  "updatedAt": "2026-01-16T10:00:00.000Z"
}
```

## Step-by-Step Setup Guide

### Step 1: Get Your AppTrove API Key
1. Log in to [AppTrove Dashboard](https://dashboard.apptrove.com)
2. Click **Settings** (bottom left)
3. Go to **Development** tab
4. Copy your **API Key**

### Step 2: Get Your App IDs
1. In AppTrove Dashboard, go to **Settings → Apps**
2. Find your iOS app → Copy the **10-character App ID** (e.g., `abcd_12345`)
3. Find your Android app → Copy the **10-character App ID**

### Step 3: Configure Environment Variables
Add to your `.env` file:
```env
APPTROVE_API_KEY=your_api_key_here
APPTROVE_DOMAIN=track.u9ilnk.me  # Your unilink domain from AppTrove
APPTROVE_IOS_APP_ID=abcd_12345
APPTROVE_ANDROID_APP_ID=abcd_12345
APPTROVE_IOS_STORE_URL=https://apps.apple.com/app/your-app-id
APPTROVE_ANDROID_STORE_URL=https://play.google.com/store/apps/details?id=your.package
```

### Step 4: Test the Integration
1. **Approve an affiliate** from admin dashboard
2. Check server logs for:
   - `✅ Template created: {templateId}`
   - `✅ UniLink created: {unilink}`
3. Verify in AppTrove dashboard that template and link were created

### Step 5: Fetch Analytics
Use the sync endpoint to fetch data:
```bash
POST /api/users/:userId/sync-analytics
```

## Testing

### Test by Approving an Affiliate
1. Go to Admin Dashboard
2. Find a pending affiliate
3. Click "Approve"
4. Check the response for unilink URL
5. Verify in AppTrove dashboard

### Test Analytics Sync
```bash
# After approving an affiliate, sync their analytics
curl -X POST http://localhost:3001/api/users/{userId}/sync-analytics \
  -H "Content-Type: application/json"
```

## Troubleshooting

### Error: "API key not configured"
- Check `.env` file has `APPTROVE_API_KEY`
- Restart server after adding environment variables

### Error: "Template creation failed"
- Verify all required environment variables are set
- Check App IDs are correct (10 characters)
- Ensure domain is valid and configured in AppTrove

### Error: "UniLink URL not found"
- Check AppTrove API response structure
- Verify template was created successfully
- Check API endpoint is correct

### No Analytics Data
- Links need time to accumulate data
- Verify link is being used/shared
- Check AppTrove dashboard for data

## Next Steps

1. **Set up environment variables** in `.env`
2. **Test template creation** using test endpoint
3. **Approve an affiliate** to see unilink creation
4. **Check AppTrove dashboard** to verify links
5. **Set up analytics sync** to fetch data regularly

## Support

For AppTrove API issues:
- Check [AppTrove Documentation](https://developers.apptrove.com)
- Contact AppTrove support
- Review API responses in server logs
