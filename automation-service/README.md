# AppTrove Automation Service

Separate service for browser automation (link creation).

## Why Separate Service?

Vercel serverless has limitations:
- 50MB deployment size (browser is ~200MB)
- 10-60 second timeout
- Memory constraints

This service runs on Railway/Render with full browser support.

## Local Testing

```bash
# Install dependencies
pip install -r requirements.txt
playwright install chromium

# Set environment variables
export APPTROVE_DASHBOARD_EMAIL=your-email@example.com
export APPTROVE_DASHBOARD_PASSWORD=your-password
export AUTOMATION_API_KEY=your-secret-key

# Run
python main.py

# Test
curl -X POST http://localhost:8000/create-link \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "wBehUW",
    "link_name": "Test Link",
    "campaign": "test_campaign",
    "api_key": "your-secret-key"
  }'
```

## Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Set environment variables
railway variables set APPTROVE_DASHBOARD_EMAIL=your-email
railway variables set APPTROVE_DASHBOARD_PASSWORD=your-password
railway variables set AUTOMATION_API_KEY=your-secret-key

# Deploy
railway up

# Get URL
railway domain
```

## Deploy to Render

1. Create new Web Service
2. Connect GitHub repo
3. Set environment variables
4. Deploy

## Environment Variables

Required:
- `APPTROVE_DASHBOARD_EMAIL` - AppTrove login email
- `APPTROVE_DASHBOARD_PASSWORD` - AppTrove login password
- `AUTOMATION_API_KEY` - API key for authentication

Optional:
- `PORT` - Port to run on (default: 8000)

## API Endpoints

### POST /create-link
Create a new AppTrove link via browser automation.

Request:
```json
{
  "template_id": "wBehUW",
  "link_name": "Affiliate Link",
  "campaign": "affiliate_campaign",
  "api_key": "your-secret-key"
}
```

Response (Success):
```json
{
  "success": true,
  "unilink": "https://applink.reevo.in/d/xyz123",
  "linkId": "xyz123",
  "createdVia": "automation"
}
```

### GET /health
Health check endpoint.

Response:
```json
{
  "status": "ok",
  "credentials_configured": true
}
```
