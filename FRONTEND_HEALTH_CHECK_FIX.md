# Frontend Health Check Fix

## Issue
`curl https://partners.addaeducation.com/health` returns HTML instead of JSON.

## Root Cause
- Vite dev server plugin only works in development mode
- Production uses `serve` static file server, which doesn't have the middleware
- `/health` route doesn't exist in the built React app, so it falls back to `index.html`

## Solution

### Option 1: Static File (Implemented)
Created `/health.json` in `public/` folder:
```json
{"status":"ok","service":"Partners Portal Frontend"}
```

Configured `serve.json` to rewrite `/health` → `/health.json`

### Option 2: Nginx/Apache Rewrite (Alternative)
If using Nginx or Apache, add rewrite rule:
```nginx
location /health {
    rewrite ^/health$ /health.json last;
}
```

### Option 3: Custom Server Script (Alternative)
Create a simple Node.js server that handles `/health`:
```javascript
const express = require('express');
const { serveStatic } = require('serve-static');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Partners Portal Frontend' });
});

app.use(serveStatic('dist'));
app.listen(8080);
```

## Testing

### Local Development
```bash
cd frontend
npm run dev
curl http://localhost:8080/health
# Should return JSON
```

### Production Build
```bash
cd frontend
npm run build
npx serve -s dist -l 8080
curl http://localhost:8080/health
# Should return JSON from health.json
```

### Production Deployment
After deploying, test:
```bash
curl https://partners.addaeducation.com/health
# Expected: {"status":"ok","service":"Partners Portal Frontend"}
```

## Note on DNS Error
The error `Could not resolve host: api.partners.addaeducation.com` indicates:
- DNS A record for `api.partners.addaeducation.com` is not configured
- This is separate from the frontend health check issue
- Configure DNS: `api.partners.addaeducation.com` → Backend EC2 IP
