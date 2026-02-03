# Trackier API Integration Guide

## Overview
If AppTrove stats API is not available, you can use Trackier for comprehensive affiliate tracking.

## Trackier Setup

### 1. Get Trackier Credentials
- Login to Trackier Dashboard: https://panel.trackier.com
- Go to Settings → API Settings
- Copy your API Key

### 2. Add Environment Variables

Add to Vercel Environment Variables:
```
TRACKIER_API_KEY=your_api_key_here
TRACKIER_API_URL=https://api.trackier.com/v2
TRACKIER_ADVERTISER_ID=your_advertiser_id
```

### 3. Trackier API Endpoints

#### Get Conversions
```
GET /api/v2/conversions
Headers:
  X-Api-Key: YOUR_API_KEY
Params:
  start: YYYY-MM-DD
  end: YYYY-MM-DD
  goal_id: YOUR_GOAL_ID (optional)
  affiliate_id: AFFILIATE_ID (optional)
```

#### Get Clicks
```
GET /api/v2/clicks
Headers:
  X-Api-Key: YOUR_API_KEY
Params:
  start: YYYY-MM-DD
  end: YYYY-MM-DD
  affiliate_id: AFFILIATE_ID (optional)
```

#### Get Affiliate Stats
```
GET /api/v2/reports/affiliates
Headers:
  X-Api-Key: YOUR_API_KEY
Params:
  start: YYYY-MM-DD
  end: YYYY-MM-DD
  affiliate_id: AFFILIATE_ID
```

## Implementation

### Create Trackier API Endpoint

**File: `api/trackier/stats.ts`**
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { affiliateId, startDate, endDate } = req.query;

  const TRACKIER_API_KEY = process.env.TRACKIER_API_KEY;
  const TRACKIER_API_URL = process.env.TRACKIER_API_URL || 'https://api.trackier.com/v2';

  if (!TRACKIER_API_KEY) {
    return res.status(500).json({ error: 'Trackier API key not configured' });
  }

  try {
    // Fetch stats from Trackier
    const response = await fetch(
      `${TRACKIER_API_URL}/reports/affiliates?` + new URLSearchParams({
        affiliate_id: affiliateId as string,
        start: startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: endDate as string || new Date().toISOString().split('T')[0],
      }),
      {
        headers: {
          'X-Api-Key': TRACKIER_API_KEY,
          'Accept': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.message || 'Failed to fetch Trackier stats',
      });
    }

    // Transform Trackier data to match our format
    const stats = {
      clicks: data.clicks || 0,
      conversions: data.conversions || 0,
      installs: data.installs || 0,
      revenue: data.revenue || 0,
      earnings: data.payout || 0,
    };

    return res.status(200).json({
      success: true,
      stats,
      source: 'trackier',
    });
  } catch (error: any) {
    console.error('Trackier API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch stats from Trackier',
      details: error.message,
    });
  }
}
```

### Update Frontend to Use Trackier

**Update `frontend/src/lib/apptrove.ts`:**
```typescript
export async function fetchTrackierStats(affiliateId: string, startDate?: string, endDate?: string) {
  const BACKEND_URL = getBackendUrl();
  
  try {
    const params = new URLSearchParams({
      affiliateId,
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: endDate || new Date().toISOString().split('T')[0],
    });

    const response = await fetch(`${BACKEND_URL}/api/trackier/stats?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        success: true,
        stats: data.stats,
        source: 'trackier',
      };
    }

    return {
      success: false,
      stats: null,
      error: data.error || 'Failed to fetch Trackier stats',
    };
  } catch (error: any) {
    return {
      success: false,
      stats: null,
      error: error.message || 'Network error',
    };
  }
}
```

## Testing

### Test AppTrove Stats (Current Setup)
```bash
# Check if AppTrove stats work
curl -X GET "https://partners-adda.vercel.app/api/apptrove/stats?linkId=Smritibisht" \
  -H "Accept: application/json"
```

### Test Trackier Stats (After Implementation)
```bash
# Test Trackier endpoint
curl -X GET "https://partners-adda.vercel.app/api/trackier/stats?affiliateId=123&startDate=2026-01-01&endDate=2026-02-03" \
  -H "Accept: application/json"
```

## Debugging Current Issue

### Check AppTrove Stats Manually
1. **Login to AppTrove Dashboard**
2. **Navigate to Links/Reports**
3. **Find link `Smritibisht`**
4. **Check if stats are available in the UI**

### Common Issues
- ❌ **Link has no activity yet** - Stats will be empty/not available
- ❌ **AppTrove doesn't provide stats API** - Use Trackier instead
- ❌ **Wrong API key** - Verify in Vercel env vars
- ❌ **Link not found** - Verify linkId is correct

## Recommended Solution

**Use Trackier for production tracking:**
- ✅ More reliable API
- ✅ Better documentation
- ✅ Detailed conversion tracking
- ✅ Real-time stats
- ✅ Affiliate management

**Keep AppTrove for:**
- ✅ Link generation
- ✅ Attribution
- ✅ Deep linking
