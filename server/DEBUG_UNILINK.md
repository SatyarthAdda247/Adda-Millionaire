# Debugging UniLink Creation

If unilinks are not being created, follow these steps to debug:

## Step 1: Check Server Logs

When you approve an affiliate, check the server console for these messages:

### Success Messages:
```
✅ Template created: {templateId}
✅ UniLink created: {unilink} (ID: {linkId})
Created new link entry for user {userId}
```

### Error Messages:
```
⚠️  Warning: No App IDs configured
Error creating UniLink Template: {error}
UniLink creation failed: {error}
No unilink created for user {userId}. Error: {error}
```

## Step 2: Check Required Configuration

### 1. API Key
```bash
# Check if API key is set
echo $APPTROVE_API_KEY
# Should show: 297c9ed1-c4b7-4879-b80a-1504140eb65e
```

### 2. App IDs (Most Common Issue)
The App IDs are **required** for template creation. Check your `.env` file:

```env
APPTROVE_ANDROID_APP_ID=your_10_character_id
APPTROVE_IOS_APP_ID=your_10_character_id
```

**If App IDs are missing**, the template creation will fail with an error like:
- "App ID is required"
- "Invalid app ID"
- "App not found"

### 3. Domain
```env
APPTROVE_DOMAIN=your_domain.u9ilnk.me
```

## Step 3: Test Template Creation Manually

You can test if the API is working by checking the server logs when approving:

1. **Approve an affiliate** from admin dashboard
2. **Check server console** for detailed error messages
3. **Look for**:
   - Template creation attempt
   - API response errors
   - Missing configuration warnings

## Step 4: Common Errors and Solutions

### Error: "Android App ID is required"
**Solution**: 
1. Go to AppTrove Dashboard → Settings → Apps
2. Find your Android app
3. Copy the 10-character App ID
4. Add to `.env`: `APPTROVE_ANDROID_APP_ID=your_id_here`
5. Restart server

### Error: "Template creation failed"
**Possible causes**:
- Missing App IDs
- Invalid domain
- API key not working
- App not configured in AppTrove

**Solution**:
1. Check all environment variables are set
2. Verify API key is correct
3. Check AppTrove dashboard that your app exists
4. Try creating a template manually in AppTrove dashboard

### Error: "UniLink URL not found in API response"
**Solution**:
- The API response structure might be different
- Check server logs for the full API response
- The system tries multiple endpoints, but might need adjustment

## Step 5: Check Database

After approval, check if link was saved:

```bash
# Check database.json
cat server/data/database.json | grep -A 5 "links"
```

Look for entries like:
```json
{
  "id": "...",
  "userId": "user_id",
  "link": "https://track.u9ilnk.me/...",
  "linkId": "...",
  "templateId": "..."
}
```

## Step 6: Verify in AppTrove Dashboard

1. Log in to [AppTrove Dashboard](https://dashboard.apptrove.com)
2. Go to **Unilink Management**
3. Check if templates/links were created
4. If not, the API call failed

## Step 7: Test API Directly

You can test the AppTrove API directly:

```bash
# Test template creation
curl -X POST 'https://api.apptrove.com/internal/link-template' \
  -H 'api-key: 297c9ed1-c4b7-4879-b80a-1504140eb65e' \
  -H 'Content-Type: application/json' \
  -d '{
    "status": "active",
    "name": "Test Template",
    "domain": "track.u9ilnk.me",
    "iosAppID": "your_ios_id",
    "androidAppID": "your_android_id",
    "desktopBhv": {"rdt": "store"},
    "notInstalled": {"iosRdt": "store", "androidRdt": "store"},
    "installed": {"iosRdt": "app_links", "androidRdt": "app_links"}
  }'
```

## Quick Fix Checklist

- [ ] API key is set in `.env`
- [ ] App IDs are set in `.env` (10 characters each)
- [ ] Domain is set in `.env`
- [ ] Server was restarted after adding env variables
- [ ] Check server logs when approving
- [ ] Verify in AppTrove dashboard
- [ ] Check database.json for saved links

## Still Not Working?

1. **Check server logs** - they show detailed error messages
2. **Try approving again** - sometimes it's a temporary API issue
3. **Verify App IDs** - this is the most common issue
4. **Contact AppTrove support** - if API key and App IDs are correct

The system will log all errors to help you debug!
