# Vercel Form Setup - Quick Reference

## ✅ What's Been Configured

1. **Centralized API Configuration** (`src/lib/apiConfig.ts`)
   - Automatically detects Vercel deployment
   - Uses `VITE_API_URL` environment variable
   - Provides helpful console warnings if not configured

2. **Improved Error Handling** (`src/components/SignupForm.tsx`)
   - Better error messages for production vs development
   - Clear instructions when backend is unavailable

3. **Backend CORS** (`server/server.js`)
   - Already configured to allow `https://adda-millionaire.vercel.app`
   - Allows all `*.vercel.app` preview deployments
   - Supports both production and development

## 🚀 Required Steps for Vercel Deployment

### 1. Set Environment Variable (CRITICAL)

**In Vercel Dashboard:**
1. Go to your project → **Settings** → **Environment Variables**
2. Add:
   ```
   Name: VITE_API_URL
   Value: https://your-backend-url.com
   ```
3. Select all environments (Production, Preview, Development)
4. **Save and Redeploy**

### 2. Verify Backend is Running

Test your backend:
```bash
curl https://your-backend-url.com/api/health
```

Should return: `{"status":"ok","message":"Server is running"}`

### 3. Test Form Submission

1. Visit your Vercel site: `https://adda-millionaire.vercel.app`
2. Open browser DevTools (F12) → Console
3. Fill out and submit the registration form
4. Check Network tab for POST request to `/api/users/register`
5. Verify response status is `201 Created`

## 🔍 Debugging

### Check API URL
Open browser console on your Vercel site. You should see:
```
🌐 API Base URL: https://your-backend-url.com
```

If you see a warning, `VITE_API_URL` is not set correctly.

### Common Issues

**"Failed to fetch" error:**
- ✅ Check `VITE_API_URL` is set in Vercel
- ✅ Verify backend is accessible
- ✅ Ensure backend URL uses `https://` (not `http://`)
- ✅ Redeploy Vercel app after setting environment variable

**CORS error:**
- ✅ Backend CORS already configured for Vercel
- ✅ Check backend logs for CORS rejections
- ✅ Verify backend is running

**Data not saving:**
- ✅ Check backend logs for incoming requests
- ✅ Verify backend database is writable
- ✅ Check response status (should be 201)

## 📝 Environment Variables Checklist

### Frontend (Vercel)
- [ ] `VITE_API_URL` - Your backend URL (e.g., `https://edurise-backend.railway.app`)

### Backend (Railway/Render/etc.)
- [ ] `PORT` - Server port (default: 3001)
- [ ] `NODE_ENV` - Set to `production`
- [ ] `FRONTEND_URL` - `https://adda-millionaire.vercel.app`
- [ ] `APPTROVE_API_KEY` - AppTrove API credentials
- [ ] `APPTROVE_SECRET_ID` - AppTrove Secret ID
- [ ] `APPTROVE_SECRET_KEY` - AppTrove Secret Key
- [ ] `GOOGLE_CLIENT_ID` - For admin OAuth
- [ ] `GOOGLE_CLIENT_SECRET` - For admin OAuth
- [ ] `ADMIN_EMAILS` - Comma-separated admin emails
- [ ] `SESSION_SECRET` - Random secret string

## ✨ Features

- ✅ Form validation
- ✅ Error handling
- ✅ Success messages
- ✅ Data persistence
- ✅ Social media handles support
- ✅ Admin approval workflow

## 📚 More Details

See `VERCEL_SETUP.md` for comprehensive deployment guide.
