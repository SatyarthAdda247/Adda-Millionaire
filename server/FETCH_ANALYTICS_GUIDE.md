# Guide: How to Fetch Analytics Data from AppTrove

This guide explains how to fetch install and purchase tracking data from AppTrove for your affiliates.

## Overview

When an affiliate is approved, a unique **UniLink** is created for them. This link tracks:
- **Clicks**: Every time someone clicks the affiliate's link
- **Impressions**: When the link is displayed
- **Installs**: App installations from the link
- **Conversions**: Purchases/subscriptions made
- **Revenue**: Total revenue generated

## Quick Start: Fetching Data

### Option 1: Automatic Sync (Recommended)

The system automatically fetches data when you call:

```bash
POST /api/users/:userId/sync-analytics
```

**Example**:
```bash
curl -X POST http://localhost:3001/api/users/abc123/sync-analytics \
  -H "Content-Type: application/json"
```

**Response**:
```json
{
  "success": true,
  "message": "Analytics synced successfully from AppTrove",
  "data": {
    "clicks": 1000,
    "impressions": 5000,
    "installs": 50,
    "conversions": 10,
    "earnings": 5000
  },
  "stats": {
    "clicks": 1000,
    "impressions": 5000,
    "installs": 50,
    "conversions": 10,
    "revenue": 5000
  }
}
```

### Option 2: Get User Analytics (with AppTrove data)

```bash
GET /api/users/:userId/analytics
```

This endpoint:
1. First tries to fetch from AppTrove API
2. Falls back to local database if AppTrove fails
3. Returns combined analytics data

## AppTrove API Endpoints for Direct Access

### 1. Get Link Stats (Single Link)

**Endpoint**: `GET /internal/link/{linkId}`

**Purpose**: Get analytics for a specific unilink

**Request**:
```bash
curl -X GET 'https://api.apptrove.com/internal/link/{linkId}' \
  -H 'api-key: YOUR_API_KEY' \
  -H 'Accept: application/json' \
  -G --data-urlencode 'page=1' \
  --data-urlencode 'limit=100'
```

**Response**:
```json
{
  "linkList": [
    {
      "id": "link_id",
      "name": "John Doe - Affiliate Link",
      "clicks": 1000,
      "impressions": 5000,
      "installs": 50,
      "conversions": 10,
      "revenue": 5000,
      "status": "active",
      "createdAt": "2026-01-16T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 1
  },
  "linkTemplate": {
    "id": "template_id",
    "name": "Template Name"
  }
}
```

### 2. Get All Links for a Template (All affiliate links)

**Endpoint**: `GET /internal/link/{templateId}`

**Purpose**: Get all links created from an affiliate's template

**Request**:
```bash
curl -X GET 'https://api.apptrove.com/internal/link/{templateId}' \
  -H 'api-key: YOUR_API_KEY' \
  -H 'Accept: application/json' \
  -G --data-urlencode 'page=1' \
  --data-urlencode 'limit=100' \
  --data-urlencode 'status=active'
```

**Use Case**: If an affiliate has multiple links, this returns all of them with individual stats.

### 3. Get All Templates

**Endpoint**: `GET /internal/link-template`

**Purpose**: List all templates (one per affiliate)

**Request**:
```bash
curl -X GET 'https://api.apptrove.com/internal/link-template' \
  -H 'api-key: YOUR_API_KEY' \
  -H 'Accept: application/json' \
  -G --data-urlencode 'status=active' \
  --data-urlencode 'limit=100'
```

## Backend API Endpoints

### 1. Sync Analytics for a User

```bash
POST /api/users/:id/sync-analytics
```

**What it does**:
- Fetches latest data from AppTrove
- Saves to local database
- Returns current stats

**Use this**: When you want to manually refresh analytics data

### 2. Get User Analytics

```bash
GET /api/users/:id/analytics?startDate=2026-01-01&endDate=2026-01-31
```

