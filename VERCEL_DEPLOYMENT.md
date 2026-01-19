# Vercel Deployment Guide

This guide will help you deploy the EduRise affiliate program to Vercel with all functionalities working.

## Architecture

- **Frontend**: Deployed on Vercel (React/Vite)
- **Backend**: Deployed separately (Railway, Render, or similar) OR as Vercel serverless functions

## Option 1: Separate Backend Deployment (Recommended)

### Step 1: Deploy Frontend to Vercel

1. **Connect your GitHub repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Vercel project settings:**
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root of repository)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Set Environment Variables in Vercel:**
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

### Step 2: Deploy Backend Separately

#### Option A: Railway (Recommended)

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repository
4. Set root directory to `server`
5. Add environment variables:
   ```
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://adda-millionaire.vercel.app
   APPTROVE_API_KEY=your_api_key
   APPTROVE_SECRET_ID=your_secret_id
   APPTROVE_SECRET_KEY=your_secret_key
   APPTROVE_TEMPLATE_ID=wBehUW
   DB_PATH=./data/database.json
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ADMIN_EMAILS=admin@example.com
   SESSION_SECRET=your-random-secret-key
   ```
6. Railway will automatically detect Node.js and deploy
7. Copy the Railway URL and update `VITE_API_URL` in Vercel

#### Option B: Render

1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add all environment variables (same as Railway)
6. Copy the Render URL and update `VITE_API_URL` in Vercel

### Step 3: Update CORS in Backend

The backend CORS configuration already includes:
- `https://adda-millionaire.vercel.app`
- Any `*.vercel.app` preview deployments

If you're using a different Vercel domain, update `server/server.js`:
```javascript
const allowedOrigins = [
  'https://your-vercel-domain.vercel.app',
  // ... other origins
];
```

## Option 2: Vercel Serverless Functions (Advanced)

If you want to deploy the backend as Vercel serverless functions, you'll need to:

1. Create `api/` directory in the root
2. Convert Express routes to serverless functions
3. Handle file system operations differently (use Vercel KV or external storage)

This is more complex and not recommended unless you're familiar with serverless architecture.

## Environment Variables Checklist

### Frontend (Vercel)
- `VITE_API_URL` - Your backend API URL

### Backend (Railway/Render)
- `PORT` - Server port (usually 3001)
- `NODE_ENV` - Set to `production`
- `FRONTEND_URL` - Your Vercel frontend URL
- `APPTROVE_API_KEY` - AppTrove API key
- `APPTROVE_SECRET_ID` - AppTrove Secret ID
- `APPTROVE_SECRET_KEY` - AppTrove Secret Key
- `APPTROVE_TEMPLATE_ID` - Template ID (wBehUW)
- `DB_PATH` - Database file path
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `ADMIN_EMAILS` - Comma-separated admin emails
- `SESSION_SECRET` - Random secret for sessions

## Testing Deployment

1. **Test Frontend:**
   - Visit your Vercel URL
   - Check if the page loads correctly
   - Try signing up a new user

2. **Test Backend:**
   - Visit `https://your-backend-url.com/api/health`
   - Should return `{ "status": "ok" }`

3. **Test Integration:**
   - Try user registration
   - Try admin login
   - Check if API calls are working

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` in backend matches your Vercel URL
- Check that backend CORS includes your Vercel domain
- Verify `VITE_API_URL` in Vercel matches your backend URL

### 404 Errors
- Ensure `vercel.json` is in the root directory
- Check that build output is `dist`
- Verify all routes are handled by the SPA rewrite rule

### API Connection Errors
- Verify `VITE_API_URL` is set correctly in Vercel
- Check backend is running and accessible
- Ensure backend CORS allows your Vercel domain

### Database Issues
- Ensure `DB_PATH` is writable in your backend hosting
- Check file permissions on Railway/Render
- Consider migrating to a proper database (PostgreSQL, MongoDB) for production

## Production Checklist

- [ ] All environment variables set
- [ ] CORS configured correctly
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] User registration working
- [ ] Admin login working
- [ ] AppTrove integration working
- [ ] Analytics fetching working
- [ ] Database persistence working

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check backend deployment logs
3. Verify all environment variables are set
4. Test API endpoints directly with curl or Postman
