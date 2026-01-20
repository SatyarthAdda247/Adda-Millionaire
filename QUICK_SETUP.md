# Quick Setup - Frontend DynamoDB (No Backend Needed!)

## ✅ What's Done

1. ✅ Frontend DynamoDB client created (`src/lib/dynamodb.ts`)
2. ✅ SignupForm updated to use DynamoDB directly
3. ✅ Automatic fallback to backend if DynamoDB not configured
4. ✅ Dependencies installed

## 🚀 Setup in 3 Steps

### Step 1: Set Vercel Environment Variables

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add these (select all environments: Production, Preview, Development):

```
VITE_AWS_REGION=ap-south-1
VITE_AWS_ACCESS_KEY_ID=your-aws-access-key-id
VITE_AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
```

### Step 2: Redeploy

After adding environment variables, **redeploy** your Vercel project.

### Step 3: Test

1. Visit your Vercel site
2. Fill out the registration form
3. Submit - data saves directly to DynamoDB!
4. Check AWS Console → DynamoDB → `edurise-users` table

## 🎯 How It Works

- **If AWS credentials are set**: Form saves directly to DynamoDB (no backend needed!)
- **If AWS credentials are NOT set**: Falls back to backend API (backward compatible)

## 📋 Local Development

Create `.env.local` in project root:

```env
VITE_AWS_REGION=ap-south-1
VITE_AWS_ACCESS_KEY_ID=your-access-key
VITE_AWS_SECRET_ACCESS_KEY=your-secret-key
```

Then run:
```bash
npm run dev
```

## ⚠️ Security Note

AWS credentials will be visible in the frontend bundle. This is fine for:
- MVPs and prototypes
- Low-security applications
- Simple serverless solutions

For production apps with sensitive data, consider:
- AWS Amplify
- Vercel Serverless Functions
- API Gateway + Lambda

## 🔍 Troubleshooting

**Form still calls backend?**
- Check environment variables are set in Vercel
- Redeploy after adding variables
- Check browser console for errors

**"AWS credentials not configured" error?**
- Verify `VITE_AWS_ACCESS_KEY_ID` is set
- Check variable names start with `VITE_`
- Redeploy after changes

**"Access Denied" error?**
- Check IAM permissions for DynamoDB
- Verify table names match (`edurise-users`, etc.)

## 📚 More Info

See `FRONTEND_DYNAMODB_SETUP.md` for detailed documentation.
