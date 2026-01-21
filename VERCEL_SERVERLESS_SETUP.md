# Vercel Serverless Functions Setup

## Overview

The app uses **Vercel Serverless Functions** to bypass CORS restrictions when calling AppTrove API. These functions are deployed **automatically with your frontend** - no separate backend server needed!

## How It Works

1. **Frontend** calls `/api/apptrove/create-link` or `/api/apptrove/templates` (same domain, no CORS)
2. **Serverless Function** calls AppTrove API (server-to-server, no CORS)
3. **Serverless Function** returns response to frontend

## Environment Variables

The serverless functions can access environment variables **with or without** the `VITE_` prefix. You can use either:

### Option 1: Keep VITE_ prefix (recommended - works for both frontend and serverless)
```
VITE_APPTROVE_SECRET_ID=696dd5aa03258f6b929b7e97
VITE_APPTROVE_SECRET_KEY=f5a2d4a4-5389-429a-8aa9-cf0d09e9be86
```

### Option 2: Without VITE_ prefix (serverless functions only)
```
APPTROVE_SECRET_ID=696dd5aa03258f6b929b7e97
APPTROVE_SECRET_KEY=f5a2d4a4-5389-429a-8aa9-cf0d09e9be86
```

**Note:** The functions check both, so your existing `VITE_` prefixed variables will work!

## Files Created

- `api/apptrove/create-link.ts` - Creates UniLink in AppTrove template
- `api/apptrove/templates.ts` - Fetches AppTrove templates

## Deployment

Vercel automatically detects and deploys functions in the `api/` directory. No additional configuration needed!

## Testing Locally

To test serverless functions locally, install Vercel CLI:
```bash
npm i -g vercel
vercel dev
```

Or use the Vercel extension in VS Code.

## Troubleshooting

If functions don't work:
1. Check Vercel deployment logs for errors
2. Verify environment variables are set in Vercel dashboard
3. Check that functions are deployed (should see them in Vercel Functions tab)
