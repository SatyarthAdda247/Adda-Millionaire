# Vercel Environment Variables Setup

Add these environment variables in **Vercel Project → Settings → Environment Variables**

## Required for AppTrove API (UniLink Creation)

### Option 1: API Key (Preferred)
```
VITE_APPTROVE_API_KEY=your_api_key_here
```

### Option 2: Secret ID + Secret Key (Fallback)
```
VITE_APPTROVE_SECRET_ID=696dd5aa03258f6b929b7e97
VITE_APPTROVE_SECRET_KEY=f5a2d4a4-5389-429a-8aa9-cf0d09e9be86
```

### Optional: Custom API URL
```
VITE_APPTROVE_API_URL=https://api.apptrove.com
```

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
