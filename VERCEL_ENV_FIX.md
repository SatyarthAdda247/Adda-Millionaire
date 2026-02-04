# ⚠️ Vercel Environment Variable Fix Required

## Problem Found
Your `APPTROVE_DOMAIN` environment variable is set to:
```
applink.learnr.co.in
```

This is your **link domain** (where affiliate links redirect), NOT your **API domain**.

## Solution

### Option 1: Update APPTROVE_DOMAIN (Recommended)
Change `APPTROVE_DOMAIN` in Vercel environment variables to:
```
https://api.apptrove.com
```

### Option 2: Add APPTROVE_API_URL
Keep `APPTROVE_DOMAIN` as is, and add a new variable:
```
APPTROVE_API_URL=https://api.apptrove.com
```

## How to Update

1. Go to **Vercel Dashboard** → Your Project
2. Navigate to **Settings** → **Environment Variables**
3. Find `APPTROVE_DOMAIN`
4. Click **Edit**
5. Change value to: `https://api.apptrove.com`
6. Click **Save**
7. **Redeploy** (Settings → Deployments → Latest → Redeploy)

## What These Domains Are For

| Domain | Purpose | Example |
|--------|---------|---------|
| `applink.learnr.co.in` | **Link Domain** - Where your affiliate links redirect users | `https://applink.learnr.co.in/d/Smritibisht` |
| `api.apptrove.com` | **API Domain** - Where your code makes API requests for templates, stats, etc. | `https://api.apptrove.com/internal/link-template` |

## Temporary Fix (Already Applied)

I've updated the code to auto-detect this issue and use `https://api.apptrove.com` when it sees a link domain (`applink.*`). 

**But you should still update your Vercel environment variable to avoid confusion.**

---

After updating, test again:
```
https://partners-adda.vercel.app/api/apptrove/test-stats?linkId=Smritibisht
```

This should now make real API requests to `api.apptrove.com` instead of the link domain (`applink.*`)! 🎯
