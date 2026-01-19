# Production Setup Guide for Browser Automation

## Overview

The browser automation feature uses Puppeteer to create links in AppTrove dashboard. For production deployment, you need to ensure proper configuration.

## Production Considerations

### Option 1: Self-Hosted Browser (Recommended for VPS/Dedicated Servers)

**Requirements:**
- Server with at least 2GB RAM
- Chrome/Chromium installed
- Sufficient disk space

**Setup Steps:**

1. **Install Chrome/Chromium on server:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install -y chromium-browser
   
   # Or install Google Chrome
   wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
   sudo apt-get install -y ./google-chrome-stable_current_amd64.deb
   ```

2. **Set executable path in .env:**
   ```env
   PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
   # OR
   PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
   ```

3. **Install Puppeteer:**
   ```bash
   npm install puppeteer
   ```

### Option 2: Browser Service (Recommended for Cloud/Hosting Platforms)

Use a managed browser service like Browserless.io or self-host Browserless.

**Setup with Browserless.io:**

1. Sign up at https://www.browserless.io/
2. Get your WebSocket endpoint
3. Add to `.env`:
   ```env
   PUPPETEER_WS_ENDPOINT=wss://chrome.browserless.io?token=YOUR_TOKEN
   ```

**Self-Host Browserless:**

```bash
docker run -p 3000:3000 browserless/chrome
```

Then set:
```env
PUPPETEER_WS_ENDPOINT=ws://localhost:3000
```

### Option 3: Manual Workflow (Fallback)

If browser automation isn't feasible in production:

1. Disable automation by not setting `APPTROVE_EMAIL` and `APPTROVE_PASSWORD`
2. Use the manual link assignment workflow in admin dashboard
3. Create links manually in AppTrove dashboard and assign them

## Platform-Specific Notes

### Heroku
- Use buildpack: `https://github.com/jontewks/puppeteer-heroku-buildpack`
- Or use Browserless.io service

### AWS Lambda / Serverless
- Use AWS Lambda Layer for Puppeteer
- Or use Browserless.io service
- Consider timeout limits (max 15 minutes)

### DigitalOcean / VPS
- Install Chrome/Chromium directly
- Set `PUPPETEER_EXECUTABLE_PATH`
- Ensure sufficient resources

### Docker
- Use official Puppeteer Docker image
- Or install Chrome in your Dockerfile:
  ```dockerfile
  FROM node:18
  RUN apt-get update && apt-get install -y chromium
  ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
  ```

## Environment Variables

```env
# Required for browser automation
APPTROVE_EMAIL=your-email@example.com
APPTROVE_PASSWORD=your-password

# Optional: Browser configuration
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_WS_ENDPOINT=wss://chrome.browserless.io?token=YOUR_TOKEN

# Optional: Default values
APPTROVE_DEFAULT_CAMPAIGN=Affiliate Campaign
APPTROVE_DEEP_LINKING=default
```

## Testing in Production

1. **Test browser automation:**
   ```bash
   # Create a test link via API
   curl -X POST http://your-domain/api/apptrove/templates/wBehUW/create-link \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Link", "userId": "test-user-id"}'
   ```

2. **Check logs** for automation status
3. **Verify link** appears in AppTrove dashboard

## Troubleshooting

### "Puppeteer not installed"
```bash
npm install puppeteer
```

### "Chrome/Chromium not found"
- Install Chrome/Chromium on server
- Set `PUPPETEER_EXECUTABLE_PATH` in .env

### "Browser automation failed"
- Check AppTrove credentials
- Verify network connectivity
- Check server resources (RAM/CPU)
- Review error logs for specific issues

### "Timeout errors"
- Increase timeout in code
- Use a browser service for better reliability
- Check server performance

## Performance Considerations

- **Resource Usage:** Each automation uses ~200-500MB RAM
- **Concurrent Requests:** Limit concurrent automations to avoid overload
- **Caching:** Consider caching browser instances for multiple requests
- **Queue System:** Use a job queue (Bull, BullMQ) for link creation

## Security Considerations

1. **Credentials:** Never commit `.env` file
2. **Rate Limiting:** Implement rate limiting on link creation endpoint
3. **Authentication:** Ensure admin authentication is enabled
4. **Monitoring:** Monitor for failed automations and suspicious activity

## Recommended Production Setup

1. **Use Browserless.io** or similar service (most reliable)
2. **Implement job queue** for link creation (better UX)
3. **Add retry logic** for failed automations
4. **Monitor and alert** on failures
5. **Keep manual workflow** as fallback
