# Quick Start Guide

## Starting the Application

### 1. Start Backend Server (Required)

The backend server must be running for the frontend to work.

```bash
cd server
npm install  # Only needed first time
npm start    # Or use 'npm run dev' for auto-reload
```

The backend will start on `http://localhost:3001`

### 2. Start Frontend (in a new terminal)

```bash
# From project root
npm install  # Only needed first time
npm run dev
```

The frontend will start on `http://localhost:8080` (or the port shown in terminal)

## Troubleshooting

### Error: `ERR_BLOCKED_BY_CLIENT` or `Failed to fetch`

This means the backend server is not running. 

**Solution:**
1. Make sure the backend server is running on port 3001
2. Check the terminal where you ran `npm start` in the `server` directory
3. Look for: `🚀 Server started successfully!` message
4. Verify by visiting: `http://localhost:3001/api/health`

### Port Already in Use

If port 3001 is already in use:

```bash
# Find what's using the port
lsof -ti:3001

# Kill the process (replace PID with actual process ID)
kill -9 PID

# Or change the port in server/.env
PORT=3002
```

### CORS Errors

If you see CORS errors:
1. Make sure `FRONTEND_URL` in `server/.env` matches your frontend URL
2. Default frontend URL is `http://localhost:8080`
3. Backend CORS is configured to allow localhost origins in development

## Environment Variables

### Backend (`server/.env`)

Create `server/.env` file (copy from `server/.env.example`):

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
APPTROVE_API_KEY=your_api_key
# ... other variables
```

### Frontend

Frontend uses `VITE_API_URL` environment variable. Defaults to `http://localhost:3001` if not set.

For production, set in Vercel:
```
VITE_API_URL=https://your-backend-url.com
```

## Testing

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3001/api/health
   ```
   Should return: `{"status":"ok"}`

2. **Frontend:**
   - Open `http://localhost:8080`
   - Try registering a new user
   - Check browser console for errors

## Common Issues

### Database File Not Found
- The server will create `server/data/database.json` automatically
- Make sure the `server/data` directory exists and is writable

### Module Not Found
- Run `npm install` in both root and `server` directories
- Delete `node_modules` and `package-lock.json`, then reinstall

### Port Conflicts
- Backend: Change `PORT` in `server/.env`
- Frontend: Change port in `vite.config.ts` or use `npm run dev -- --port 8081`
