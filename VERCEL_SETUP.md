# Vercel Deployment Setup for adda-millionaire.vercel.app

This guide will help you configure the application to work on `adda-millionaire.vercel.app`.

## Quick Setup

### 1. Set Environment Variable in Vercel

Go to your Vercel project settings → Environment Variables and add:

```
VITE_API_URL=https://your-backend-url.com
```

**Important:** Replace `https://your-backend-url.com` with your actual backend API URL.

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

1. **Test Frontend:**
   - Visit `https://adda-millionaire.vercel.app`
   - Check browser console for any API errors

2. **Test Backend:**
   - Visit `https://your-backend-url.com/api/health`
   - Should return `{ "status": "ok" }`

3. **Test Integration:**
   - Try user registration
   - Try admin login
   - Check API calls in browser Network tab

## Troubleshooting

### CORS Errors
- Verify `VITE_API_URL` is set correctly in Vercel
- Check backend CORS includes `https://adda-millionaire.vercel.app`
- Ensure backend `FRONTEND_URL` matches your Vercel domain

### API Connection Errors
- Check `VITE_API_URL` in Vercel environment variables
- Verify backend is running and accessible
- Check backend logs for errors

### 404 Errors
- Ensure `vercel.json` is in root directory
- Verify build output is `dist`
- Check Vercel deployment logs

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
