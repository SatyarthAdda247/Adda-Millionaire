# Trackier API Setup Guide

## Overview
AppTrove unilinks are tracked by Trackier (AppTrove is Trackier's MMP platform). To fetch unilink stats (installs, conversions, clicks, revenue), you need to use Trackier's Publisher API.

## Step 1: Get Trackier API Credentials

1. **Login to Trackier Dashboard**
   - Go to: https://panel.trackier.com
   - Login with your AppTrove/Trackier account

2. **Navigate to API Settings**
   - Go to **Settings** → **API Settings**
   - Or go to **Publisher** → **API Settings**

3. **Generate/Copy API Key**
   - Find your **Publisher API Key** (or **Advertiser API Key** if you're the advertiser)
   - Copy the API key

## Step 2: Add to Vercel Environment Variables

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add these variables:

```
TRACKIER_API_KEY=your_publisher_api_key_here
TRACKIER_PUBLISHER_API_KEY=your_publisher_api_key_here  (optional, same as above)
TRACKIER_API_URL=https://api.trackier.com/v2  (optional, defaults to this)
```

**Important:** 
- Use **Publisher API Key** if you're tracking affiliate/partner performance
- Use **Advertiser API Key** if you're tracking your own campaigns
- The API key format is usually a UUID or long string

## Step 3: Whitelist Your Server IP (If Required)

Some Trackier accounts require IP whitelisting:

1. Go to **Settings** → **API Settings** → **IP Whitelist**
2. Add Vercel's IP ranges (or your server IP if deploying on AWS)
3. For Vercel, you may need to contact Trackier support to whitelist Vercel's dynamic IPs

## Step 4: Test the Integration

After deploying, test the Trackier stats endpoint:

```
https://partners-adda.vercel.app/api/trackier/stats?unilink=https://applink.reevo.in/d/Smritibisht
```

Or with affiliate ID:

```
https://partners-adda.vercel.app/api/trackier/stats?affiliateId=Smritibisht
```

## How It Works

### Unilink Format
Your unilinks look like:
```
https://applink.reevo.in/d/Smritibisht?pid=...&camp=...&cost_value=...
```

The Trackier API endpoint will:
1. Extract the affiliate ID from the path (`Smritibisht`)
2. Extract the campaign ID from query params (`camp=...`)
3. Query Trackier's Publisher API for stats
4. Return aggregated data: clicks, conversions, installs, revenue, earnings

### Data Returned

```json
{
  "success": true,
  "stats": {
    "clicks": 150,
    "conversions": 45,
    "installs": 42,
    "revenue": 1250.50,
    "earnings": 875.35,
    "impressions": 200,
    "conversionRate": 30.00
  },
  "source": "trackier",
  "period": {
    "start": "2026-01-01",
    "end": "2026-02-03"
  }
}
```

## Troubleshooting

### Error: "Trackier API key not configured"
- ✅ Check that `TRACKIER_API_KEY` is set in Vercel environment variables
- ✅ Redeploy after adding the variable
- ✅ Check that the variable name matches exactly (case-sensitive)

### Error: "Failed to fetch stats from Trackier"
- ✅ Verify your API key is correct
- ✅ Check if IP whitelisting is required
- ✅ Ensure the affiliate/campaign ID exists in Trackier
- ✅ Check Trackier dashboard to see if there's any data for that affiliate

### Error: "401 Unauthorized"
- ✅ API key is invalid or expired
- ✅ Wrong API key type (using Advertiser key instead of Publisher key, or vice versa)
- ✅ IP not whitelisted (if required)

### No Data Returned
- ✅ Check if the unilink has any clicks/installs yet
- ✅ Verify the date range (defaults to last 30 days)
- ✅ Check Trackier dashboard to confirm data exists
- ✅ Ensure the affiliate ID matches exactly (case-sensitive)

## Trackier API Endpoints Used

The integration tries these Trackier endpoints:

1. **Publisher Affiliate Reports**
   ```
   GET /v2/publisher/reports/affiliates?affiliate_id=...&start=...&end=...
   ```

2. **Publisher Campaign Reports**
   ```
   GET /v2/publisher/reports/campaigns?campaign_id=...&start=...&end=...
   ```

3. **Conversions API**
   ```
   GET /v2/conversions?affiliate_id=...&start=...&end=...
   ```

4. **Clicks API**
   ```
   GET /v2/clicks?affiliate_id=...&start=...&end=...
   ```

All endpoints use the `X-Api-Key` header for authentication.

## Support

If you need help:
1. Check Trackier documentation: https://help.trackier.com
2. Contact Trackier support via their dashboard
3. Check your Trackier dashboard to verify data exists

---

**After adding `TRACKIER_API_KEY` to Vercel, redeploy and test!** 🚀
