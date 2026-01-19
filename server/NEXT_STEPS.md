# Next Steps: Complete AppTrove Setup

## ✅ Completed
- ✅ API Key configured: `297c9ed1-c4b7-4879-b80a-1504140eb65e`
- ✅ SDK Key configured: `5d11fe82-cab7-4b00-87d0-65a5fa40232f`
- ✅ `.env` file created in `/server` directory

## ⚠️ Still Need to Configure

### 1. Get Your App IDs from AppTrove Dashboard

1. Log in to [AppTrove Dashboard](https://dashboard.apptrove.com)
2. Go to **Settings** → **Apps**
3. Find your iOS app → Copy the **10-character App ID** (format: `abcd_12345`)
4. Find your Android app → Copy the **10-character App ID**
5. Update `.env` file:
   ```env
   APPTROVE_IOS_APP_ID=your_actual_ios_app_id
   APPTROVE_ANDROID_APP_ID=your_actual_android_app_id
   ```

### 2. Get Your UniLink Domain

1. In AppTrove Dashboard, check your domain settings
2. Update `.env`:
   ```env
   APPTROVE_DOMAIN=your_actual_domain.u9ilnk.me
   ```

### 3. Configure App Store URLs

Update with your actual app store links:
```env
APPTROVE_IOS_STORE_URL=https://apps.apple.com/app/your-actual-app-id
APPTROVE_ANDROID_STORE_URL=https://play.google.com/store/apps/details?id=your.actual.package
```

### 4. (Optional) Deep Linking Configuration

If you want deep linking to work:
- Get iOS Team ID and Bundle ID from Apple Developer account
- Get Android SHA256 fingerprint from your app
- Update these in `.env`

## 🚀 Testing the Integration

### Step 1: Restart Server
```bash
cd server
npm run dev
```

### Step 2: Approve an Affiliate
1. Go to Admin Dashboard
2. Find a pending affiliate
3. Click "Approve"
4. Check server logs for:
   - `✅ Template created: {templateId}`
   - `✅ UniLink created: {unilink}`

### Step 3: Verify in AppTrove
1. Log in to AppTrove Dashboard
2. Go to **Unilink Management**
3. You should see the new template and link

### Step 4: Test Analytics
```bash
# After approving, sync analytics
curl -X POST http://localhost:3001/api/users/{userId}/sync-analytics
```

## 📊 What Gets Tracked

Once configured, each affiliate's unilink will track:
- ✅ **Clicks**: Every click on their link
- ✅ **Impressions**: When link is displayed
- ✅ **Installs**: App installations from the link
- ✅ **Conversions**: Purchases/subscriptions
- ✅ **Revenue**: Total revenue generated

## 🔍 Finding Missing Information

### App IDs Location
- AppTrove Dashboard → Settings → Apps → [Your App] → App ID

### Domain Location
- AppTrove Dashboard → Settings → Domain/Branded Domain

### App Store URLs
- iOS: Your App Store listing URL
- Android: Your Play Store listing URL

## ⚡ Quick Test

Once you've added App IDs and domain, test by approving an affiliate. The system will:
1. Create a template automatically
2. Create a unilink from that template
3. Store it in the database
4. Return the unilink URL

Check the response when approving - it will show the unilink URL if successful!
