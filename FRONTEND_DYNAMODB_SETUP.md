# Frontend DynamoDB Setup Guide

This guide explains how to use DynamoDB directly from the frontend, eliminating the need for a separate backend server.

## ⚠️ Security Warning

**IMPORTANT**: AWS credentials will be exposed in the frontend bundle. While we use Vercel environment variables, anyone can view these credentials in the browser's developer tools.

**Recommended for**: 
- Prototypes and MVPs
- Low-security applications
- When you need a simple, serverless solution

**Not recommended for**:
- Production applications with sensitive data
- High-security requirements
- Applications handling payment information

**Better alternatives**:
- AWS Amplify (recommended)
- Vercel Serverless Functions
- API Gateway + Lambda

## Setup Steps

### 1. Install Dependencies

Dependencies are already installed:
- `@aws-sdk/client-dynamodb`
- `@aws-sdk/lib-dynamodb`
- `uuid`

### 2. Set Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables:

```env
VITE_AWS_REGION=ap-south-1
VITE_AWS_ACCESS_KEY_ID=your-aws-access-key-id
VITE_AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

# Optional: Custom table names
VITE_DYNAMODB_USERS_TABLE=edurise-users
VITE_DYNAMODB_LINKS_TABLE=edurise-links
VITE_DYNAMODB_ANALYTICS_TABLE=edurise-analytics
```

**Important**: 
- Select **Production**, **Preview**, and **Development** environments
- **Redeploy** after adding environment variables

### 3. Create DynamoDB Tables

If you haven't already, create the tables:

```bash
cd server
node setup-dynamodb.js
```

Or create them manually in AWS Console:
- `edurise-users` (Primary Key: `id`, String)
- `edurise-links` (Primary Key: `id`, String)
- `edurise-analytics` (Primary Key: `id`, String)

### 4. Configure IAM Permissions

Your AWS credentials need these DynamoDB permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-south-1:*:table/edurise-users",
        "arn:aws:dynamodb:ap-south-1:*:table/edurise-links",
        "arn:aws:dynamodb:ap-south-1:*:table/edurise-analytics"
      ]
    }
  ]
}
```

### 5. Test the Form

1. Deploy to Vercel (or run locally)
2. Fill out the registration form
3. Submit - data should save directly to DynamoDB
4. Check AWS Console → DynamoDB → `edurise-users` table to verify

## How It Works

1. **Frontend checks** if `VITE_AWS_ACCESS_KEY_ID` is set
2. **If set**: Uses direct DynamoDB access (no backend needed)
3. **If not set**: Falls back to backend API (`VITE_API_URL`)

This provides a seamless fallback - if DynamoDB credentials aren't configured, it still works with a backend.

## Local Development

For local development, create a `.env.local` file:

```env
VITE_AWS_REGION=ap-south-1
VITE_AWS_ACCESS_KEY_ID=your-access-key
VITE_AWS_SECRET_ACCESS_KEY=your-secret-key
```

**Never commit `.env.local` to git!**

## Security Best Practices

1. **Use IAM Roles** (if possible):
   - Create a dedicated IAM user for frontend
   - Grant only necessary DynamoDB permissions
   - Use least privilege principle

2. **Rotate Credentials Regularly**:
   - Change AWS keys periodically
   - Update Vercel environment variables

3. **Monitor Usage**:
   - Set up AWS CloudWatch alarms
   - Monitor DynamoDB costs
   - Set up billing alerts

4. **Consider Rate Limiting**:
   - Implement client-side rate limiting
   - Use DynamoDB on-demand pricing (already configured)

## Troubleshooting

### "AWS credentials not configured" Error

**Solution**: Set `VITE_AWS_ACCESS_KEY_ID` and `VITE_AWS_SECRET_ACCESS_KEY` in Vercel environment variables and redeploy.

### "Access Denied" Error

**Solution**: Check IAM permissions. The credentials need DynamoDB read/write access.

### "Table not found" Error

**Solution**: Run `node server/setup-dynamodb.js` to create tables, or create them manually in AWS Console.

### Form Still Calls Backend

**Solution**: Check that environment variables are set correctly. The frontend checks for `VITE_AWS_ACCESS_KEY_ID` - if it's not found, it falls back to backend.

## Cost Considerations

DynamoDB on-demand pricing:
- **Storage**: First 25 GB free, then $0.25/GB/month
- **Read/Write**: $1.25 per million requests
- **Very affordable** for small to medium applications

## Migration from Backend

If you're migrating from backend to frontend-only:

1. Set Vercel environment variables
2. Deploy frontend
3. Test form submission
4. Verify data in DynamoDB
5. Backend can be shut down (optional)

The frontend will automatically use DynamoDB if credentials are configured, otherwise it falls back to backend.
