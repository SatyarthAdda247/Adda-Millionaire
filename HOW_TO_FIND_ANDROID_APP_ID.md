# Where to Find Android App ID - Step by Step Guide

## Method 1: From AppTrove Template Editor (Easiest)

Based on your screenshot, you're already in the right place!

### Steps:

1. **You're already here**: AppTrove Dashboard → Templates → Edit Template → "Millionaires Adda"

2. **Look at the right panel** ("Review the details"):
   - You see: **Android Application: Reevo Learn to Speak English**
   - This is the app NAME, but we need the PACKAGE NAME

3. **Click on "Reevo Learn to Speak English"** or find the Android Application section:
   - Look for a clickable link/button next to the app name
   - Or scroll down to find "Android Application" settings section
   - Look for fields like:
     - **Package Name**
     - **Application ID**
     - **App ID**
     - **Android Package**

4. **The Package Name looks like**:
   - `com.reevo.learn`
   - `com.adda247.reevo`
   - `com.reevo.learnenglish`
   - Format: `com.company.appname` (lowercase, dots, no spaces)

## Method 2: From Basic Details Tab

1. **Go back to "Basic Details" tab** (first step in your template editor)
2. **Look for "Android Application" field**
3. **Click on it or expand it** - it should show:
   - App Name: Reevo Learn to Speak English
   - **Package Name**: [This is what we need!]

## Method 3: From Google Play Store

1. **Open Google Play Store** (web or app)
2. **Search**: "Reevo Learn to Speak English"
3. **Open the app page**
4. **Look at the URL**:
   ```
   https://play.google.com/store/apps/details?id=COM.PACKAGE.NAME
   ```
5. **Copy the part after `id=`** - that's your Android App ID!

## Method 4: From Browser Network Tab (Advanced)

1. **Open AppTrove Dashboard** → Edit Template
2. **Open Browser DevTools** (F12)
3. **Go to Network tab**
4. **Filter by**: `api` or `template`
5. **Reload the page** or navigate between tabs
6. **Find API call** that loads template data (look for `/link-template` or `/template`)
7. **Click on it** → **Response tab**
8. **Search for**:
   - `androidAppID`
   - `packageName`
   - `androidPackage`
   - `android.packageName`

## Method 5: Check Existing Links

If you already have links created:

1. **Go to**: Templates → Millionaires Adda → **Links** (or "Deep Links")
2. **Click on any existing link**
3. **Check the link URL** - it might contain the Android App ID in parameters
4. **Or check link details** - Android App ID might be shown there

## Method 6: From Your Site's Console Logs

1. **Open your deployed site**: https://partners-adda.vercel.app
2. **Open Browser Console** (F12 → Console tab)
3. **Go to Admin Dashboard**
4. **Approve an affiliate** (or just load the dashboard)
5. **Look for logs** that show template data:
   ```
   [AppTrove] Template found: {
     name: "...",
     domain: "...",
     androidAppID: "...",  ← This is what we need!
   }
   ```

## What to Do Once You Find It

1. **Copy the Package Name** (e.g., `com.reevo.learn`)

2. **Add to Vercel Environment Variables**:
   - Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
   - Click: **Add New**
   - Key: `APPTROVE_ANDROID_APP_ID`
   - Value: `[the-package-name-you-found]`
   - Environment: Production, Preview, Development (select all)
   - Click: **Save**

3. **Redeploy** (or wait for auto-deploy)

4. **Test**: Approve an affiliate and check if link creation works!

## Quick Checklist

- [ ] Found Package Name from AppTrove Dashboard
- [ ] Added `APPTROVE_ANDROID_APP_ID` to Vercel environment variables
- [ ] Redeployed (or waiting for auto-deploy)
- [ ] Tested link creation by approving an affiliate

## Still Can't Find It?

If you can't find it in the dashboard:
1. **Take a screenshot** of the Android Application section
2. **Or check the browser console** when loading the template editor
3. **Or share the Google Play Store URL** for the app

The Android App ID is essential for the URL construction fallback to work when API endpoints fail.
