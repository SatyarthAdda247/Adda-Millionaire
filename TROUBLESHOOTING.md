# Troubleshooting Guide

## ERR_BLOCKED_BY_CLIENT Error

**Error:** `Failed to load resource: net::ERR_BLOCKED_BY_CLIENT`

### Cause
This error is typically caused by browser extensions (ad blockers, privacy extensions) blocking requests to `localhost` or specific domains.

### Solutions

1. **Disable Browser Extensions Temporarily**
   - Open browser in Incognito/Private mode (extensions are usually disabled)
   - Or disable ad blockers/privacy extensions for localhost

2. **Whitelist localhost in Extensions**
   - AdBlock Plus: Settings → Advanced → Allowlist → Add `@@||localhost^`
   - uBlock Origin: Click extension icon → Open dashboard → My filters → Add `@@||localhost^$document`
   - Privacy Badger: Settings → Disable for localhost

3. **Use Different Port**
   - Some extensions block port 3001
   - Try changing backend port in `.env`: `PORT=3002`

4. **Use 127.0.0.1 instead of localhost**
   - Update `API_BASE_URL` to use `http://127.0.0.1:3001` instead of `http://localhost:3001`

5. **Check Browser Console**
   - Open DevTools → Console
   - Look for extension-related warnings
   - Check Network tab for blocked requests

### For Production (Vercel)
- This error shouldn't occur on production
- If it does, check browser extensions aren't blocking your domain
- Verify CORS is configured correctly on backend

## Form Not Saving Data

### Check DynamoDB Configuration

1. **Verify Environment Variables**
   ```bash
   cd server
   cat .env | grep AWS
   ```

2. **Check Tables Exist**
   - AWS Console → DynamoDB → Tables
   - Should see: `edurise-users`, `edurise-links`, `edurise-analytics`

3. **Test Connection**
   ```bash
   cd server
   node setup-dynamodb.js
   ```
   Should show tables already exist (not an error)

4. **Check Backend Logs**
   - Look for DynamoDB errors
   - Verify `USE_DYNAMODB=true` in `.env`

### Common Issues

**"Access Denied" Error**
- Check AWS credentials are correct
- Verify IAM permissions for DynamoDB

**"Table not found" Error**
- Run `node setup-dynamodb.js` to create tables
- Check table names match in `.env`

**Data Not Appearing**
- Check AWS region is correct (`ap-south-1`)
- Verify you're checking the right AWS account
- Check backend logs for errors

## Backend Not Starting

1. **Check Port Availability**
   ```bash
   lsof -ti:3001
   ```
   If process found, kill it: `kill -9 <PID>`

2. **Check Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Check Environment Variables**
   ```bash
   cat .env
   ```

4. **Check Logs**
   ```bash
   npm start
   ```
   Look for error messages

## Frontend Not Connecting to Backend

1. **Verify Backend is Running**
   ```bash
   curl http://localhost:3001/api/health
   ```
   Should return: `{"status":"ok","message":"Server is running"}`

2. **Check API URL**
   - Open browser console
   - Look for: `🌐 API Base URL: http://localhost:3001`

3. **Check CORS**
   - Backend should allow your frontend origin
   - Check `server.js` CORS configuration

4. **Check Network Tab**
   - Open DevTools → Network
   - Submit form
   - Check if request is sent
   - Check response status and error

## Still Having Issues?

1. Check backend logs for detailed error messages
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Ensure DynamoDB tables exist and are accessible
5. Test API endpoints directly with `curl` or Postman
