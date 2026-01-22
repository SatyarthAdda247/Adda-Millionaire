# Vercel Environment Variables Setup for AppTrove

## Required Environment Variables

Add these to your Vercel project:

### Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

## AppTrove Credentials

### 1. Secret ID & Key (Primary Authentication)
```
APPTROVE_SECRET_ID = 696dd5aa03258f6b929b7e97
APPTROVE_SECRET_KEY = f5a2d4a4-5389-429a-8aa9-cf0d09e9be86
```

**OR use VITE_ prefix for frontend access:**
```
VITE_APPTROVE_SECRET_ID = 696dd5aa03258f6b929b7e97
VITE_APPTROVE_SECRET_KEY = f5a2d4a4-5389-429a-8aa9-cf0d09e9be86
```

### 2. SDK Key
```
APPTROVE_SDK_KEY = 5d11fe82-cab7-4b00-87d0-65a5fa40232f
```
**OR:**
```
VITE_APPTROVE_SDK_KEY = 5d11fe82-cab7-4b00-87d0-65a5fa40232f
```

### 3. Reporting API Key (for stats)
```
APPTROVE_REPORTING_API_KEY = 297c9ed1-c4b7-4879-b80a-1504140eb65e
```
**OR:**
```
VITE_APPTROVE_REPORTING_API_KEY = 297c9ed1-c4b7-4879-b80a-1504140eb65e
```

### 4. S2S API Key (Server-to-Server)
```
APPTROVE_S2S_API = 82aa3b94-bb98-449d-a372-4a8a98e319f0
```
**OR:**
```
VITE_APPTROVE_S2S_API = 82aa3b94-bb98-449d-a372-4a8a98e319f0
```

### 5. API Key (Alternative - can use S2S API key)
```
APPTROVE_API_KEY = 82aa3b94-bb98-449d-a372-4a8a98e319f0
```
**OR:**
```
VITE_APPTROVE_API_KEY = 82aa3b94-bb98-449d-a372-4a8a98e319f0
```

### 6. Domain (Optional - has default)
```
APPTROVE_DOMAIN = applink.reevo.in
```
**OR:**
```
VITE_APPTROVE_DOMAIN = applink.reevo.in
```

### 7. Android App ID (Package Name - from Google Play URL)
```
APPTROVE_ANDROID_APP_ID = com.addaeducation.reevo
```

**From your Google Play URL:** `https://play.google.com/store/apps/details?id=com.addaeducation.reevo&hl=en_IN`
The package name is: `com.addaeducation.reevo`

## Quick Setup Steps

1. **Go to Vercel Dashboard**
2. **Select your project** (partners-adda)
3. **Settings → Environment Variables**
4. **Add each variable above**
5. **Select environments:** Production, Preview, Development (select all)
6. **Save**
7. **Redeploy** (or wait for auto-deploy)

## Recommended Minimum Set

At minimum, add these (they're the most important):

```
APPTROVE_SECRET_ID = 696dd5aa03258f6b929b7e97
APPTROVE_SECRET_KEY = f5a2d4a4-5389-429a-8aa9-cf0d09e9be86
APPTROVE_SDK_KEY = 5d11fe82-cab7-4b00-87d0-65a5fa40232f
APPTROVE_REPORTING_API_KEY = 297c9ed1-c4b7-4879-b80a-1504140eb65e
APPTROVE_ANDROID_APP_ID = com.addaeducation.reevo
```

## Notes

- **VITE_ prefix**: Variables with `VITE_` prefix are exposed to frontend code
- **Without VITE_**: Only available in serverless functions (more secure)
- **Both work**: The code checks both `VITE_APPTROVE_*` and `APPTROVE_*` formats
- **Hardcoded fallbacks**: Code has hardcoded values as last resort, but environment variables take priority

## After Adding Variables

1. **Redeploy** your project
2. **Test link creation** by approving an affiliate
3. **Check Vercel logs** if errors persist
