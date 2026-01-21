# AppTrove API Fix - All Calls Now Use Serverless Functions

## Issue
Direct API calls to `api.apptrove.com` were causing CORS errors. All calls now go through Vercel serverless functions.

## Solution
All AppTrove API calls now use these serverless function endpoints:

1. **Templates**: `/api/apptrove/templates`
2. **Template Links**: `/api/apptrove/template-links?templateId=xxx`
3. **Create Link**: `/api/apptrove/create-link`
4. **Stats**: `/api/apptrove/stats?linkId=xxx`

## Important Notes

### Browser Cache
If you're still seeing CORS errors, **clear your browser cache** or do a hard refresh:
- **Chrome/Edge**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- **Firefox**: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- **Safari**: `Cmd+Option+R`

### Vercel Deployment
After pushing to GitHub, wait for Vercel to finish deploying. Check the Vercel dashboard to ensure the latest deployment is live.

### Verification
Open browser DevTools → Network tab and check that all AppTrove calls go to `/api/apptrove/*` (not `api.apptrove.com`).

## Serverless Functions Location
- `api/apptrove/templates.ts`
- `api/apptrove/template-links.ts`
- `api/apptrove/create-link.ts`
- `api/apptrove/stats.ts`

All functions use the SDK Key (`5d11fe82-cab7-4b00-87d0-65a5fa40232f`) as fallback authentication.