**What it does**:
- Tries AppTrove API first
- Falls back to local data
- Returns formatted analytics

**Use this**: To display analytics in user dashboard

### 3. Get Template Links

```bash
GET /api/templates/:templateId/links?page=1&limit=100
```

**What it does**:
- Returns all links for a template
- Includes pagination
- Shows individual link stats

**Use this**: To see all links for an affiliate

## Data Flow

```
1. Affiliate Approved
   ↓
2. Create Template (POST /internal/link-template)
   ↓
3. Create UniLink (POST /internal/link-template/{id}/link)
   ↓
4. Store linkId and templateId in database
   ↓
5. User shares link → AppTrove tracks clicks/installs/purchases
   ↓
6. Fetch analytics (GET /internal/link/{linkId})
   ↓
7. Display in dashboard
```

## Setting Up Automated Sync

### Option 1: Cron Job (Recommended)

Add to your server's crontab:

```bash
# Sync analytics every hour
0 * * * * curl -X POST http://localhost:3001/api/analytics/sync-all
```

### Option 2: Scheduled Endpoint

Create an endpoint that syncs all users:

```javascript
// In server.js
app.post('/api/analytics/sync-all', isAdmin, async (req, res) => {
  const db = await readDB();
  const approvedUsers = db.users.filter(u => u.approvalStatus === 'approved');
  
  const results = await Promise.all(
    approvedUsers.map(user => syncUserAnalytics(user.id))
  );
  
  res.json({ synced: results.length, results });
});
```

## Understanding the Data

### Metrics Explained

- **Clicks**: Total number of link clicks
- **Impressions**: Times link was displayed (for ads)
- **Installs**: App installations from the link
- **Conversions**: Purchases/subscriptions completed
- **Revenue**: Total revenue generated (in your currency)

### Conversion Rate

```javascript
conversionRate = (conversions / clicks) * 100
installRate = (installs / clicks) * 100
```

### Revenue Metrics

- **ARPU** (Average Revenue Per User): `revenue / installs`
- **ARPPU** (Average Revenue Per Paying User): `revenue / conversions`

## Example: Complete Analytics Flow

```javascript
// 1. Approve affiliate (creates template + link)
POST /api/users/:id/approve
// Response: { unilink: "https://track.u9ilnk.me/abc123", linkId: "xyz", templateId: "tpl123" }

// 2. Affiliate shares link → Users click → Install → Purchase

// 3. Fetch analytics
GET /api/users/:id/analytics
// Response: { clicks: 1000, installs: 50, conversions: 10, revenue: 5000 }

// 4. Sync latest data
POST /api/users/:id/sync-analytics
// Fetches from AppTrove and updates local database
```

## Troubleshooting

### No Data Showing

1. **Check link was created**: Verify in AppTrove dashboard
2. **Check link is active**: Status should be "active"
3. **Wait for data**: AppTrove may take a few minutes to update
4. **Verify linkId**: Ensure linkId is stored correctly in database

### API Errors

1. **401 Unauthorized**: Check API key is correct
2. **404 Not Found**: Link ID might be wrong
3. **400 Bad Request**: Check request parameters

### Data Not Syncing

1. Check server logs for errors
2. Verify AppTrove API key is set
3. Test API key directly with curl
4. Check AppTrove dashboard for link status

## Best Practices

1. **Sync Regularly**: Set up hourly/daily sync for all affiliates
2. **Cache Data**: Store AppTrove data locally to reduce API calls
3. **Error Handling**: Always handle API failures gracefully
4. **Rate Limiting**: Don't sync too frequently (AppTrove may rate limit)
5. **Monitor**: Check logs for sync failures

## Next Steps

1. ✅ Set up environment variables
2. ✅ Approve an affiliate to create unilink
3. ✅ Test analytics sync endpoint
4. ✅ Set up automated sync (cron job)
5. ✅ Display analytics in user dashboard

For more details, see `APPTROVE_SETUP.md`
