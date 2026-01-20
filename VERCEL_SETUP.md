# Vercel Deployment Setup for adda-millionaire.vercel.app

This guide will help you configure the application to work on `adda-millionaire.vercel.app`.

## Quick Setup

### 1. Set Environment Variable in Vercel (REQUIRED)

**This is the most important step!** Without this, forms will not work.

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project (`adda-millionaire` or similar)
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add the following:

```
Name: VITE_API_URL
Value: https://your-backend-url.com
```

**Important:** 
- Replace `https://your-backend-url.com` with your actual backend API URL (e.g., `https://edurise-backend.railway.app`)
- Make sure to include `https://` (not `http://`)
- Do NOT include a trailing slash (`/`)
- Select **Production**, **Preview**, and **Development** environments
6. Click **Save**
7. **Redeploy** your application (go to Deployments → click the three dots → Redeploy)

**Example:**
```
VITE_API_URL=https://edurise-backend.railway.app
```

### 2. Backend Deployment

The backend needs to be deployed separately. Options:

- **Railway** (Recommended): https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com
- **Any Node.js hosting**: Your backend server URL

### 3. Backend CORS Configuration

Ensure your backend `server/server.js` includes the frontend domain in CORS:

```javascript
const allowedOrigins = [
  'https://adda-millionaire.vercel.app',
  // ... other origins
];
```

The backend already includes this domain, but verify it's correct.

### 4. Environment Variables Checklist

#### Frontend (Vercel)
- `VITE_API_URL` - Your backend API URL (e.g., `https://your-backend.railway.app`)

#### Backend (Railway/Render/etc.)
- `PORT` - Server port (usually 3001)
- `NODE_ENV` - Set to `production`
- `FRONTEND_URL` - `https://adda-millionaire.vercel.app`
- `APPTROVE_API_KEY` - Your AppTrove API key
- `APPTROVE_SECRET_ID` - Your AppTrove Secret ID
- `APPTROVE_SECRET_KEY` - Your AppTrove Secret Key
- `DB_PATH` - Database file path (e.g., `./data/database.json`)
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID (for admin login)
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `ADMIN_EMAILS` - Comma-separated admin emails
- `SESSION_SECRET` - Random secret string

## How It Works

The application uses a centralized API configuration (`src/lib/apiConfig.ts`) that:

1. **First checks** `VITE_API_URL` environment variable (set in Vercel)
2. **Auto-detects** if running on Vercel domain
3. **Falls back** to localhost for local development

## Testing

### Step 1: Test Backend Health
Visit your backend URL in a browser:
```
https://your-backend-url.com/api/health
```

Expected response:
```json
{"status":"ok","message":"Server is running"}
```

If this doesn't work, your backend is not accessible. Fix this first!

### Step 2: Test Frontend
1. Visit `https://adda-millionaire.vercel.app`
2. Open browser DevTools (F12) → Console tab
3. Look for any errors related to API calls
4. Check if `API_BASE_URL` is logged correctly

### Step 3: Test Form Submission
1. Go to the registration form on your Vercel site
2. Fill out the form with test data
3. Submit the form
4. Check browser DevTools → Network tab
5. Look for POST request to `/api/users/register`
6. Verify:
   - Request URL should be `https://your-backend-url.com/api/users/register`
   - Status should be `201 Created` (success) or `400/409` (validation error)
   - Response should contain user data

### Step 4: Verify Data Saved
1. Check your backend database/logs
2. Verify the user was created
3. Try admin login to see the new user in the dashboard

## Troubleshooting

### Form Submission Not Working / "Failed to fetch" Error

**Most Common Issue:** `VITE_API_URL` is not set or incorrect.

1. **Check Environment Variable:**
   - Go to Vercel → Settings → Environment Variables
   - Verify `VITE_API_URL` exists and is correct
   - Make sure it's set for **Production** environment
   - **Redeploy** after adding/changing environment variables

2. **Verify Backend is Accessible:**
   ```bash
   curl https://your-backend-url.com/api/health
   ```
   Should return: `{"status":"ok","message":"Server is running"}`

3. **Check Browser Console:**
   - Open DevTools → Console
   - Look for API URL warnings
   - Check Network tab for failed requests

### CORS Errors

**Error:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solution:**
1. Verify backend CORS includes `https://adda-millionaire.vercel.app`
2. Check backend `server.js` has:
   ```javascript
   const allowedOrigins = [
     'https://adda-millionaire.vercel.app',
     // ... other origins
   ];
   ```
3. Ensure backend allows `*.vercel.app` pattern
4. Restart backend server after CORS changes

### API Connection Errors

**Error:** `Unable to connect to backend server`

**Checklist:**
- [ ] `VITE_API_URL` is set in Vercel (not just locally)
- [ ] Backend is deployed and running
- [ ] Backend URL is accessible (test with curl/browser)
- [ ] Backend URL uses `https://` (not `http://`)
- [ ] No trailing slash in `VITE_API_URL`
- [ ] Redeployed Vercel app after setting environment variable

### 404 Errors on Routes

**Error:** Page not found when navigating

**Solution:**
- Ensure `vercel.json` is in root directory
- Verify `rewrites` configuration in `vercel.json`
- Check build output is `dist` directory
- Review Vercel deployment logs

### Data Not Saving

**Check:**
1. Backend is receiving requests (check backend logs)
2. Backend database file is writable
3. Backend has proper error handling
4. Check backend response status (should be 201 for registration)

## Production Checklist

- [ ] `VITE_API_URL` set in Vercel environment variables
- [ ] Backend deployed and accessible
- [ ] Backend CORS configured correctly
- [ ] All backend environment variables set
- [ ] User registration working
- [ ] Admin login working
- [ ] API calls successful

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check backend deployment logs
3. Verify all environment variables are set
4. Test API endpoints directly
