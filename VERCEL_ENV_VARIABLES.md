# Vercel Environment Variables Setup

Add these environment variables in **Vercel Project → Settings → Environment Variables**

## Required for AppTrove API (UniLink Creation)

### Option 1: SDK Key (Recommended - Already configured in code)
```
VITE_APPTROVE_SDK_KEY=5d11fe82-cab7-4b00-87d0-65a5fa40232f
```
**Note:** This is already hardcoded as fallback, but you can override it in Vercel.

### Option 2: API Key
```
VITE_APPTROVE_API_KEY=your_api_key_here
```

### Option 3: Secret ID + Secret Key (Fallback)
```
VITE_APPTROVE_SECRET_ID=696dd5aa03258f6b929b7e97
VITE_APPTROVE_SECRET_KEY=f5a2d4a4-5389-429a-8aa9-cf0d09e9be86
```

### Reporting API Key (For Analytics/Stats - Already configured in code)
```
VITE_APPTROVE_REPORTING_API_KEY=297c9ed1-c4b7-4879-b80a-1504140eb65e
```
**Note:** This is already hardcoded as fallback, but you can override it in Vercel.

### Optional: Custom API URL
```
VITE_APPTROVE_API_URL=https://api.apptrove.com
```

### Summary
- **SDK Key** and **Reporting API Key** are already hardcoded in the serverless functions
- You can optionally add them to Vercel environment variables to override
- If you have a different API Key, use `VITE_APPTROVE_API_KEY`

## Required for DynamoDB (Data Storage)

```
VITE_AWS_REGION=ap-south-1
VITE_AWS_ACCESS_KEY_ID=your_aws_access_key_id
VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
```

### Optional: Custom Table Names
```
VITE_DYNAMODB_USERS_TABLE=edurise-users
VITE_DYNAMODB_LINKS_TABLE=edurise-links
VITE_DYNAMODB_ANALYTICS_TABLE=edurise-analytics
```

## Summary

**Minimum Required:**
- `VITE_APPTROVE_API_KEY` OR (`VITE_APPTROVE_SECRET_ID` + `VITE_APPTROVE_SECRET_KEY`)
- `VITE_AWS_REGION`
- `VITE_AWS_ACCESS_KEY_ID`
- `VITE_AWS_SECRET_ACCESS_KEY`

**Note:** The AppTrove Secret ID and Secret Key shown above are from the previous backend configuration. If you have different credentials, use those instead.
