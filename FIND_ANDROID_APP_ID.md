# How to Find Android App ID for Link Creation

## From AppTrove Dashboard

1. **Go to Template Editor** (as shown in your screenshot)
   - Navigate to: Templates → Edit Template → "Millionaires Adda"

2. **Check the Review Sidebar** (right panel)
   - Look for "Android Application" field
   - It shows: "Reevo Learn to Speak English"
   - This is the app name, but we need the **package name**

3. **Find Package Name** (Android App ID):
   
   **Option A: From Template Details**
   - In the template editor, look for "Android Application" section
   - Click on the app name or expand Android settings
   - The package name usually looks like: `com.reevo.learn` or `com.adda247.reevo`
   - It's typically shown as "Package Name" or "Application ID"

   **Option B: From Google Play Store**
   - Search for "Reevo Learn to Speak English" on Google Play
   - The package name is in the URL: `https://play.google.com/store/apps/details?id=COM.PACKAGE.NAME`
   - Copy the part after `id=`

   **Option C: From AppTrove API Response**
   - The template API response should include `androidAppID`, `packageName`, or `androidPackage` field
   - Check browser console when templates load - we log this data

4. **Set as Environment Variable** (if not in template data):
   ```bash
   APPTROVE_ANDROID_APP_ID=com.reevo.learn  # Replace with actual package name
   ```
   
   In Vercel:
   - Go to: Project Settings → Environment Variables
   - Add: `APPTROVE_ANDROID_APP_ID` = `[package-name]`

## What We're Looking For

The Android App ID (package name) is used to construct tracking URLs when API endpoints fail. It's typically:
- Format: `com.company.appname` (lowercase, dots, no spaces)
- Example: `com.reevo.learn` or `com.adda247.reevo`

## Current Status

- ✅ Domain: `applink.reevo.in` (from template)
- ❓ Android App ID: Need to find from template or dashboard
- ✅ Template ID: `wBehUW` (Millionaires Adda)

Once we have the Android App ID, link creation will work via URL construction fallback even if API endpoints return 404.
