# How to Get Template Data for Link Creation

## Quick Method: From Browser Console

1. **Open your deployed site** (https://partners-adda.vercel.app)
2. **Open Browser Console** (F12 or Right-click → Inspect → Console)
3. **Go to Admin Dashboard** and approve an affiliate
4. **Check the console logs** - we log template data when fetching templates

Look for logs like:
```
[AppTrove] Template found: {
  name: "...",
  domain: "...",
  androidAppID: "...",
  ...
}
```

## Manual Method: From AppTrove Dashboard

Based on your screenshot, here's what to look for:

### Step 1: Find Android Package Name

**Option A: From Template Editor**
1. Go to AppTrove Dashboard → Templates
2. Click "Edit Template" for "Millionaires Adda"
3. Look for "Android Application" section
4. Click on "Reevo Learn to Speak English" or expand Android settings
5. Find "Package Name" or "Application ID"
   - Format: `com.reevo.learn` or similar
   - This is what we need!

**Option B: From Google Play Store**
1. Search Google Play for "Reevo Learn to Speak English"
2. Open the app page
3. Look at the URL: `https://play.google.com/store/apps/details?id=COM.PACKAGE.NAME`
4. Copy the part after `id=` (this is the package name)

**Option C: From Browser Network Tab**
1. Open AppTrove Dashboard → Templates → Edit Template
2. Open Browser DevTools → Network tab
3. Filter by "api" or "template"
4. Find the API call that loads template data
5. Click on it → Response tab
6. Look for fields like:
   - `androidAppID`
   - `packageName`
   - `androidPackage`
   - `android.packageName`
   - `androidApplication.packageName`

### Step 2: Set Environment Variable

Once you have the Android Package Name:

1. **Go to Vercel Dashboard**
2. **Project Settings → Environment Variables**
3. **Add new variable:**
   - Key: `APPTROVE_ANDROID_APP_ID`
   - Value: `[the-package-name-you-found]`
   - Example: `com.reevo.learn` or `com.adda247.reevo`

4. **Redeploy** (or wait for auto-deploy)

### Step 3: Test Link Creation

After setting the environment variable:
1. Go to Admin Dashboard
2. Approve an affiliate
3. Check console logs - should see:
   ```
   [AppTrove] ✅ Using URL construction fallback
   [AppTrove] Constructed URL: https://click.trackier.io/c/[androidAppID]?...
   ```

## What We Already Have

✅ **Template ID**: `wBehUW` (Millionaires Adda)  
✅ **Domain**: `applink.reevo.in` (from your screenshot)  
❓ **Android App ID**: Need to find (package name)

## Current Data from Your Screenshot

- Template Name: **Millionaires Adda**
- Sub Domain: **applink.reevo.in**
- Android Application: **Reevo Learn to Speak English** (app name, not package name)

We need the **package name** (Android App ID), which is different from the app name.

## Alternative: Check Existing Links

If you already have links created in AppTrove:
1. Go to Templates → Millionaires Adda → Links
2. Click on any existing link
3. Check the link URL structure
4. The Android App ID might be visible in the tracking URL parameters
